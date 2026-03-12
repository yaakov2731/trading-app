const {
    instruments,
    entryModes,
    params,
    GAP25_BACKTEST,
    GAP25_INTRADAY_CALIBRATION,
    RANGE_BUCKET_KEYS,
    getRangeBucket,
    getSideCalibration,
    computeLevels,
    computeFilters,
    computeAdvancedFilters,
    computeSetupScore,
    setupScoreLabel,
    suggestEntryMode,
    getFilterStatusClass,
    getFilterIcon
} = require('./calculator');

// Standard test inputs representing a typical gap-down scenario
// Uses the current API: gapPct, prevRangeTotal, prevHigh/Low/Close/Open, prevPrevClose
const baseInputs = {
    prevHigh: 6100,
    prevLow: 6050,
    prevClose: 6080,
    prevOpen: 6060,
    prevPrevClose: 6040,
    todayOpen: 6065,
    extremeReal: 6045,
    instrumentKey: 'ES',
    entryModeKey: 'standard'
};

// Helper to create inputs with overrides
function inputs(overrides = {}) {
    return { ...baseInputs, ...overrides };
}

// ──────────────────────────────────────────────
// Configuration data tests
// ──────────────────────────────────────────────
describe('Configuration data', () => {
    test('all instruments have multiplier, name, and tick', () => {
        for (const [key, val] of Object.entries(instruments)) {
            expect(val).toHaveProperty('multiplier');
            expect(val).toHaveProperty('name');
            expect(val).toHaveProperty('tick');
            expect(val.multiplier).toBeGreaterThan(0);
            expect(val.tick).toBeGreaterThan(0);
        }
    });

    test('instruments contains ES, MES, NQ, MNQ, RTY, GC', () => {
        expect(Object.keys(instruments)).toEqual(expect.arrayContaining(['ES', 'MES', 'NQ', 'MNQ', 'RTY', 'GC']));
        expect(Object.keys(instruments)).toHaveLength(6);
    });

    test('instrument multipliers are correct', () => {
        expect(instruments.ES.multiplier).toBe(50);
        expect(instruments.MES.multiplier).toBe(5);
        expect(instruments.NQ.multiplier).toBe(20);
        expect(instruments.MNQ.multiplier).toBe(2);
        expect(instruments.RTY.multiplier).toBe(50);
        expect(instruments.GC.multiplier).toBe(100);
    });

    test('entry modes have increasing entry distances', () => {
        expect(entryModes.filtro_a.entry).toBeLessThan(entryModes.aggressive.entry);
        expect(entryModes.aggressive.entry).toBeLessThan(entryModes.standard.entry);
        expect(entryModes.standard.entry).toBeLessThan(entryModes.conservative.entry);
    });

    test('entry modes have increasing SL distances', () => {
        expect(entryModes.filtro_a.sl).toBeLessThan(entryModes.aggressive.sl);
        expect(entryModes.aggressive.sl).toBeLessThan(entryModes.standard.sl);
        expect(entryModes.standard.sl).toBeLessThan(entryModes.conservative.sl);
    });

    test('filtro_a entry mode has best documented WR', () => {
        expect(entryModes.filtro_a.entry).toBe(4.0);
        expect(entryModes.filtro_a.sl).toBe(2.5);
    });

    test('params has required keys with correct values', () => {
        expect(params.tp1Pct).toBe(0.50);
        expect(params.tp2Pct).toBe(0.75);
        expect(params.tp3Pct).toBe(0.90);
        expect(params.minGapPct).toBe(0.10);
        expect(params.minPrevRange).toBe(15);
        expect(params.gapMoveEstimate).toBe(0.42);
        expect(params.rangeHighWarn).toBe(60);
        expect(params.rangeExtremeWarn).toBe(100);
        expect(params.bigGapWarn).toBe(1.0);
    });

    test('gap25 backtest metadata is present', () => {
        expect(GAP25_BACKTEST.quarterPct).toBe(0.25);
        expect(GAP25_BACKTEST.sampleSize).toBeGreaterThan(3000);
        expect(GAP25_BACKTEST.up.meanReversionHitPct).toBeGreaterThan(60);
        expect(GAP25_BACKTEST.down.meanReversionHitPct).toBeGreaterThan(65);
    });

    test('intraday calibration metadata is present', () => {
        expect(GAP25_INTRADAY_CALIBRATION.up.entryOffsetPts).toBeGreaterThan(0);
        expect(GAP25_INTRADAY_CALIBRATION.down.entryOffsetPts).toBeGreaterThan(0);
        expect(GAP25_INTRADAY_CALIBRATION.up.tp1RangeMult).toBe(0.25);
        expect(GAP25_INTRADAY_CALIBRATION.down.tp1RangeMult).toBe(0.25);
        expect(GAP25_INTRADAY_CALIBRATION.buckets[RANGE_BUCKET_KEYS.LT25].up.entryOffsetPts).toBeGreaterThan(0);
        expect(GAP25_INTRADAY_CALIBRATION.buckets[RANGE_BUCKET_KEYS.R100_PLUS].down.stopOffsetPts).toBeGreaterThan(0);
    });
});

describe('Gap25 bucket calibration helpers', () => {
    test('getRangeBucket maps range boundaries correctly', () => {
        expect(getRangeBucket(24.99)).toBe(RANGE_BUCKET_KEYS.LT25);
        expect(getRangeBucket(25)).toBe(RANGE_BUCKET_KEYS.R25_40);
        expect(getRangeBucket(39.99)).toBe(RANGE_BUCKET_KEYS.R25_40);
        expect(getRangeBucket(40)).toBe(RANGE_BUCKET_KEYS.R40_60);
        expect(getRangeBucket(59.99)).toBe(RANGE_BUCKET_KEYS.R40_60);
        expect(getRangeBucket(60)).toBe(RANGE_BUCKET_KEYS.R60_100);
        expect(getRangeBucket(99.99)).toBe(RANGE_BUCKET_KEYS.R60_100);
        expect(getRangeBucket(100)).toBe(RANGE_BUCKET_KEYS.R100_PLUS);
    });

    test('getSideCalibration selects side and bucket-specific parameters', () => {
        const shortCalib = getSideCalibration('SHORT', 20);
        expect(shortCalib.sideKey).toBe('up');
        expect(shortCalib.bucketKey).toBe(RANGE_BUCKET_KEYS.LT25);
        expect(shortCalib.entryOffsetPts).toBeCloseTo(0.75, 6);

        const longCalib = getSideCalibration('LONG', 110);
        expect(longCalib.sideKey).toBe('down');
        expect(longCalib.bucketKey).toBe(RANGE_BUCKET_KEYS.R100_PLUS);
        expect(longCalib.stopOffsetPts).toBeCloseTo(9.75, 6);
        expect(longCalib.tp1RangeMult).toBe(0.25);
    });
});

