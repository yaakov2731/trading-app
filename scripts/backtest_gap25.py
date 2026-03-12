#!/usr/bin/env python3
"""Backtest real de patrón GAP vs 25% del rango previo (ES=F, diario)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf


def _to_native(value):
    if isinstance(value, (np.floating, float)):
        return round(float(value), 4)
    if isinstance(value, (np.integer, int)):
        return int(value)
    return value


def run_backtest(symbol: str, start: str, end: str, quarter_pct: float) -> tuple[pd.DataFrame, dict]:
    df = yf.download(symbol, start=start, end=end, auto_adjust=False, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] for c in df.columns]

    df = df[["Open", "High", "Low", "Close"]].dropna().copy()
    df["prev_high"] = df["High"].shift(1)
    df["prev_low"] = df["Low"].shift(1)
    df["prev_close"] = df["Close"].shift(1)
    df["prev_range"] = df["prev_high"] - df["prev_low"]
    df = df[df["prev_range"] > 0].copy()

    df["gap"] = df["Open"] - df["prev_close"]
    df["gap_dir"] = np.where(df["gap"] > 0, "UP", np.where(df["gap"] < 0, "DOWN", "FLAT"))
    df = df[df["gap_dir"] != "FLAT"].copy()

    # Mean reversion target (hacia cierre previo) y continuation target (alejándose).
    df["target_mr"] = np.where(
        df["gap_dir"] == "UP",
        df["Open"] - df["prev_range"] * quarter_pct,
        df["Open"] + df["prev_range"] * quarter_pct,
    )
    df["target_ct"] = np.where(
        df["gap_dir"] == "UP",
        df["Open"] + df["prev_range"] * quarter_pct,
        df["Open"] - df["prev_range"] * quarter_pct,
    )

    df["hit_mr"] = np.where(df["gap_dir"] == "UP", df["Low"] <= df["target_mr"], df["High"] >= df["target_mr"])
    df["hit_ct"] = np.where(df["gap_dir"] == "UP", df["High"] >= df["target_ct"], df["Low"] <= df["target_ct"])

    def summarize(side: str) -> dict:
        s = df[df["gap_dir"] == side]
        only_mr = s["hit_mr"] & ~s["hit_ct"]
        only_ct = s["hit_ct"] & ~s["hit_mr"]
        ambig = s["hit_mr"] & s["hit_ct"]
        return {
            "n": len(s),
            "meanReversionHitPct": s["hit_mr"].mean() * 100,
            "continuationHitPct": s["hit_ct"].mean() * 100,
            "onlyMeanReversionPct": only_mr.mean() * 100,
            "onlyContinuationPct": only_ct.mean() * 100,
            "ambiguousPct": ambig.mean() * 100,
        }

    summary = {
        "symbol": symbol,
        "start": start,
        "end": end,
        "sampleSize": len(df),
        "quarterPct": quarter_pct,
        "up": summarize("UP"),
        "down": summarize("DOWN"),
    }
    summary = json.loads(json.dumps(summary, default=_to_native))

    out = df.reset_index()[
        [
            "Date",
            "Open",
            "High",
            "Low",
            "Close",
            "prev_close",
            "prev_range",
            "gap",
            "gap_dir",
            "target_mr",
            "target_ct",
            "hit_mr",
            "hit_ct",
        ]
    ]
    return out, summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Backtest gap 25% sobre ES=F diario")
    parser.add_argument("--symbol", default="ES=F")
    parser.add_argument("--start", default="2010-01-01")
    parser.add_argument("--end", default="2026-03-12")
    parser.add_argument("--quarter-pct", type=float, default=0.25)
    parser.add_argument("--summary-out", default="analysis/gap25_backtest_summary.json")
    parser.add_argument("--csv-out", default="")
    args = parser.parse_args()

    out_df, summary = run_backtest(args.symbol, args.start, args.end, args.quarter_pct)

    summary_path = Path(args.summary_out)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    if args.csv_out:
        csv_path = Path(args.csv_out)
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        out_df.to_csv(csv_path, index=False)

    print(json.dumps(summary, indent=2))
    print(f"summary_saved={summary_path}")
    if args.csv_out:
        print(f"csv_saved={args.csv_out}")


if __name__ == "__main__":
    main()
