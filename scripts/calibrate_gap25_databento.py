#!/usr/bin/env python3
"""Calibración Gap25 con ES 1m Databento (archivo local parquet)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd


def load_daily_context(parquet_path: Path) -> tuple[pd.DataFrame, dict]:
    cols = ["open", "high", "low", "close", "volume"]
    df = pd.read_parquet(parquet_path, columns=cols)
    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError("Se esperaba DatetimeIndex en el parquet (ts_event).")
    if df.index.tz is None:
        df.index = df.index.tz_localize("UTC")
    ny = df.tz_convert("America/New_York")

    # RTH ES: 09:30-15:59 ET (barras de 1m por inicio)
    rth = ny.between_time("09:30", "15:59", inclusive="both").copy()
    rth["d"] = rth.index.date

    g = rth.groupby("d")
    daily = pd.DataFrame(
        {
            "open": g["open"].first(),
            "high": g["high"].max(),
            "low": g["low"].min(),
            "close": g["close"].last(),
            "bars": g.size(),
        }
    )
    daily = daily[daily["bars"] >= 300].copy()

    first_hour = (
        rth.between_time("09:30", "10:29", inclusive="both")
        .groupby("d")
        .agg(fh_high=("high", "max"), fh_low=("low", "min"))
    )
    post = rth.between_time("10:30", "15:59", inclusive="both").copy()
    post_by_day = {d: grp[["high", "low", "close"]].to_numpy(dtype=float) for d, grp in post.groupby("d")}

    daily["prev_high"] = daily["high"].shift(1)
    daily["prev_low"] = daily["low"].shift(1)
    daily["prev_close"] = daily["close"].shift(1)
    daily["prev_range"] = daily["prev_high"] - daily["prev_low"]
    daily = daily.join(first_hour, how="inner")
    daily = daily.dropna(subset=["prev_range", "prev_close"])
    daily = daily[daily["prev_range"] > 0]
    daily["gap"] = daily["open"] - daily["prev_close"]
    daily = daily[daily["gap"] != 0].copy()
    daily["side"] = np.where(daily["gap"] > 0, "UP", "DOWN")

    meta = {
        "rows_1m": int(len(df)),
        "range_start_utc": str(df.index.min()),
        "range_end_utc": str(df.index.max()),
        "days_model": int(len(daily)),
    }
    return daily, post_by_day, meta


def first_touch_gap25(daily: pd.DataFrame, post_by_day: dict) -> dict:
    out = {}
    for side in ["UP", "DOWN"]:
        sub = daily[daily["side"] == side]
        n = mr = ct = both = none = 0
        for d, row in sub.iterrows():
            arr = post_by_day.get(d)
            if arr is None:
                continue
            n += 1
            q = row["prev_range"] * 0.25
            if side == "UP":
                ex = row["fh_high"]
                mr_t, ct_t = ex - q, ex + q
            else:
                ex = row["fh_low"]
                mr_t, ct_t = ex + q, ex - q

            state = "NONE"
            for hi, lo, _ in arr:
                hit_mr = lo <= mr_t if side == "UP" else hi >= mr_t
                hit_ct = hi >= ct_t if side == "UP" else lo <= ct_t
                if hit_mr and hit_ct:
                    state = "BOTH"
                    break
                if hit_mr:
                    state = "MR"
                    break
                if hit_ct:
                    state = "CT"
                    break

            if state == "MR":
                mr += 1
            elif state == "CT":
                ct += 1
            elif state == "BOTH":
                both += 1
            else:
                none += 1

        out[side] = {
            "n": n,
            "mr_first_pct": (mr / n * 100) if n else 0,
            "ct_first_pct": (ct / n * 100) if n else 0,
            "both_pct": (both / n * 100) if n else 0,
            "none_pct": (none / n * 100) if n else 0,
        }
    return out


def eval_side(daily: pd.DataFrame, post_by_day: dict, side: str, entry_off: float, stop_off: float, tp_mult: float) -> dict:
    sub = daily[daily["side"] == side]
    n = wins = losses = amb = 0
    rr_sum = 0.0
    for d, row in sub.iterrows():
        arr = post_by_day.get(d)
        if arr is None:
            continue
        n += 1
        q = row["prev_range"] * tp_mult
        if side == "UP":
            ex = row["fh_high"]
            entry, stop, tgt = ex - entry_off, ex - entry_off + stop_off, ex - q
        else:
            ex = row["fh_low"]
            entry, stop, tgt = ex + entry_off, ex + entry_off - stop_off, ex + q

        rr_sum += abs(tgt - entry) / stop_off
        outcome = None
        for hi, lo, close in arr:
            sl = hi >= stop if side == "UP" else lo <= stop
            tp = lo <= tgt if side == "UP" else hi >= tgt
            if sl and tp:
                amb += 1
                outcome = "LOSS"
                break
            if sl:
                outcome = "LOSS"
                break
            if tp:
                outcome = "WIN"
                break

        if outcome is None:
            close = arr[-1, 2]
            pnl = (entry - close) if side == "UP" else (close - entry)
            outcome = "WIN" if pnl > 0 else "LOSS"

        if outcome == "WIN":
            wins += 1
        else:
            losses += 1

    wr = wins / n if n else 0.0
    rr = rr_sum / n if n else 0.0
    ev = wr * rr - (1 - wr)
    return {"trades": n, "wins": wins, "losses": losses, "ambiguous": amb, "wr": wr, "rr": rr, "expectancy_r": ev}


def calibrate(daily: pd.DataFrame, post_by_day: dict, side: str) -> dict:
    best = None
    for entry in np.arange(1.0, 6.25, 0.25):
        for stop in np.arange(3.5, 10.25, 0.25):
            m = eval_side(daily, post_by_day, side, float(entry), float(stop), 0.25)
            if m["rr"] < 1.2 or m["rr"] > 3.5:
                continue
            cand = {"entry_off": float(entry), "stop_off": float(stop), "tp_mult": 0.25, **m}
            if best is None:
                best = cand
                continue
            better = (
                cand["wr"] > best["wr"] + 1e-9
                or (abs(cand["wr"] - best["wr"]) <= 1e-9 and cand["expectancy_r"] > best["expectancy_r"] + 1e-9)
                or (
                    abs(cand["wr"] - best["wr"]) <= 1e-9
                    and abs(cand["expectancy_r"] - best["expectancy_r"]) <= 1e-9
                    and cand["ambiguous"] < best["ambiguous"]
                )
            )
            if better:
                best = cand
    if best is None:
        raise RuntimeError(f"No se pudo calibrar lado {side}")
    return best


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrar Gap25 con Databento 1m")
    parser.add_argument("--parquet", default=r"C:/Users/jcbru/OneDrive/Desktop/ES_1m_databento.parquet")
    parser.add_argument("--out", default="analysis/gap25_databento_calibration.json")
    args = parser.parse_args()

    parquet = Path(args.parquet)
    daily, post_by_day, meta = load_daily_context(parquet)
    ft = first_touch_gap25(daily, post_by_day)
    up = calibrate(daily, post_by_day, "UP")
    down = calibrate(daily, post_by_day, "DOWN")

    payload = {
        "source": str(parquet),
        "meta": meta,
        "first_touch_gap25": ft,
        "selected_for_app": {"UP": up, "DOWN": down},
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))
    print(f"saved={out}")


if __name__ == "__main__":
    main()