// ──────────────────────────────────────────────
// Input validation
// ──────────────────────────────────────────────
describe('computeLevels – input validation', () => {
    test('returns null when prevHigh is NaN', () => {
        expect(computeLevels(inputs({ prevHigh: NaN }))).toBeNull();
    });

    test('returns null when prevLow is NaN', () => {
        expect(computeLevels(inputs({ prevLow: NaN }))).toBeNull();
    });

    test('returns null when prevClose is NaN', () => {
        expect(computeLevels(inputs({ prevClose: NaN }))).toBeNull();
    });

    test('returns null when todayOpen is NaN', () => {
        expect(computeLevels(inputs({ todayOpen: NaN }))).toBeNull();
    });

    test('returns null when all required inputs are NaN', () => {
        expect(computeLevels(inputs({ prevHigh: NaN, prevLow: NaN, prevClose: NaN, todayOpen: NaN }))).toBeNull();
    });

    test('returns null when prevHigh is less than prevLow', () => {
        expect(computeLevels(inputs({ prevHigh: 6000, prevLow: 6100 }))).toBeNull();
    });

    test('returns null for invalid instrumentKey', () => {
        expect(computeLevels(inputs({ instrumentKey: 'INVALID' }))).toBeNull();
    });

    test('returns null for invalid entryModeKey', () => {
        expect(computeLevels(inputs({ entryModeKey: 'invalid' }))).toBeNull();
    });

    test('succeeds when extremeReal is NaN (optional field)', () => {
        const result = computeLevels(inputs({ extremeReal: NaN }));
        expect(result).not.toBeNull();
        expect(result.hasExtremeReal).toBe(false);
    });

    test('succeeds with all valid inputs', () => {
        const result = computeLevels(inputs());
        expect(result).not.toBeNull();
    });
});

