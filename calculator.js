// Instrument multipliers
const instruments = {
    'ES': { multiplier: 50, name: '/ES', tick: 0.25 },
    'MES': { multiplier: 5, name: '/MES', tick: 0.25 },
    'NQ': { multiplier: 20, name: '/NQ', tick: 0.25 },
    'GC': { multiplier: 100, name: '/GC', tick: 0.10 }
};

// VIX factors (optimized based on backtest)
const vixFactors = {
    'low': 0.82,
    'normal': 0.87,
    'high': 0.92,
    'extreme': 0.97
};

// Entry modes - fixed point distance from extreme
const entryModes = {
    'aggressive': { entry: 5.0, sl: 3.0, label: '5 pts' },
    'standard': { entry: 6.5, sl: 3.5, label: '6.5 pts' },
    'conservative': { entry: 8.0, sl: 4.0, label: '8 pts' }
};

// OPTIMIZED PARAMETERS based on real backtest analysis
const params = {
    tp1Pct: 0.50,
    tp2Pct: 0.75,
    tp3Pct: 0.90,
    minGapPct: 0.15,
    minPrevRange: 25,
    gapMoveEstimate: 0.42
};

/**
 * Compute all trading levels from raw inputs.
 * Returns null if required inputs are missing/NaN.
 */
function computeLevels({ prevHigh, prevLow, prevClose, todayOpen, extremeReal, vixLevel, instrumentKey, entryModeKey }) {
    if (!Number.isFinite(prevHigh) || !Number.isFinite(prevLow) || !Number.isFinite(prevClose) || !Number.isFinite(todayOpen)) {
        return null;
    }

    if (prevHigh < prevLow || prevClose === 0) {
        return null;
    }

    const instrument = instruments[instrumentKey];
    const entryMode = entryModes[entryModeKey];

    if (!instrument || !entryMode) {
        return null;
    }

    const factor = vixFactors[vixLevel];
    if (factor === undefined) {
        return null;
    }

    const prevRange = prevHigh - prevLow;
    const gap = todayOpen - prevClose;
    const gapPercent = (gap / prevClose) * 100;
    const isGapUp = gap > 0;
    const expectedRange = (prevRange * factor) + Math.abs(gap);
    const direction = isGapUp ? 'SHORT' : 'LONG';

    // Estimate extreme if not provided
    let baseExtreme = extremeReal;
    const hasExtremeReal = Number.isFinite(extremeReal);
    if (!hasExtremeReal) {
        const gapMove = expectedRange * params.gapMoveEstimate;
        baseExtreme = isGapUp ? todayOpen + gapMove : todayOpen - gapMove;
    }

    // Calculate levels - fixed point distance from extreme
    const entryPts = entryMode.entry;
    const slPts = entryMode.sl;

    let entry, tp1, tp2, tp3, sl;

    if (direction === 'SHORT') {
        entry = baseExtreme - entryPts;
        sl = baseExtreme + slPts;
        tp1 = baseExtreme - (expectedRange * params.tp1Pct);
        tp2 = baseExtreme - (expectedRange * params.tp2Pct);
        tp3 = baseExtreme - (expectedRange * params.tp3Pct);
    } else {
        entry = baseExtreme + entryPts;
        sl = baseExtreme - slPts;
        tp1 = baseExtreme + (expectedRange * params.tp1Pct);
        tp2 = baseExtreme + (expectedRange * params.tp2Pct);
        tp3 = baseExtreme + (expectedRange * params.tp3Pct);
    }

    const riskPoints = Math.abs(entry - sl);
    const rewardPoints = Math.abs(tp2 - entry);
    const rrRatio = riskPoints === 0 ? Infinity : rewardPoints / riskPoints;
    const riskDollars = riskPoints * instrument.multiplier;
    const rewardDollars = rewardPoints * instrument.multiplier;

    // Filters
    const filters = computeFilters({ gapPercent, prevRange, isGapUp, extremeReal: hasExtremeReal ? extremeReal : NaN });

    return {
        prevRange,
        gap,
        gapPercent,
        isGapUp,
        factor,
        expectedRange,
        direction,
        baseExtreme,
        hasExtremeReal,
        entry,
        sl,
        tp1,
        tp2,
        tp3,
        entryPts,
        slPts,
        riskPoints,
        rewardPoints,
        rrRatio,
        riskDollars,
        rewardDollars,
        instrument,
        entryMode,
        filters
    };
}

/**
 * Compute filter results for a trade setup.
 */
function computeFilters({ gapPercent, prevRange, isGapUp, extremeReal }) {
    const normalizedGapPercent = Number.isFinite(gapPercent) ? gapPercent : 0;
    const normalizedPrevRange = Number.isFinite(prevRange) ? prevRange : 0;
    const gapFilter = Math.abs(normalizedGapPercent) >= params.minGapPct;
    const rangeFilter = normalizedPrevRange >= params.minPrevRange;
    const gapTypeFilter = !isGapUp;
    const extremeFilter = !isNaN(extremeReal);

    const criticalPass = gapFilter && rangeFilter;

    let alertType;
    if (!criticalPass) {
        alertType = 'danger';
    } else if (isGapUp) {
        alertType = 'warning-gap-up';
    } else if (!extremeFilter) {
        alertType = 'warning-pending';
    } else {
        alertType = 'success';
    }

    return {
        gapFilter,
        rangeFilter,
        gapTypeFilter,
        extremeFilter,
        criticalPass,
        alertType
    };
}

/**
 * Determine the suggested entry mode based on gap direction.
 * Returns the suggested mode key, or null if no change needed.
 */
function suggestEntryMode(isGapUp, currentModeKey) {
    if (isGapUp && currentModeKey === 'aggressive') {
        return 'standard';
    } else if (!isGapUp && currentModeKey === 'conservative') {
        return 'aggressive';
    }
    return null;
}

/**
 * Determine the filter display status class.
 */
function getFilterStatusClass(passed, forceClass) {
    return forceClass || (passed ? 'pass' : 'fail');
}

/**
 * Get the icon for a filter status class.
 */
function getFilterIcon(statusClass) {
    if (statusClass === 'pass') return '✓';
    if (statusClass === 'warn') return '⚠';
    return '✗';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        instruments,
        vixFactors,
        entryModes,
        params,
        computeLevels,
        computeFilters,
        suggestEntryMode,
        getFilterStatusClass,
        getFilterIcon
    };
}
