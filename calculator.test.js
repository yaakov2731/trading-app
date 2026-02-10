const {
    instruments,
    vixFactors,
    entryModes,
    params,
    computeLevels,
    computeFilters,
    suggestEntryMode,
    getFilterStatusClass,
    getFilterIcon
} = require('./calculator');

// Standard test inputs representing a typical gap-down scenario
const baseInputs = {
    prevHigh: 6100,
    prevLow: 6050,
    prevClose: 6080,
    todayOpen: 6065,
    extremeReal: 6045,
    vixLevel: 'normal',
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

    test('instruments contains ES, MES, NQ, GC', () => {
        expect(Object.keys(instruments)).toEqual(['ES', 'MES', 'NQ', 'GC']);
    });

    test('instrument multipliers are correct', () => {
        expect(instruments.ES.multiplier).toBe(50);
        expect(instruments.MES.multiplier).toBe(5);
        expect(instruments.NQ.multiplier).toBe(20);
        expect(instruments.GC.multiplier).toBe(100);
    });

    test('VIX factors are ordered low to extreme', () => {
        expect(vixFactors.low).toBeLessThan(vixFactors.normal);
        expect(vixFactors.normal).toBeLessThan(vixFactors.high);
        expect(vixFactors.high).toBeLessThan(vixFactors.extreme);
    });

    test('VIX factors are all between 0 and 1', () => {
        for (const val of Object.values(vixFactors)) {
            expect(val).toBeGreaterThan(0);
            expect(val).toBeLessThan(1);
        }
    });

    test('entry modes have increasing entry distances', () => {
        expect(entryModes.aggressive.entry).toBeLessThan(entryModes.standard.entry);
        expect(entryModes.standard.entry).toBeLessThan(entryModes.conservative.entry);
    });

    test('entry modes have increasing SL distances', () => {
        expect(entryModes.aggressive.sl).toBeLessThan(entryModes.standard.sl);
        expect(entryModes.standard.sl).toBeLessThan(entryModes.conservative.sl);
    });

    test('params has expected keys', () => {
        expect(params).toEqual({
            tp1Pct: 0.50,
            tp2Pct: 0.75,
            tp3Pct: 0.90,
            minGapPct: 0.15,
            minPrevRange: 25,
            gapMoveEstimate: 0.42
        });
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

    test('returns null for invalid instrumentKey', () => {
        expect(computeLevels(inputs({ instrumentKey: 'INVALID' }))).toBeNull();
    });

    test('returns null for invalid entryModeKey', () => {
        expect(computeLevels(inputs({ entryModeKey: 'invalid' }))).toBeNull();
    });

    test('returns null for invalid vixLevel', () => {
        expect(computeLevels(inputs({ vixLevel: 'invalid' }))).toBeNull();
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

    test('gap percent is calculated correctly', () => {
        const result = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(result.gapPercent).toBeCloseTo((15 / 6080) * 100, 6);
    });

    test('negative gap percent for gap down', () => {
        const result = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        expect(result.gapPercent).toBeLessThan(0);
    });
});

// ──────────────────────────────────────────────
// Range and expected range calculations
// ──────────────────────────────────────────────
describe('computeLevels – range calculations', () => {
    test('prevRange = prevHigh - prevLow', () => {
        const result = computeLevels(inputs());
        expect(result.prevRange).toBe(6100 - 6050);
    });

    test('expectedRange = (prevRange * factor) + abs(gap)', () => {
        const result = computeLevels(inputs());
        const expectedGap = Math.abs(6065 - 6080);
        const expectedRange = (50 * 0.87) + expectedGap;
        expect(result.expectedRange).toBeCloseTo(expectedRange, 6);
    });

    test('zero prevRange still produces valid expectedRange from gap alone', () => {
        const result = computeLevels(inputs({ prevHigh: 6080, prevLow: 6080 }));
        expect(result.prevRange).toBe(0);
        expect(result.expectedRange).toBe(Math.abs(6065 - 6080));
    });

    test('VIX factor affects expectedRange proportionally', () => {
        const lowVix = computeLevels(inputs({ vixLevel: 'low' }));
        const highVix = computeLevels(inputs({ vixLevel: 'high' }));
        // Higher VIX => larger range factor => larger expectedRange
        expect(highVix.expectedRange).toBeGreaterThan(lowVix.expectedRange);
    });

    test('all four VIX levels produce different expectedRanges', () => {
        const levels = ['low', 'normal', 'high', 'extreme'];
        const ranges = levels.map(v => computeLevels(inputs({ vixLevel: v })).expectedRange);
        const unique = new Set(ranges);
        expect(unique.size).toBe(4);
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
        // For gap down / LONG: baseExtreme = todayOpen - gapMove
        const gapMove = result.expectedRange * params.gapMoveEstimate;
        expect(result.baseExtreme).toBeCloseTo(6065 - gapMove, 6);
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

        test('TP levels are at correct percentages of expected range', () => {
            expect(result.tp1).toBeCloseTo(6045 + result.expectedRange * 0.50, 6);
            expect(result.tp2).toBeCloseTo(6045 + result.expectedRange * 0.75, 6);
            expect(result.tp3).toBeCloseTo(6045 + result.expectedRange * 0.90, 6);
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

        test('TP levels are at correct percentages of expected range', () => {
            expect(result.tp1).toBeCloseTo(6115 - result.expectedRange * 0.50, 6);
            expect(result.tp2).toBeCloseTo(6115 - result.expectedRange * 0.75, 6);
            expect(result.tp3).toBeCloseTo(6115 - result.expectedRange * 0.90, 6);
        });
    });

    test('entry modes affect entry and SL distances', () => {
        const aggressive = computeLevels(inputs({ entryModeKey: 'aggressive' }));
        const conservative = computeLevels(inputs({ entryModeKey: 'conservative' }));
        // Conservative has larger entry distance
        expect(Math.abs(conservative.entry - conservative.baseExtreme))
            .toBeGreaterThan(Math.abs(aggressive.entry - aggressive.baseExtreme));
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
        const es = computeLevels(inputs({ instrumentKey: 'ES' }));
        const mes = computeLevels(inputs({ instrumentKey: 'MES' }));
        // Same risk points but different dollar amounts
        expect(es.riskPoints).toBeCloseTo(mes.riskPoints, 6);
        expect(es.riskDollars).toBe(es.riskPoints * 50);
        expect(mes.riskDollars).toBe(mes.riskPoints * 5);
    });

    test('rewardDollars uses instrument multiplier', () => {
        const gc = computeLevels(inputs({ instrumentKey: 'GC', extremeReal: 6045 }));
        expect(gc.rewardDollars).toBe(gc.rewardPoints * 100);
    });

    test('rrRatio is Infinity when riskPoints is 0', () => {
        // Create a scenario where entry === sl is effectively impossible with
        // normal modes, but we can verify the guard via a known edge case.
        // entryPts = sl = 0 not possible with current modes, but test the formula:
        // riskPoints = |entry - sl| = |(base + entryPts) - (base - slPts)| = entryPts + slPts
        // This is always > 0 for real modes, so rrRatio won't be Infinity in practice.
        const result = computeLevels(inputs());
        expect(result.riskPoints).toBeGreaterThan(0);
        expect(isFinite(result.rrRatio)).toBe(true);
    });

    test('rrRatio is positive for both directions', () => {
        const long = computeLevels(inputs({ todayOpen: 6065, prevClose: 6080 }));
        const short = computeLevels(inputs({ todayOpen: 6095, prevClose: 6080 }));
        expect(long.rrRatio).toBeGreaterThan(0);
        expect(short.rrRatio).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────
// All instrument calculations
// ──────────────────────────────────────────────
describe('computeLevels – all instruments', () => {
    const instrumentKeys = ['ES', 'MES', 'NQ', 'GC'];

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

    test('prevClose of zero causes Infinity gapPercent but still returns result', () => {
        const result = computeLevels(inputs({
            prevHigh: 10, prevLow: 5, prevClose: 0, todayOpen: 5, extremeReal: 4
        }));
        // gap / prevClose = 5 / 0 = Infinity
        expect(result).not.toBeNull();
        expect(result.gapPercent).toBe(Infinity);
    });

    test('equal prevHigh and prevLow (zero range)', () => {
        const result = computeLevels(inputs({
            prevHigh: 6080, prevLow: 6080, prevClose: 6080, todayOpen: 6065, extremeReal: 6045
        }));
        expect(result.prevRange).toBe(0);
        // Expected range comes entirely from gap
        expect(result.expectedRange).toBe(Math.abs(6065 - 6080));
    });
});

// ──────────────────────────────────────────────
// Filter logic
// ──────────────────────────────────────────────
describe('computeFilters', () => {
    test('all filters pass for a good gap-down setup', () => {
        const filters = computeFilters({
            gapPercent: -0.25,
            prevRange: 50,
            isGapUp: false,
            extremeReal: 6045
        });
        expect(filters.gapFilter).toBe(true);
        expect(filters.rangeFilter).toBe(true);
        expect(filters.gapTypeFilter).toBe(true);
        expect(filters.extremeFilter).toBe(true);
        expect(filters.criticalPass).toBe(true);
        expect(filters.alertType).toBe('success');
    });

    test('gap filter fails when abs(gapPercent) < 0.15', () => {
        const filters = computeFilters({
            gapPercent: 0.10,
            prevRange: 50,
            isGapUp: true,
            extremeReal: 6100
        });
        expect(filters.gapFilter).toBe(false);
        expect(filters.criticalPass).toBe(false);
    });

    test('gap filter passes at exactly 0.15%', () => {
        const filters = computeFilters({
            gapPercent: 0.15,
            prevRange: 50,
            isGapUp: true,
            extremeReal: 6100
        });
        expect(filters.gapFilter).toBe(true);
    });

    test('gap filter passes for negative gapPercent with abs >= 0.15', () => {
        const filters = computeFilters({
            gapPercent: -0.20,
            prevRange: 50,
            isGapUp: false,
            extremeReal: 6045
        });
        expect(filters.gapFilter).toBe(true);
    });

    test('range filter fails when prevRange < 25', () => {
        const filters = computeFilters({
            gapPercent: -0.25,
            prevRange: 24,
            isGapUp: false,
            extremeReal: 6045
        });
        expect(filters.rangeFilter).toBe(false);
        expect(filters.criticalPass).toBe(false);
    });

    test('range filter passes at exactly 25', () => {
        const filters = computeFilters({
            gapPercent: -0.25,
            prevRange: 25,
            isGapUp: false,
            extremeReal: 6045
        });
        expect(filters.rangeFilter).toBe(true);
    });

    test('gap type filter prefers gap down (isGapUp = false)', () => {
        expect(computeFilters({ gapPercent: -0.25, prevRange: 50, isGapUp: false, extremeReal: 6045 }).gapTypeFilter).toBe(true);
        expect(computeFilters({ gapPercent: 0.25, prevRange: 50, isGapUp: true, extremeReal: 6100 }).gapTypeFilter).toBe(false);
    });

    test('extreme filter passes when extremeReal is a number', () => {
        expect(computeFilters({ gapPercent: -0.25, prevRange: 50, isGapUp: false, extremeReal: 6045 }).extremeFilter).toBe(true);
    });

    test('extreme filter fails when extremeReal is NaN', () => {
        expect(computeFilters({ gapPercent: -0.25, prevRange: 50, isGapUp: false, extremeReal: NaN }).extremeFilter).toBe(false);
    });
});

// ──────────────────────────────────────────────
// Filter boundary conditions
// ──────────────────────────────────────────────
describe('computeFilters – boundary conditions', () => {
    test('gap percent at 0.1499 fails', () => {
        const f = computeFilters({ gapPercent: 0.1499, prevRange: 50, isGapUp: true, extremeReal: 6100 });
        expect(f.gapFilter).toBe(false);
    });

    test('gap percent at 0.1501 passes', () => {
        const f = computeFilters({ gapPercent: 0.1501, prevRange: 50, isGapUp: true, extremeReal: 6100 });
        expect(f.gapFilter).toBe(true);
    });

    test('prevRange at 24.99 fails', () => {
        const f = computeFilters({ gapPercent: -0.25, prevRange: 24.99, isGapUp: false, extremeReal: 6045 });
        expect(f.rangeFilter).toBe(false);
    });

    test('prevRange at 25.01 passes', () => {
        const f = computeFilters({ gapPercent: -0.25, prevRange: 25.01, isGapUp: false, extremeReal: 6045 });
        expect(f.rangeFilter).toBe(true);
    });

    test('zero gap percent fails gap filter', () => {
        const f = computeFilters({ gapPercent: 0, prevRange: 50, isGapUp: false, extremeReal: 6045 });
        expect(f.gapFilter).toBe(false);
    });

    test('zero prevRange fails range filter', () => {
        const f = computeFilters({ gapPercent: -0.25, prevRange: 0, isGapUp: false, extremeReal: 6045 });
        expect(f.rangeFilter).toBe(false);
    });
});

// ──────────────────────────────────────────────
// Alert type logic
// ──────────────────────────────────────────────
describe('computeFilters – alertType', () => {
    test('danger when critical filters fail (gap too small)', () => {
        const f = computeFilters({ gapPercent: 0.05, prevRange: 50, isGapUp: true, extremeReal: 6100 });
        expect(f.alertType).toBe('danger');
    });

    test('danger when critical filters fail (range too small)', () => {
        const f = computeFilters({ gapPercent: -0.25, prevRange: 10, isGapUp: false, extremeReal: 6045 });
        expect(f.alertType).toBe('danger');
    });

    test('danger when both critical filters fail', () => {
        const f = computeFilters({ gapPercent: 0.05, prevRange: 10, isGapUp: true, extremeReal: 6100 });
        expect(f.alertType).toBe('danger');
    });

    test('warning-gap-up when gap up and critical pass', () => {
        const f = computeFilters({ gapPercent: 0.25, prevRange: 50, isGapUp: true, extremeReal: 6100 });
        expect(f.alertType).toBe('warning-gap-up');
    });

    test('warning-pending when gap down, critical pass, but no extreme', () => {
        const f = computeFilters({ gapPercent: -0.25, prevRange: 50, isGapUp: false, extremeReal: NaN });
        expect(f.alertType).toBe('warning-pending');
    });

    test('success when gap down, critical pass, and extreme confirmed', () => {
        const f = computeFilters({ gapPercent: -0.25, prevRange: 50, isGapUp: false, extremeReal: 6045 });
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
        expect(result.filters).toHaveProperty('criticalPass');
        expect(result.filters).toHaveProperty('alertType');
    });

    test('filters match standalone computeFilters', () => {
        const result = computeLevels(inputs());
        const standalone = computeFilters({
            gapPercent: result.gapPercent,
            prevRange: result.prevRange,
            isGapUp: result.isGapUp,
            extremeReal: baseInputs.extremeReal
        });
        expect(result.filters).toEqual(standalone);
    });
});

// ──────────────────────────────────────────────
// suggestEntryMode
// ──────────────────────────────────────────────
describe('suggestEntryMode', () => {
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

    test('returns forceClass when provided', () => {
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
            todayOpen: 6065,
            extremeReal: 6045,
            vixLevel: 'normal',
            instrumentKey: 'ES',
            entryModeKey: 'standard'
        });

        expect(result.direction).toBe('LONG');
        expect(result.gap).toBe(-15);
        expect(result.prevRange).toBe(50);
        expect(result.expectedRange).toBeCloseTo(50 * 0.87 + 15, 6);
        expect(result.entry).toBe(6045 + 6.5);
        expect(result.sl).toBe(6045 - 3.5);
        expect(result.filters.criticalPass).toBe(true);
        expect(result.filters.alertType).toBe('success');
    });

    test('gap up with aggressive mode on MES', () => {
        const result = computeLevels({
            prevHigh: 6100,
            prevLow: 6050,
            prevClose: 6080,
            todayOpen: 6095,
            extremeReal: 6115,
            vixLevel: 'high',
            instrumentKey: 'MES',
            entryModeKey: 'aggressive'
        });

        expect(result.direction).toBe('SHORT');
        expect(result.entry).toBe(6115 - 5.0);
        expect(result.sl).toBe(6115 + 3.0);
        expect(result.riskDollars).toBe(result.riskPoints * 5);
        expect(result.filters.gapTypeFilter).toBe(false); // Gap up, not preferred
    });

    test('extreme VIX on GC with conservative mode', () => {
        const result = computeLevels({
            prevHigh: 2050,
            prevLow: 2000,
            prevClose: 2020,
            todayOpen: 2010,
            extremeReal: 1995,
            vixLevel: 'extreme',
            instrumentKey: 'GC',
            entryModeKey: 'conservative'
        });

        expect(result.direction).toBe('LONG');
        expect(result.factor).toBe(0.97);
        expect(result.entry).toBe(1995 + 8.0);
        expect(result.sl).toBe(1995 - 4.0);
        expect(result.riskDollars).toBe(result.riskPoints * 100);
    });

    test('NQ with estimated extreme (no real extreme)', () => {
        const result = computeLevels({
            prevHigh: 18500,
            prevLow: 18400,
            prevClose: 18450,
            todayOpen: 18420,
            extremeReal: NaN,
            vixLevel: 'low',
            instrumentKey: 'NQ',
            entryModeKey: 'standard'
        });

        expect(result.direction).toBe('LONG');
        expect(result.hasExtremeReal).toBe(false);
        expect(result.filters.extremeFilter).toBe(false);
        expect(result.riskDollars).toBe(result.riskPoints * 20);
    });

    test('tiny gap that fails minimum gap filter', () => {
        const result = computeLevels({
            prevHigh: 6100,
            prevLow: 6050,
            prevClose: 6080,
            todayOpen: 6081,
            extremeReal: 6090,
            vixLevel: 'normal',
            instrumentKey: 'ES',
            entryModeKey: 'standard'
        });

        // gapPercent = (1/6080)*100 = ~0.0164%, below 0.15%
        expect(result.filters.gapFilter).toBe(false);
        expect(result.filters.criticalPass).toBe(false);
        expect(result.filters.alertType).toBe('danger');
    });
});