// ──────────────────────────────────────────────
// Gap and direction logic
// ──────────────────────────────────────────────
describe('computeLevels – gap and direction', () => {
    test('gap up (todayOpen > prevClose) => SHORT direction', () => {
        const result = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(result.gap).toBe(15);
        expect(result.isGapUp).toBe(true);
        expect(result.direction).toBe('SHORT');
    });

    test('gap down (todayOpen < prevClose) => LONG direction', () => {
        const result = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        expect(result.gap).toBe(-15);
        expect(result.isGapUp).toBe(false);
        expect(result.direction).toBe('LONG');
    });

    test('zero gap (todayOpen === prevClose) => LONG direction (gap not > 0)', () => {
        const result = computeLevels(inputs({ todayOpen: 6080, prevClose: 6080 }));
        expect(result.gap).toBe(0);
        expect(result.isGapUp).toBe(false);
        expect(result.direction).toBe('LONG');
    });

    test('gapPct is absolute percentage of gap vs prevClose', () => {
        const result = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(result.gapPct).toBeCloseTo((15 / 6080) * 100, 4);
        expect(result.gapPct).toBeGreaterThan(0); // always positive
    });

    test('gapPct is always non-negative regardless of direction', () => {
        const longResult  = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        const shortResult = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(longResult.gapPct).toBeGreaterThan(0);
        expect(shortResult.gapPct).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────
// True range calculation (prevRangeTotal includes gap)
// ──────────────────────────────────────────────
describe('computeLevels – range calculations', () => {
    test('prevRangeTotal uses true range including gap from prevPrevClose', () => {
        // prevOpen=6060, prevPrevClose=6040 → gap on D-1 = 20pts up
        // prevTrueHigh = max(6100, 6060) = 6100
        // prevTrueLow  = min(6050, 6040) = 6040
        // prevRangeTotal = 6100 - 6040 = 60
        const result = computeLevels(inputs());
        expect(result.prevTrueHigh).toBe(6100);
        expect(result.prevTrueLow).toBe(6040);
        expect(result.prevRangeTotal).toBe(60);
    });

    test('falls back to H-L when prevOpen/prevPrevClose not provided', () => {
        const result = computeLevels(inputs({ prevOpen: NaN, prevPrevClose: NaN }));
        expect(result.prevTrueHigh).toBe(6100);
        expect(result.prevTrueLow).toBe(6050);
        expect(result.prevRangeTotal).toBe(50);
    });

    test('prevRangeTotal is always positive', () => {
        const result = computeLevels(inputs());
        expect(result.prevRangeTotal).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────
// Extreme estimation
// ──────────────────────────────────────────────
describe('computeLevels – extreme estimation', () => {
    test('uses provided extremeReal when available', () => {
        const result = computeLevels(inputs({ extremeReal: 6045 }));
        expect(result.baseExtreme).toBe(6045);
        expect(result.hasExtremeReal).toBe(true);
    });

    test('estimates extreme when extremeReal is NaN', () => {
        const result = computeLevels(inputs({ extremeReal: NaN }));
        expect(result.hasExtremeReal).toBe(false);
        // LONG: baseExtreme = todayOpen - (prevRangeTotal * gapMoveEstimate)
        const expected = 6065 - result.prevRangeTotal * params.gapMoveEstimate;
        expect(result.baseExtreme).toBeCloseTo(expected, 4);
    });

    test('estimated extreme for gap up is above todayOpen', () => {
        const result = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080, extremeReal: NaN }));
        expect(result.direction).toBe('SHORT');
        expect(result.baseExtreme).toBeGreaterThan(6095);
    });

    test('estimated extreme for gap down is below todayOpen', () => {
        const result = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080, extremeReal: NaN }));
        expect(result.direction).toBe('LONG');
        expect(result.baseExtreme).toBeLessThan(6065);
    });
});

// ──────────────────────────────────────────────
// Entry, SL, and TP level calculations
// ──────────────────────────────────────────────
describe('computeLevels – level calculations', () => {
    describe('LONG (gap down)', () => {
        const result = computeLevels(inputs({
            todayOpen: 6065, prevClose: 6080, extremeReal: 6045
        }));

        test('entry is above baseExtreme', () => {
            expect(result.entry).toBe(6045 + entryModes.standard.entry);
        });

        test('SL is below baseExtreme', () => {
            expect(result.sl).toBe(6045 - entryModes.standard.sl);
        });

        test('TP1 is above baseExtreme', () => {
            expect(result.tp1).toBeGreaterThan(6045);
        });

        test('TP1 < TP2 < TP3 for LONG', () => {
            expect(result.tp1).toBeLessThan(result.tp2);
            expect(result.tp2).toBeLessThan(result.tp3);
        });

        test('TP levels are at correct percentages of prevRangeTotal (dynamic)', () => {
            // Dynamic TPs: uses result.tp1Pct/tp2Pct/tp3Pct (depends on prevRangeTotal)
            expect(result.tp1).toBeCloseTo(6045 + result.prevRangeTotal * result.tp1Pct, 4);
            expect(result.tp2).toBeCloseTo(6045 + result.prevRangeTotal * result.tp2Pct, 4);
            expect(result.tp3).toBeCloseTo(6045 + result.prevRangeTotal * result.tp3Pct, 4);
        });
    });

    describe('SHORT (gap up)', () => {
        const result = computeLevels(inputs({
            todayOpen: 6095, prevClose: 6080, extremeReal: 6115
        }));

        test('direction is SHORT', () => {
            expect(result.direction).toBe('SHORT');
        });

        test('entry is below baseExtreme', () => {
            expect(result.entry).toBe(6115 - entryModes.standard.entry);
        });

        test('SL is above baseExtreme', () => {
            expect(result.sl).toBe(6115 + entryModes.standard.sl);
        });

        test('TP1 > TP2 > TP3 for SHORT (prices go down)', () => {
            expect(result.tp1).toBeGreaterThan(result.tp2);
            expect(result.tp2).toBeGreaterThan(result.tp3);
        });

        test('TP levels are at correct percentages of prevRangeTotal (dynamic)', () => {
            expect(result.tp1).toBeCloseTo(6115 - result.prevRangeTotal * result.tp1Pct, 4);
            expect(result.tp2).toBeCloseTo(6115 - result.prevRangeTotal * result.tp2Pct, 4);
            expect(result.tp3).toBeCloseTo(6115 - result.prevRangeTotal * result.tp3Pct, 4);
        });
    });

    test('entry modes affect entry and SL distances', () => {
        const filtroA     = computeLevels(inputs({ entryModeKey: 'filtro_a' }));
        const conservative = computeLevels(inputs({ entryModeKey: 'conservative' }));
        expect(Math.abs(conservative.entry - conservative.baseExtreme))
            .toBeGreaterThan(Math.abs(filtroA.entry - filtroA.baseExtreme));
    });
});

// ──────────────────────────────────────────────
// Risk/Reward calculations
// ──────────────────────────────────────────────
describe('computeLevels – risk/reward', () => {
    test('riskPoints = abs(entry - sl)', () => {
        const result = computeLevels(inputs());
        expect(result.riskPoints).toBeCloseTo(Math.abs(result.entry - result.sl), 6);
    });

    test('rewardPoints = abs(tp2 - entry)', () => {
        const result = computeLevels(inputs());
        expect(result.rewardPoints).toBeCloseTo(Math.abs(result.tp2 - result.entry), 6);
    });

    test('rrRatio = reward / risk', () => {
        const result = computeLevels(inputs());
        expect(result.rrRatio).toBeCloseTo(result.rewardPoints / result.riskPoints, 6);
    });

    test('riskDollars uses instrument multiplier', () => {
        const es  = computeLevels(inputs({ instrumentKey: 'ES' }));
        const mes = computeLevels(inputs({ instrumentKey: 'MES' }));
        expect(es.riskDollars).toBe(es.riskPoints * 50);
        expect(mes.riskDollars).toBe(mes.riskPoints * 5);
    });

    test('rewardDollars uses instrument multiplier', () => {
        const gc = computeLevels(inputs({ instrumentKey: 'GC', extremeReal: 6045 }));
        expect(gc.rewardDollars).toBe(gc.rewardPoints * 100);
    });

    test('rrRatio is positive for both directions', () => {
        const long  = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        const short = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(long.rrRatio).toBeGreaterThan(0);
        expect(short.rrRatio).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────
// All instrument calculations
// ──────────────────────────────────────────────
describe('computeLevels – all instruments', () => {
    const instrumentKeys = ['ES', 'MES', 'NQ', 'MNQ', 'RTY', 'GC'];

    instrumentKeys.forEach(key => {
        test(`${key} produces valid results`, () => {
            const result = computeLevels(inputs({ instrumentKey: key }));
            expect(result).not.toBeNull();
            expect(result.instrument.name).toBe(instruments[key].name);
            expect(result.riskDollars).toBe(result.riskPoints * instruments[key].multiplier);
            expect(result.rewardDollars).toBe(result.rewardPoints * instruments[key].multiplier);
        });
    });
});

// ──────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────
describe('computeLevels – edge cases', () => {
    test('very large inputs do not produce NaN', () => {
        const result = computeLevels(inputs({
            prevHigh: 100000, prevLow: 99000, prevClose: 99500, todayOpen: 99700, extremeReal: 99800
        }));
        expect(result).not.toBeNull();
        expect(isNaN(result.entry)).toBe(false);
        expect(isNaN(result.rrRatio)).toBe(false);
    });

    test('very small gap still computes', () => {
        const result = computeLevels(inputs({ todayOpen: 6080.01, prevClose: 6080 }));
        expect(result).not.toBeNull();
        expect(result.gap).toBeCloseTo(0.01, 4);
    });

    test('negative prices still compute (theoretical)', () => {
        const result = computeLevels(inputs({
            prevHigh: -10, prevLow: -20, prevClose: -15, todayOpen: -12, extremeReal: -11
        }));
        expect(result).not.toBeNull();
    });

    test('prevClose of zero sets gapPct to 0 (guard against division by zero)', () => {
        const result = computeLevels(inputs({
            prevHigh: 10, prevLow: 5, prevClose: 0, todayOpen: 5, extremeReal: 4
        }));
        expect(result).not.toBeNull();
        expect(result.gapPct).toBe(0);
    });

    test('equal prevHigh and prevLow (zero H-L) still computes with true range', () => {
        const result = computeLevels(inputs({
            prevHigh: 6080, prevLow: 6080, prevClose: 6080,
            prevOpen: 6060, prevPrevClose: 6040, // these give a real true range
            todayOpen: 6065, extremeReal: 6045
        }));
        expect(result).not.toBeNull();
        expect(result.prevRangeTotal).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────
// Filter logic – core (computeFilters)
// ──────────────────────────────────────────────
describe('computeFilters – core filters', () => {
    test('all filters pass for a good gap-down setup with real extreme', () => {
        const f = computeFilters({
            gapPct: 0.25, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true
        });
        expect(f.gapFilter).toBe(true);
        expect(f.rangeFilter).toBe(true);
        expect(f.criticalPass).toBe(true);
        expect(f.gapTypeFilter).toBe(true);
        expect(f.extremeFilter).toBe(true);
        expect(f.alertType).toBe('success');
    });

    test('gap filter fails when gapPct < 0.10', () => {
        const f = computeFilters({
            gapPct: 0.08, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true
        });
        expect(f.gapFilter).toBe(false);
        expect(f.criticalPass).toBe(false);
    });

    test('gap filter passes at exactly 0.10%', () => {
        const f = computeFilters({
            gapPct: 0.10, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true
        });
        expect(f.gapFilter).toBe(true);
    });

    test('range filter fails when prevRangeTotal < 15', () => {
        const f = computeFilters({
            gapPct: 0.25, prevRangeTotal: 10, isGapUp: false, hasExtremeReal: true
        });
        expect(f.rangeFilter).toBe(false);
        expect(f.criticalPass).toBe(false);
    });

    test('range filter passes at exactly 15', () => {
        const f = computeFilters({
            gapPct: 0.25, prevRangeTotal: 15, isGapUp: false, hasExtremeReal: true
        });
        expect(f.rangeFilter).toBe(true);
    });

    test('zero gap pct fails gap filter', () => {
        const f = computeFilters({ gapPct: 0, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.gapFilter).toBe(false);
    });

    test('zero prevRangeTotal fails range filter', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 0, isGapUp: false, hasExtremeReal: true });
        expect(f.rangeFilter).toBe(false);
    });
});

// ──────────────────────────────────────────────
// Filter logic – informational filters (win-rate based)
// ──────────────────────────────────────────────
describe('computeFilters – informational (win-rate) filters', () => {
    test('gapTypeFilter is true for gap DOWN (LONG preferred)', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.gapTypeFilter).toBe(true);
    });

    test('gapTypeFilter is false for gap UP (SHORT – lower WR)', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: true, hasExtremeReal: true });
        expect(f.gapTypeFilter).toBe(false);
    });

    test('extremeFilter is true when hasExtremeReal is true', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.extremeFilter).toBe(true);
    });

    test('extremeFilter is false when hasExtremeReal is false', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: false });
        expect(f.extremeFilter).toBe(false);
    });

    test('rangeHighFilter is true when prevRangeTotal >= 60 (21.9% WR zone)', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 65, isGapUp: false, hasExtremeReal: true });
        expect(f.rangeHighFilter).toBe(true);
    });

    test('rangeHighFilter is false when prevRangeTotal < 60', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 59, isGapUp: false, hasExtremeReal: true });
        expect(f.rangeHighFilter).toBe(false);
    });

    test('rangeHighFilter triggers at exactly 60pts', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 60, isGapUp: false, hasExtremeReal: true });
        expect(f.rangeHighFilter).toBe(true);
    });

    test('bigGapFilter is true when gapPct >= 1.0 (28.3% WR zone)', () => {
        const f = computeFilters({ gapPct: 1.2, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.bigGapFilter).toBe(true);
    });

    test('bigGapFilter is false when gapPct < 1.0', () => {
        const f = computeFilters({ gapPct: 0.8, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.bigGapFilter).toBe(false);
    });

    test('bigGapFilter triggers at exactly 1.0%', () => {
        const f = computeFilters({ gapPct: 1.0, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.bigGapFilter).toBe(true);
    });

    test('informational filters do NOT affect criticalPass', () => {
        // Range > 60 is a warning but NOT a critical failure
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 80, isGapUp: true, hasExtremeReal: false });
        expect(f.criticalPass).toBe(true);  // gap and range minimums still pass
        expect(f.rangeHighFilter).toBe(true);
        expect(f.gapTypeFilter).toBe(false);
        expect(f.extremeFilter).toBe(false);
    });
});

