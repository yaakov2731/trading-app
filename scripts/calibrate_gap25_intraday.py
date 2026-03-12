#!/usr/bin/env python3
"""Calibra entradas/salidas cerca de extremos con datos intradía (30m, 60 días)."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf


@dataclass
class TradeSample:
    side: str  # "UP" (gap up -> short) o "DOWN" (gap down -> long)
    prev_range: float
    extreme: float
    highs: np.ndarray
    lows: np.ndarray
    close_end: float


def load_rth_samples(symbol: str, period: str = "60d", interval: str = "30m") -> list[TradeSample]:
    df = yf.download(symbol, period=period, interval=interval, auto_adjust=False, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] for c in df.columns]
    df = df[["Open", "High", "Low", "Close"]].dropna()
    if df.empty:
        return []

    df = df.tz_convert("America/New_York")
    rth = df.between_time("09:30", "16:00", inclusive="both").copy()
    if rth.empty:
        return []

    samples: list[TradeSample] = []
    by_day = {d: g for d, g in rth.groupby(rth.index.date)}
    days = sorted(by_day.keys())

    for i in range(1, len(days)):
        d_prev = days[i - 1]
        d_cur = days[i]
        prev = by_day[d_prev]
        cur = by_day[d_cur]
        if len(prev) < 2 or len(cur) < 4:
            continue

        prev_high = float(prev["High"].max())
        prev_low = float(prev["Low"].min())
        prev_close = float(prev["Close"].iloc[-1])
        prev_range = prev_high - prev_low
        if prev_range <= 0:
            continue

        day_open = float(cur["Open"].iloc[0])  # 09:30 ET
        gap = day_open - prev_close
        if gap == 0:
            continue

        first_hour = cur.iloc[:2]  # 09:30 y 10:00
        after = cur.iloc[2:]       # desde 10:30
        if after.empty:
            continue

        if gap > 0:
            side = "UP"
            extreme = float(first_hour["High"].max())
        else:
            side = "DOWN"
            extreme = float(first_hour["Low"].min())

        samples.append(
            TradeSample(
                side=side,
                prev_range=float(prev_range),
                extreme=extreme,
                highs=after["High"].to_numpy(dtype=float),
                lows=after["Low"].to_numpy(dtype=float),
                close_end=float(after["Close"].iloc[-1]),
            )
        )

    return samples


def evaluate_params(samples: list[TradeSample], side: str, entry_off: float, stop_off: float, tp_mult: float) -> dict:
    side_samples = [s for s in samples if s.side == side]
    if not side_samples:
        return {
            "trades": 0,
            "wins": 0,
            "losses": 0,
            "ambiguous": 0,
            "nohit": 0,
            "wr": 0.0,
            "rr": 0.0,
            "expectancy_r": -1.0,
        }

    wins = losses = ambiguous = nohit = 0
    rr_sum = 0.0

    for s in side_samples:
        qmove = s.prev_range * tp_mult
        if side == "UP":  # short
            entry = s.extreme - entry_off
            stop = entry + stop_off
            target = s.extreme - qmove
        else:  # DOWN -> long
            entry = s.extreme + entry_off
            stop = entry - stop_off
            target = s.extreme + qmove

        # R:R por trade (target vs stop)
        reward = abs(target - entry)
        rr = reward / stop_off if stop_off > 0 else 0
        rr_sum += rr

        outcome = None  # "win"/"loss"
        for hi, lo in zip(s.highs, s.lows):
            if side == "UP":
                sl_hit = hi >= stop
                tp_hit = lo <= target
            else:
                sl_hit = lo <= stop
                tp_hit = hi >= target

            if sl_hit and tp_hit:
                ambiguous += 1
                outcome = "loss"  # conservador: si no se puede ordenar, se penaliza
                break
            if sl_hit:
                outcome = "loss"
                break
            if tp_hit:
                outcome = "win"
                break

        if outcome is None:
            nohit += 1
            # cierre del día como desempate simple
            pnl = (entry - s.close_end) if side == "UP" else (s.close_end - entry)
            outcome = "win" if pnl > 0 else "loss"

        if outcome == "win":
            wins += 1
        else:
            losses += 1

    trades = len(side_samples)
    wr = wins / trades if trades else 0.0
    rr_avg = rr_sum / trades if trades else 0.0
    expectancy_r = wr * rr_avg - (1 - wr)
    return {
        "trades": trades,
        "wins": wins,
        "losses": losses,
        "ambiguous": ambiguous,
        "nohit": nohit,
        "wr": wr,
        "rr": rr_avg,
        "expectancy_r": expectancy_r,
    }


def grid_search(samples: list[TradeSample], side: str) -> dict:
    best = None
    entry_vals = np.arange(2.5, 8.25, 0.25)
    stop_vals = np.arange(2.5, 9.25, 0.25)
    tp_vals = np.arange(0.18, 0.36, 0.01)

    for entry_off in entry_vals:
        for stop_off in stop_vals:
            for tp_mult in tp_vals:
                metrics = evaluate_params(samples, side, float(entry_off), float(stop_off), float(tp_mult))
                candidate = {
                    "entry_off": float(entry_off),
                    "stop_off": float(stop_off),
                    "tp_mult": float(tp_mult),
                    **metrics,
                }
                if best is None:
                    best = candidate
                    continue

                # Prioridad: expectativa > WR > menor ambigüedad > stop más corto
                better = (
                    candidate["expectancy_r"] > best["expectancy_r"] + 1e-9
                    or (
                        abs(candidate["expectancy_r"] - best["expectancy_r"]) <= 1e-9
                        and candidate["wr"] > best["wr"] + 1e-9
                    )
                    or (
                        abs(candidate["expectancy_r"] - best["expectancy_r"]) <= 1e-9
                        and abs(candidate["wr"] - best["wr"]) <= 1e-9
                        and candidate["ambiguous"] < best["ambiguous"]
                    )
                    or (
                        abs(candidate["expectancy_r"] - best["expectancy_r"]) <= 1e-9
                        and abs(candidate["wr"] - best["wr"]) <= 1e-9
                        and candidate["ambiguous"] == best["ambiguous"]
                        and candidate["stop_off"] < best["stop_off"]
                    )
                )
                if better:
                    best = candidate

    assert best is not None
    return best


def best_wr_with_fixed_tp25(samples: list[TradeSample], side: str) -> dict:
    best = None
    for entry_off in np.arange(2.5, 8.25, 0.25):
        for stop_off in np.arange(2.5, 9.25, 0.25):
            metrics = evaluate_params(samples, side, float(entry_off), float(stop_off), 0.25)
            rr = metrics["rr"]
            # Filtro de robustez para evitar configuraciones extremas.
            if rr < 1.1 or rr > 4.0:
                continue
            candidate = {
                "entry_off": float(entry_off),
                "stop_off": float(stop_off),
                "tp_mult": 0.25,
                **metrics,
            }
            if best is None:
                best = candidate
                continue
            if (
                candidate["wr"] > best["wr"] + 1e-9
                or (
                    abs(candidate["wr"] - best["wr"]) <= 1e-9
                    and candidate["expectancy_r"] > best["expectancy_r"] + 1e-9
                )
            ):
                best = candidate
    assert best is not None
    return best


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibración intradía de Gap25 contra extremos reales")
    parser.add_argument("--symbol", default="ES=F")
    parser.add_argument("--period", default="60d")
    parser.add_argument("--interval", default="30m")
    parser.add_argument("--out", default="analysis/gap25_intraday_calibration.json")
    args = parser.parse_args()

    samples = load_rth_samples(args.symbol, period=args.period, interval=args.interval)
    if not samples:
        raise SystemExit("No se pudieron construir muestras intradía.")

    baseline = {
        "UP": evaluate_params(samples, "UP", entry_off=4.0, stop_off=5.5, tp_mult=0.25),
        "DOWN": evaluate_params(samples, "DOWN", entry_off=4.0, stop_off=5.0, tp_mult=0.25),
    }
    best_up = grid_search(samples, "UP")
    best_down = grid_search(samples, "DOWN")
    robust_up = best_wr_with_fixed_tp25(samples, "UP")
    robust_down = best_wr_with_fixed_tp25(samples, "DOWN")

    payload = {
        "symbol": args.symbol,
        "period": args.period,
        "interval": args.interval,
        "samples_total": len(samples),
        "samples_up": sum(1 for s in samples if s.side == "UP"),
        "samples_down": sum(1 for s in samples if s.side == "DOWN"),
        "baseline": baseline,
        "best": {
            "UP": best_up,
            "DOWN": best_down,
        },
        "best_wr_tp25_robust": {
            "UP": robust_up,
            "DOWN": robust_down,
        },
        "selected_for_app": {
            "UP": robust_up,
            "DOWN": robust_down,
        },
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(json.dumps(payload, indent=2))
    print(f"saved={out_path}")


if __name__ == "__main__":
    main()