// ──────────────────────────────────────────────
// Filter boundary conditions
// ──────────────────────────────────────────────
describe('computeFilters – boundary conditions', () => {
    test('gap pct at 0.0999 fails gap filter', () => {
        const f = computeFilters({ gapPct: 0.0999, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.gapFilter).toBe(false);
    });

    test('gap pct at 0.1001 passes gap filter', () => {
        const f = computeFilters({ gapPct: 0.1001, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.gapFilter).toBe(true);
    });

    test('prevRangeTotal at 14.99 fails range filter', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 14.99, isGapUp: false, hasExtremeReal: true });
        expect(f.rangeFilter).toBe(false);
    });

    test('prevRangeTotal at 15.01 passes range filter', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 15.01, isGapUp: false, hasExtremeReal: true });
        expect(f.rangeFilter).toBe(true);
    });
});

// ──────────────────────────────────────────────
// Alert type logic
// ──────────────────────────────────────────────
describe('computeFilters – alertType', () => {
    test('danger when gap too small', () => {
        const f = computeFilters({ gapPct: 0.05, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.alertType).toBe('danger');
    });

    test('danger when range too small', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 10, isGapUp: false, hasExtremeReal: true });
        expect(f.alertType).toBe('danger');
    });

    test('danger when both critical filters fail', () => {
        const f = computeFilters({ gapPct: 0.05, prevRangeTotal: 10, isGapUp: false, hasExtremeReal: true });
        expect(f.alertType).toBe('danger');
    });

    test('warning-gap-up when gap up and critical pass', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: true, hasExtremeReal: true });
        expect(f.alertType).toBe('warning-gap-up');
    });

    test('warning-pending when gap down, critical pass, but no extreme', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: false });
        expect(f.alertType).toBe('warning-pending');
    });

    test('success when gap down, critical pass, and extreme confirmed', () => {
        const f = computeFilters({ gapPct: 0.25, prevRangeTotal: 50, isGapUp: false, hasExtremeReal: true });
        expect(f.alertType).toBe('success');
    });
});

// ──────────────────────────────────────────────
// Filter integration via computeLevels
// ──────────────────────────────────────────────
describe('computeLevels – filters integration', () => {
    test('filters are included in computeLevels result', () => {
        const result = computeLevels(inputs());
        expect(result.filters).toBeDefined();
        expect(result.filters).toHaveProperty('gapFilter');
        expect(result.filters).toHaveProperty('rangeFilter');
        expect(result.filters).toHaveProperty('gapTypeFilter');
        expect(result.filters).toHaveProperty('extremeFilter');
        expect(result.filters).toHaveProperty('rangeHighFilter');
        expect(result.filters).toHaveProperty('bigGapFilter');
        expect(result.filters).toHaveProperty('criticalPass');
        expect(result.filters).toHaveProperty('alertType');
    });

    test('filters match standalone computeFilters call', () => {
        const result = computeLevels(inputs());
        const standalone = computeFilters({
            gapPct: result.gapPct,
            prevRangeTotal: result.prevRangeTotal,
            isGapUp: result.isGapUp,
            hasExtremeReal: result.hasExtremeReal
        });
        expect(result.filters).toEqual(standalone);
    });
});

// ──────────────────────────────────────────────
// Win rate estimates
// ──────────────────────────────────────────────
describe('computeLevels – win rate estimates', () => {
    test('expectedWR is higher for small gaps vs large gaps', () => {
        const smallGap = computeLevels(inputs({ todayOpen: 6079, prevClose: 6080 })); // ~0.016% gap
        const bigGap   = computeLevels(inputs({ todayOpen: 6014, prevClose: 6080 })); // ~1.1% gap
        expect(smallGap.expectedWR).toBeGreaterThan(bigGap.expectedWR);
    });

    test('expectedWR_range is higher for small prevRangeTotal', () => {
        // Small range: use prevOpen/prevPrevClose to get small true range
        const smallRange = computeLevels(inputs({
            prevHigh: 6030, prevLow: 6010, prevClose: 6020, prevOpen: 6015, prevPrevClose: 6010,
            todayOpen: 6015, extremeReal: 6005
        }));
        const bigRange = computeLevels(inputs({
            prevHigh: 6150, prevLow: 6000, prevClose: 6080, prevOpen: 6060, prevPrevClose: 6040,
            todayOpen: 6065, extremeReal: 6045
        }));
        expect(smallRange.expectedWR_range).toBeGreaterThan(bigRange.expectedWR_range);
    });

    test('expectedWR_combined is lower for SHORT than LONG (same range)', () => {
        const longSetup  = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        const shortSetup = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(longSetup.expectedWR_combined).toBeGreaterThan(shortSetup.expectedWR_combined);
    });

    test('expectedWR_combined penalizes gap > 1%', () => {
        // LONG gap <1%
        const normalGap = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        // LONG gap >1%
        const bigGap = computeLevels(inputs({ todayOpen: 5990, prevClose: 6080, extremeReal: 5970 }));
        expect(normalGap.expectedWR_combined).toBeGreaterThan(bigGap.expectedWR_combined);
    });

    test('expectedWR_combined is defined for all setups', () => {
        const result = computeLevels(inputs());
        expect(result.expectedWR_combined).toBeDefined();
        expect(result.expectedWR_combined).toBeGreaterThan(0);
        expect(result.expectedWR_combined).toBeLessThan(100);
    });
});

// ──────────────────────────────────────────────
// suggestEntryMode
// ──────────────────────────────────────────────
describe('suggestEntryMode', () => {
    test('suggests standard when gap up + filtro_a (too aggressive for SHORT)', () => {
        expect(suggestEntryMode(true, 'filtro_a')).toBe('standard');
    });

    test('suggests standard when gap up + aggressive', () => {
        expect(suggestEntryMode(true, 'aggressive')).toBe('standard');
    });

    test('suggests aggressive when gap down + conservative', () => {
        expect(suggestEntryMode(false, 'conservative')).toBe('aggressive');
    });

    test('returns null when no change needed (gap up + standard)', () => {
        expect(suggestEntryMode(true, 'standard')).toBeNull();
    });

    test('returns null when no change needed (gap up + conservative)', () => {
        expect(suggestEntryMode(true, 'conservative')).toBeNull();
    });

    test('returns null when no change needed (gap down + filtro_a)', () => {
        expect(suggestEntryMode(false, 'filtro_a')).toBeNull();
    });

    test('returns null when no change needed (gap down + aggressive)', () => {
        expect(suggestEntryMode(false, 'aggressive')).toBeNull();
    });

    test('returns null when no change needed (gap down + standard)', () => {
        expect(suggestEntryMode(false, 'standard')).toBeNull();
    });
});

// ──────────────────────────────────────────────
// getFilterStatusClass and getFilterIcon
// ──────────────────────────────────────────────
describe('getFilterStatusClass', () => {
    test('returns "pass" when passed is true', () => {
        expect(getFilterStatusClass(true)).toBe('pass');
    });

    test('returns "fail" when passed is false', () => {
        expect(getFilterStatusClass(false)).toBe('fail');
    });

    test('returns forceClass when provided regardless of passed', () => {
        expect(getFilterStatusClass(false, 'warn')).toBe('warn');
        expect(getFilterStatusClass(true, 'warn')).toBe('warn');
    });
});

describe('getFilterIcon', () => {
    test('returns checkmark for pass', () => {
        expect(getFilterIcon('pass')).toBe('✓');
    });

    test('returns warning for warn', () => {
        expect(getFilterIcon('warn')).toBe('⚠');
    });

    test('returns X for fail', () => {
        expect(getFilterIcon('fail')).toBe('✗');
    });

    test('returns X for unknown status', () => {
        expect(getFilterIcon('unknown')).toBe('✗');
    });
});

// ──────────────────────────────────────────────
// Realistic scenarios (end-to-end)
// ──────────────────────────────────────────────
describe('computeLevels – realistic scenarios', () => {
    test('classic gap down with real extreme – full valid setup', () => {
        const result = computeLevels({
            prevHigh: 6100,
            prevLow: 6050,
            prevClose: 6080,
            prevOpen: 6060,
            prevPrevClose: 6040,
            todayOpen: 6065,
            extremeReal: 6045,
            instrumentKey: 'ES',
            entryModeKey: 'standard'
        });

        expect(result.direction).toBe('LONG');
        expect(result.gap).toBe(-15);
        expect(result.entry).toBe(6045 + 6.5);
        expect(result.sl).toBe(6045 - 3.5);
        expect(result.filters.criticalPass).toBe(true);
        expect(result.filters.gapTypeFilter).toBe(true);
        expect(result.filters.extremeFilter).toBe(true);
        expect(result.filters.alertType).toBe('success');
    });

    test('gap up setup – SHORT warning flags', () => {
        const result = computeLevels({
            prevHigh: 6100,
            prevLow: 6050,
            prevClose: 6080,
            prevOpen: 6060,
            prevPrevClose: 6040,
            todayOpen: 6095,
            extremeReal: 6115,
            instrumentKey: 'MES',
            entryModeKey: 'standard'  // SHORT: standard is minimum recommended
        });

        expect(result.direction).toBe('SHORT');
        expect(result.entry).toBe(6115 - entryModes.standard.entry);  // 6115 - 6.5 = 6108.5
        expect(result.sl).toBe(6115 + entryModes.standard.sl);        // 6115 + 3.5 = 6118.5
        expect(result.filters.gapTypeFilter).toBe(false);
        expect(result.filters.alertType).toBe('warning-gap-up');
        // SHORT has lower combined WR
        expect(result.expectedWR_combined).toBeLessThan(40);
    });

    test('large range setup – rangeHighFilter active', () => {
        const result = computeLevels({
            prevHigh: 6200,
            prevLow: 6050,
            prevClose: 6100,
            prevOpen: 6080,
            prevPrevClose: 6060,
            todayOpen: 6085,
            extremeReal: 6070,
            instrumentKey: 'ES',
            entryModeKey: 'standard'
        });

        // prevRangeTotal should be > 60
        expect(result.prevRangeTotal).toBeGreaterThan(60);
        expect(result.filters.rangeHighFilter).toBe(true);
        // criticalPass still passes (range > 15)
        expect(result.filters.criticalPass).toBe(true);
        // Combined WR should be lower than typical
        expect(result.expectedWR_combined).toBeLessThan(32);
    });

    test('big gap setup – bigGapFilter active', () => {
        const result = computeLevels({
            prevHigh: 6100,
            prevLow: 6050,
            prevClose: 6080,
            prevOpen: 6060,
            prevPrevClose: 6040,
            todayOpen: 5975,   // ~1.7% gap down
            extremeReal: 5960,
            instrumentKey: 'ES',
            entryModeKey: 'standard'
        });

        expect(result.gapPct).toBeGreaterThan(1.0);
        expect(result.filters.bigGapFilter).toBe(true);
        expect(result.filters.criticalPass).toBe(true);
        // WR penalized for big gap
        expect(result.expectedWR_combined).toBeLessThan(35);
    });

    test('NQ with estimated extreme (no real extreme)', () => {
        const result = computeLevels({
            prevHigh: 18500,
            prevLow: 18400,
            prevClose: 18450,
            prevOpen: 18420,
            prevPrevClose: 18380,
            todayOpen: 18420,
            extremeReal: NaN,
            instrumentKey: 'NQ',
            entryModeKey: 'standard'
        });

        expect(result.direction).toBe('LONG');
        expect(result.hasExtremeReal).toBe(false);
        expect(result.filters.extremeFilter).toBe(false);
        expect(result.filters.alertType).toBe('warning-pending');
        expect(result.riskDollars).toBe(result.riskPoints * 20);
    });

    test('tiny gap that fails minimum gap filter', () => {
        const result = computeLevels({
            prevHigh: 6100,
            prevLow: 6050,
            prevClose: 6080,
            prevOpen: 6060,
            prevPrevClose: 6040,
            todayOpen: 6081,
            extremeReal: 6090,
            instrumentKey: 'ES',
            entryModeKey: 'standard'
        });

        // gapPct = (1/6080)*100 ≈ 0.016%, below 0.10%
        expect(result.filters.gapFilter).toBe(false);
        expect(result.filters.criticalPass).toBe(false);
        expect(result.filters.alertType).toBe('danger');
    });

    test('GC with conservative mode produces valid levels', () => {
        const result = computeLevels({
            prevHigh: 2050,
            prevLow: 2000,
            prevClose: 2020,
            prevOpen: 2010,
            prevPrevClose: 1990,
            todayOpen: 2010,
            extremeReal: 1995,
            instrumentKey: 'GC',
            entryModeKey: 'conservative'
        });

        expect(result.direction).toBe('LONG');
        expect(result.entry).toBe(1995 + 8.0);
        expect(result.sl).toBe(1995 - 4.0);
        expect(result.riskDollars).toBe(result.riskPoints * 100);
    });
});

// ──────────────────────────────────────────────
// computeSetupScore
// ──────────────────────────────────────────────
describe('computeSetupScore', () => {
    const baseScore = {
        direction: 'LONG',
        prevRangeTotal: 30,
        gapPct: 0.25,
        volRegime: null,
        closePosD1: null,
        dow: null,
        hasExtremeReal: true
    };

    function score(overrides = {}) {
        return computeSetupScore({ ...baseScore, ...overrides });
    }

    test('returns a number between 0 and 100', () => {
        expect(score()).toBeGreaterThanOrEqual(0);
        expect(score()).toBeLessThanOrEqual(100);
    });

    test('LONG scores higher than SHORT (same conditions)', () => {
        expect(score({ direction: 'LONG' })).toBeGreaterThan(score({ direction: 'SHORT' }));
    });

    test('small range (<25) scores higher than large range (>60)', () => {
        expect(score({ prevRangeTotal: 20 })).toBeGreaterThan(score({ prevRangeTotal: 70 }));
    });

    test('range <25 scores higher than range 25-40', () => {
        expect(score({ prevRangeTotal: 20 })).toBeGreaterThan(score({ prevRangeTotal: 32 }));
    });

    test('range >100 scores significantly lower than range <25', () => {
        const small = score({ prevRangeTotal: 20 });
        const extreme = score({ prevRangeTotal: 110 });
        expect(small - extreme).toBeGreaterThan(40);
    });

    test('volRegime < 0.80 adds bonus (Filtro A condition)', () => {
        const withVol = score({ volRegime: 0.70 });
        const withoutVol = score({ volRegime: null });
        expect(withVol).toBeGreaterThan(withoutVol);
    });

    test('volRegime < 0.80 adds more than volRegime 0.80–1.00', () => {
        const filtroA = score({ volRegime: 0.70 });
        const filtroC = score({ volRegime: 0.90 });
        expect(filtroA).toBeGreaterThan(filtroC);
    });

    test('big gap (>1%) reduces score', () => {
        expect(score({ gapPct: 0.25 })).toBeGreaterThan(score({ gapPct: 1.5 }));
    });

    test('mid-week (dow=2) scores higher than Friday (dow=4)', () => {
        expect(score({ dow: 2 })).toBeGreaterThan(score({ dow: 4 }));
    });

    test('closePosD1 < 0.35 adds bonus (Filtro B condition)', () => {
        expect(score({ closePosD1: 0.20 })).toBeGreaterThan(score({ closePosD1: 0.60 }));
    });

    test('having real extreme adds bonus', () => {
        expect(score({ hasExtremeReal: true })).toBeGreaterThan(score({ hasExtremeReal: false }));
    });

    test('optimal setup (LONG + small range + Filtro A) scores >= 70 (PREMIUM)', () => {
        const optimal = score({
            direction: 'LONG',
            prevRangeTotal: 20,
            gapPct: 0.25,
            volRegime: 0.70,
            closePosD1: 0.25,
            dow: 2,
            hasExtremeReal: true
        });
        expect(optimal).toBeGreaterThanOrEqual(70);
    });

    test('worst setup (SHORT + large range + big gap) scores < 30 (EVITAR)', () => {
        const worst = score({
            direction: 'SHORT',
            prevRangeTotal: 110,
            gapPct: 1.5,
            volRegime: null,
            hasExtremeReal: false
        });
        expect(worst).toBeLessThan(30);
    });
});

// ──────────────────────────────────────────────
// setupScoreLabel
// ──────────────────────────────────────────────
describe('setupScoreLabel', () => {
    test('score >= 70 → PREMIUM', () => {
        expect(setupScoreLabel(75).cssClass).toBe('score-premium');
        expect(setupScoreLabel(75).label).toContain('PREMIUM');
    });

    test('score 50-69 → BUENO', () => {
        expect(setupScoreLabel(60).cssClass).toBe('score-good');
        expect(setupScoreLabel(60).label).toContain('BUENO');
    });

    test('score 30-49 → NEUTRAL', () => {
        expect(setupScoreLabel(40).cssClass).toBe('score-neutral');
        expect(setupScoreLabel(40).label).toContain('NEUTRAL');
    });

    test('score < 30 → EVITAR', () => {
        expect(setupScoreLabel(20).cssClass).toBe('score-avoid');
        expect(setupScoreLabel(20).label).toContain('EVITAR');
    });

    test('boundary: score 70 → PREMIUM', () => {
        expect(setupScoreLabel(70).cssClass).toBe('score-premium');
    });

    test('boundary: score 50 → BUENO', () => {
        expect(setupScoreLabel(50).cssClass).toBe('score-good');
    });
});

// ──────────────────────────────────────────────
// Dynamic TPs (based on prevRangeTotal)
// ──────────────────────────────────────────────
describe('computeLevels – dynamic TPs', () => {
    function makeInput(prevRange, overrides = {}) {
        // Use prevOpen/prevPrevClose to control prevRangeTotal precisely
        return {
            prevHigh: prevRange,
            prevLow: 0,
            prevClose: prevRange * 0.8,
            prevOpen: prevRange * 0.5,
            prevPrevClose: 0,
            todayOpen: prevRange * 0.7,
            extremeReal: prevRange * 0.6,
            instrumentKey: 'ES',
            entryModeKey: 'standard',
            ...overrides
        };
    }

    test('small range (<25): tp1Pct=0.50, tp2Pct=0.70, tp3Pct=0.85', () => {
        const result = computeLevels(makeInput(20));
        expect(result.prevRangeTotal).toBeLessThan(25);
        expect(result.tp1Pct).toBe(0.50);
        expect(result.tp2Pct).toBe(0.70);
        expect(result.tp3Pct).toBe(0.85);
    });

    test('optimal range (25-40): uses standard params (50/75/90)', () => {
        const result = computeLevels(makeInput(35));
        expect(result.prevRangeTotal).toBeGreaterThanOrEqual(25);
        expect(result.prevRangeTotal).toBeLessThan(40);
        expect(result.tp1Pct).toBe(params.tp1Pct); // 0.50
        expect(result.tp2Pct).toBe(params.tp2Pct); // 0.75
        expect(result.tp3Pct).toBe(params.tp3Pct); // 0.90
    });

    test('medium range (40-60): tp2Pct=0.62 (salir antes)', () => {
        const result = computeLevels(makeInput(55));
        expect(result.prevRangeTotal).toBeGreaterThanOrEqual(40);
        expect(result.prevRangeTotal).toBeLessThan(60);
        expect(result.tp1Pct).toBe(0.40);
        expect(result.tp2Pct).toBe(0.62);
    });

    test('large range (>=60): tp2Pct=0.55 (salir mucho antes)', () => {
        const result = computeLevels(makeInput(80));
        expect(result.prevRangeTotal).toBeGreaterThanOrEqual(60);
        expect(result.tp1Pct).toBe(0.35);
        expect(result.tp2Pct).toBe(0.55);
        expect(result.tp3Pct).toBe(0.75);
    });

    test('LONG: TP levels computed using dynamic tp2Pct', () => {
        const result = computeLevels(makeInput(30));
        expect(result.tp2).toBeCloseTo(result.baseExtreme + result.prevRangeTotal * result.tp2Pct, 4);
    });

    test('SHORT: TP levels computed using dynamic tp2Pct', () => {
        // Create a gap-up setup
        const result = computeLevels({
            prevHigh: 100, prevLow: 70, prevClose: 80,
            prevOpen: 75, prevPrevClose: 70,
            todayOpen: 85,  // gap up
            extremeReal: 95,
            instrumentKey: 'ES', entryModeKey: 'standard'
        });
        expect(result.direction).toBe('SHORT');
        expect(result.tp2).toBeCloseTo(result.baseExtreme - result.prevRangeTotal * result.tp2Pct, 4);
    });
});

// ──────────────────────────────────────────────
// Extreme-adaptive execution mode
// ──────────────────────────────────────────────
describe('computeLevels – extreme-adaptive execution', () => {
    test('when optimizeToExtremes=true, entry gets closer to the extreme', () => {
        const classic = computeLevels(inputs({
            todayOpen: 6065,
            prevClose: 6080,
            extremeReal: 6045,
            entryModeKey: 'standard',
            optimizeToExtremes: false,
        }));
        const adaptive = computeLevels(inputs({
            todayOpen: 6065,
            prevClose: 6080,
            extremeReal: 6045,
            entryModeKey: 'standard',
            optimizeToExtremes: true,
        }));

        const distClassic = Math.abs(classic.entry - classic.baseExtreme);
        const distAdaptive = Math.abs(adaptive.entry - adaptive.baseExtreme);

        expect(adaptive.executionMode).toBe('EXTREME_ADAPTIVE');
        expect(distAdaptive).toBeLessThanOrEqual(distClassic);
    });

    test('adaptive mode keeps TP order and valid WR execution range', () => {
        const r = computeLevels(inputs({
            todayOpen: 6095, // gap up
            prevClose: 6080,
            extremeReal: 6115,
            entryModeKey: 'aggressive',
            optimizeToExtremes: true,
        }));

        expect(r.direction).toBe('SHORT');
        expect(r.tp1).toBeGreaterThan(r.tp2);
        expect(r.tp2).toBeGreaterThan(r.tp3);
        expect(r.expectedWR_execution).toBeGreaterThanOrEqual(10);
        expect(r.expectedWR_execution).toBeLessThanOrEqual(88);
    });

    test('adaptive mode aligns TP1 with 25% of previous range', () => {
        const r = computeLevels(inputs({
            todayOpen: 6065,
            prevClose: 6080, // gap down -> LONG
            extremeReal: 6045,
            entryModeKey: 'standard',
            optimizeToExtremes: true,
        }));
        const quarter = r.prevRangeTotal * 0.25;
        const tp1FromExtreme = Math.abs(r.tp1 - r.baseExtreme);
        expect(tp1FromExtreme).toBeGreaterThanOrEqual(quarter);
        expect(tp1FromExtreme).toBeLessThanOrEqual(quarter * 1.5);
    });
});

// ──────────────────────────────────────────────
// Expected Value (EV)
// ──────────────────────────────────────────────
describe('computeLevels – expectedValue', () => {
    test('expectedValue is defined for all setups', () => {
        const result = computeLevels(inputs());
        expect(result.expectedValue).toBeDefined();
        expect(isNaN(result.expectedValue)).toBe(false);
    });

    test('optimal LONG setup (small range) has positive EV', () => {
        // Small range = WR~50%, good R:R = EV > 0
        const result = computeLevels(inputs({
            prevHigh: 6050, prevLow: 6030, prevClose: 6045,
            prevOpen: 6035, prevPrevClose: 6025,
            todayOpen: 6040, extremeReal: 6030,
            entryModeKey: 'filtro_a'
        }));
        expect(result.expectedWR_combined).toBeGreaterThanOrEqual(40);
        expect(result.expectedValue).toBeGreaterThan(0);
    });

    test('SHORT + medium range (40-60) has negative EV', () => {
        // SHORT base WR=27% (range 40-60), medium dynamic TPs (tp2Pct=0.62)
        // rewardPoints = range*0.62 - entryPts ≈ 50*0.62-6.5 = 24.5, riskPoints = 10
        // EV = 0.27*24.5 - 0.73*10 = 6.6 - 7.3 = -0.7 (negative)
        const result = computeLevels({
            prevHigh: 6100, prevLow: 6050, prevClose: 6080,
            prevOpen: 6060, prevPrevClose: 6050,
            todayOpen: 6095,  // gap up → SHORT
            extremeReal: 6110,
            instrumentKey: 'ES', entryModeKey: 'standard'
        });
        expect(result.direction).toBe('SHORT');
        expect(result.expectedWR_combined).toBeLessThan(32);
        expect(result.expectedValue).toBeLessThan(0);
    });

    test('EV formula is correct: WR*reward - (1-WR)*risk', () => {
        const result = computeLevels(inputs());
        const wr = result.expectedWR_combined / 100;
        const manualEV = (wr * result.rewardPoints) - ((1 - wr) * result.riskPoints);
        expect(result.expectedValue).toBeCloseTo(manualEV, 4);
    });
});

// ──────────────────────────────────────────────
// Setup Score integration via computeLevels
// ──────────────────────────────────────────────
describe('computeLevels – setupScore integration', () => {
    test('setupScore and setupScoreInfo are in result', () => {
        const result = computeLevels(inputs());
        expect(result.setupScore).toBeDefined();
        expect(result.setupScore).toBeGreaterThanOrEqual(0);
        expect(result.setupScore).toBeLessThanOrEqual(100);
        expect(result.setupScoreInfo).toHaveProperty('label');
        expect(result.setupScoreInfo).toHaveProperty('cssClass');
    });

    test('LONG setup with small range scores higher than SHORT with large range', () => {
        const longSmall = computeLevels(inputs({
            prevHigh: 6030, prevLow: 6010, prevClose: 6025,
            prevOpen: 6015, prevPrevClose: 6010,
            todayOpen: 6020, extremeReal: 6010
        }));
        const shortBig = computeLevels({
            prevHigh: 6200, prevLow: 6050, prevClose: 6100,
            prevOpen: 6080, prevPrevClose: 6050,
            todayOpen: 6130, extremeReal: 6170,
            instrumentKey: 'ES', entryModeKey: 'standard'
        });
        expect(longSmall.setupScore).toBeGreaterThan(shortBig.setupScore);
    });
});
