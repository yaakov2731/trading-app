// ============================================================
// MÉTODO 2 - Gap Reversal Calculator
// Metodología: GAP es parte del rango del día
// El rango TOTAL (incluyendo gap) se usa para calcular niveles del día siguiente
// Backtest real: 10 años ES (2016-2026), 1545 trades
// ============================================================

// Instrument multipliers
const instruments = {
    'ES':  { multiplier: 50,  name: '/ES',  tick: 0.25 },
    'MES': { multiplier: 5,   name: '/MES', tick: 0.25 },
    'NQ':  { multiplier: 20,  name: '/NQ',  tick: 0.25 },
    'MNQ': { multiplier: 2,   name: '/MNQ', tick: 0.25 },
    'RTY': { multiplier: 50,  name: '/RTY', tick: 0.10 },
    'GC':  { multiplier: 100, name: '/GC',  tick: 0.10 }
};

// Fracciones de rango según metodología de la libreta
// Derivadas de los niveles reales: 26/143=0.182, 52/143=0.364, 105/143=0.734
const RANGE_FRACTIONS = {
    f1: 26 / 143,   // ≈ 0.182 (nivel "26" de la libreta)
    f2: 52 / 143,   // ≈ 0.364 (nivel "52" de la libreta)
    f3: 105 / 143,  // ≈ 0.734 (nivel "105" de la libreta ≈ 3/4 del rango)
};

// Entry modes - puntos desde el extremo real
const entryModes = {
    'aggressive':  { entry: 5.0, sl: 3.0, label: '5 pts' },
    'standard':    { entry: 6.5, sl: 3.5, label: '6.5 pts' },
    'conservative':{ entry: 8.0, sl: 4.0, label: '8 pts' }
};

// Parámetros del sistema
const params = {
    tp1Pct: 0.50,
    tp2Pct: 0.75,
    tp3Pct: 0.90,
    minGapPct: 0.10,    // Gap mínimo 0.10% (ajustado al backtest real)
    minPrevRange: 15,   // Rango mínimo 15 pts
};

// Estadísticas reales del backtest (10 años, 2016-2026)
// FILTROS MEJORADOS - Análisis de 10 años, datos reales
const BACKTEST_STATS = {
    totalTrades: 1545,
    winRate: 36.1,
    profitFactor: 1.11,
    totalPnlDollars: 56145,
    avgWinPts: 19.75,
    avgLossPts: -10.0,
    longWR: 42.1,
    shortWR: 31.7,
    yearsBacktested: 10,
    dataSource: 'ES 1H + 15M, 2016-2026',
    // FILTROS GANADORES (análisis de 10 años)
    // Filtro A: LONG + Vol<80% + Rango<40 → WR=72.9%, PF=2.82, 85 trades
    // Filtro B: LONG + Close D-1<35% + Rango<40 → WR=67.9%, PF=2.25, 78 trades
    // Filtro C: LONG + Vol<100% + Rango<40 → WR=61.5%, PF=1.77, 187 trades (RECOMENDADO)
    // Filtro D: LONG + Vol<100% + Rango<40 + Mar-Jue → WR=62.3%, PF=1.89, 114 trades
    filterStats: [
        { name: 'Sin filtros (baseline)',              trades: 1545, wr: 36.1, pf: 1.11, pnl_usd: 56145,  conditions: 'Todos los setups' },
        { name: 'LONG + Vol<100% + Rango<40',          trades: 187,  wr: 61.5, pf: 1.77, pnl_usd: 27631,  conditions: 'Gap DOWN + ATR5<ATR20 + Rango<40' },
        { name: 'LONG + Vol<80% + Rango<40',           trades: 85,   wr: 72.9, pf: 2.82, pnl_usd: 20969,  conditions: 'Gap DOWN + ATR5<80%ATR20 + Rango<40' },
        { name: 'LONG + Close D-1<35% + Rango<40',     trades: 78,   wr: 67.9, pf: 2.25, pnl_usd: 15634,  conditions: 'Gap DOWN + Close D-1 bajo + Rango<40' },
        { name: 'LONG + Vol<100% + Rango<40 + Mar-Jue', trades: 114, wr: 62.3, pf: 1.89, pnl_usd: 19084,  conditions: 'Gap DOWN + ATR5<ATR20 + Rango<40 + Mar-Jue' },
    ],
    // Win rate por tamaño de gap
    gapAnalysis: [
        { bucket: '0.1-0.2%', wr: 38.7, trades: 302 },
        { bucket: '0.2-0.3%', wr: 37.0, trades: 254 },
        { bucket: '0.3-0.5%', wr: 37.8, trades: 360 },
        { bucket: '0.5-1.0%', wr: 36.4, trades: 396 },
        { bucket: '>1.0%',    wr: 28.3, trades: 233 },
    ],
    // Win rate por rango previo
    rangeAnalysis: [
        { bucket: '<25 pts',    wr: 50.1, trades: 347 },
        { bucket: '25-40 pts',  wr: 43.8, trades: 411 },
        { bucket: '40-60 pts',  wr: 32.2, trades: 360 },
        { bucket: '60-100 pts', wr: 21.9, trades: 301 },
        { bucket: '>100 pts',   wr: 16.7, trades: 126 },
    ],
    // Frecuencia de toque de niveles de rango
    levelHits: [
        { level: 'H (prev_true_high)',    pct: 46.1 },
        { level: 'H - R×0.182 (nivel 26)', pct: 50.8 },
        { level: 'H - R×0.364 (nivel 52)', pct: 51.2 },
        { level: 'H - R×0.734 (nivel 105)',pct: 42.5 },
        { level: 'Midpoint',               pct: 48.9 },
        { level: 'L + R×0.734',            pct: 51.1 },
        { level: 'L + R×0.364',            pct: 45.3 },
        { level: 'L + R×0.182',            pct: 39.5 },
        { level: 'L (prev_true_low)',       pct: 33.5 },
    ],
    // Resultados anuales
    yearly: [
        { year: 2016, trades: 117, wins: 47,  wr: 40.2, pnl: -11816 },
        { year: 2017, trades: 59,  wins: 20,  wr: 33.9, pnl: -13472 },
        { year: 2018, trades: 171, wins: 65,  wr: 38.0, pnl: -1116  },
        { year: 2019, trades: 157, wins: 67,  wr: 42.7, pnl: -11544 },
        { year: 2020, trades: 186, wins: 57,  wr: 30.6, pnl: 3572   },
        { year: 2021, trades: 171, wins: 71,  wr: 41.5, pnl: 3197   },
        { year: 2022, trades: 172, wins: 51,  wr: 29.7, pnl: 35691  },
        { year: 2023, trades: 181, wins: 75,  wr: 41.4, pnl: 24847  },
        { year: 2024, trades: 158, wins: 58,  wr: 36.7, pnl: 12244  },
        { year: 2025, trades: 154, wins: 39,  wr: 25.3, pnl: 10984  },
        { year: 2026, trades: 19,  wins: 7,   wr: 36.8, pnl: 3553   },
    ]
};

/**
 * Calcula el rango TOTAL del día (incluyendo el gap).
 * 
 * Regla: El gap es parte del rango del día.
 * Rango total = max(High_RTH, Open_RTH) - min(Low_RTH, Close_anterior)
 * 
 * @param {number} dayHigh - High del día (RTH)
 * @param {number} dayLow - Low del día (RTH)
 * @param {number} dayOpen - Open del día (RTH)
 * @param {number} prevClose - Close del día anterior (RTH)
 * @returns {object} { trueHigh, trueLow, rangeTotal, gap, gapPct, isGapUp }
 */
function calcTrueRange(dayHigh, dayLow, dayOpen, prevClose) {
    const trueHigh = Math.max(dayHigh, dayOpen);
    const trueLow  = Math.min(dayLow, prevClose);
    const rangeTotal = trueHigh - trueLow;
    const gap = dayOpen - prevClose;
    const gapPct = prevClose !== 0 ? (Math.abs(gap) / prevClose) * 100 : 0;
    const isGapUp = gap > 0;
    return { trueHigh, trueLow, rangeTotal, gap, gapPct, isGapUp };
}

/**
 * Calcula los niveles de rango según metodología de la libreta.
 * Usa el RANGO TOTAL del día anterior para proyectar niveles del día siguiente.
 * 
 * Fracciones: 0.182, 0.364, 0.734 (derivadas de 26/143, 52/143, 105/143)
 * 
 * @param {number} prevTrueHigh - True High del día anterior
 * @param {number} prevTrueLow - True Low del día anterior
 * @param {number} rangeTotal - Rango total del día anterior
 * @returns {object} Niveles de rango
 */
function calcRangeLevels(prevTrueHigh, prevTrueLow, rangeTotal) {
    const { f1, f2, f3 } = RANGE_FRACTIONS;
    const midpoint = (prevTrueHigh + prevTrueLow) / 2;

    return {
        // Desde el True High hacia abajo
        H:          prevTrueHigh,
        H_f1:       prevTrueHigh - rangeTotal * f1,   // H - 18.2%R (nivel ~26 pts en R=143)
        H_f2:       prevTrueHigh - rangeTotal * f2,   // H - 36.4%R (nivel ~52 pts)
        H_f3:       prevTrueHigh - rangeTotal * f3,   // H - 73.4%R (nivel ~105 pts ≈ 3/4R)
        midpoint:   midpoint,
        // Desde el True Low hacia arriba
        L_f3:       prevTrueLow  + rangeTotal * f3,
        L_f2:       prevTrueLow  + rangeTotal * f2,
        L_f1:       prevTrueLow  + rangeTotal * f1,
        L:          prevTrueLow,
        // Niveles extendidos (más allá del rango)
        H_ext:      prevTrueHigh + rangeTotal * f1,   // Extensión alcista
        L_ext:      prevTrueLow  - rangeTotal * f1,   // Extensión bajista
    };
}

/**
 * Función principal: calcula todos los niveles operativos.
 * 
 * INPUTS:
 * - prevHigh, prevLow, prevClose: datos del día anterior (RTH)
 * - prevOpen: open del día anterior (para calcular el true range del día anterior)
 * - prevPrevClose: close de hace 2 días (para calcular el true range del día anterior)
 * - todayOpen: open de hoy
 * - extremeReal: High o Low de la primera hora RTH de hoy (opcional)
 * - entryModeKey, instrumentKey
 */
function computeLevels({
    prevHigh, prevLow, prevClose, prevOpen, prevPrevClose,
    todayOpen, extremeReal, entryModeKey, instrumentKey,
    // Parámetros para filtros avanzados (opcionales)
    atr5, atr20, dow
}) {
    // Validaciones
    if (isNaN(prevHigh) || isNaN(prevLow) || isNaN(prevClose) || isNaN(todayOpen)) {
        return null;
    }

    const instrument = instruments[instrumentKey];
    const entryMode = entryModes[entryModeKey];
    if (!instrument || !entryMode) return null;

    // --------------------------------------------------------
    // 1. RANGO TOTAL DEL DÍA ANTERIOR (incluye gap de ayer)
    // --------------------------------------------------------
    let prevTrueHigh, prevTrueLow, prevRangeTotal;

    if (!isNaN(prevOpen) && !isNaN(prevPrevClose)) {
        // Tenemos datos completos: calcular true range del día anterior
        const prevTR = calcTrueRange(prevHigh, prevLow, prevOpen, prevPrevClose);
        prevTrueHigh = prevTR.trueHigh;
        prevTrueLow  = prevTR.trueLow;
        prevRangeTotal = prevTR.rangeTotal;
    } else {
        // Sin datos del día anterior anterior: usar H/L del día anterior como aproximación
        prevTrueHigh = prevHigh;
        prevTrueLow  = prevLow;
        prevRangeTotal = prevHigh - prevLow;
    }

    // --------------------------------------------------------
    // 2. GAP DE HOY
    // --------------------------------------------------------
    const gap = todayOpen - prevClose;
    const gapPct = prevClose !== 0 ? (Math.abs(gap) / prevClose) * 100 : 0;
    const isGapUp = gap > 0;
    const direction = isGapUp ? 'SHORT' : 'LONG';

    // Régimen de volatilidad (ATR5 / ATR20)
    const volRegime = (!isNaN(atr5) && !isNaN(atr20) && atr20 > 0) ? atr5 / atr20 : null;

    // Posición del close D-1 en el rango (0=Low, 1=High)
    const prevRangeForPos = prevHigh - prevLow;
    const closePosD1 = prevRangeForPos > 0 ? (prevClose - prevLow) / prevRangeForPos : null;

    // --------------------------------------------------------
    // 3. NIVELES DE RANGO (del día anterior, para hoy)
    // --------------------------------------------------------
    const rangeLevels = calcRangeLevels(prevTrueHigh, prevTrueLow, prevRangeTotal);

    // --------------------------------------------------------
    // 4. EXTREMO REAL (base para entry/sl/tp)
    // --------------------------------------------------------
    const hasExtremeReal = !isNaN(extremeReal) && extremeReal !== null && extremeReal !== undefined;
    let baseExtreme;

    if (hasExtremeReal) {
        baseExtreme = extremeReal;
    } else {
        // Estimación: el extremo se forma dentro del rango esperado
        // Usamos el rango total del día anterior como referencia
        const gapMove = prevRangeTotal * 0.42;
        baseExtreme = isGapUp
            ? todayOpen + gapMove
            : todayOpen - gapMove;
    }

    // --------------------------------------------------------
    // 5. ENTRY, SL, TPs
    // --------------------------------------------------------
    const entryPts = entryMode.entry;
    const slPts    = entryMode.sl;
    let entry, sl, tp1, tp2, tp3;

    if (direction === 'SHORT') {
        entry = baseExtreme - entryPts;
        sl    = baseExtreme + slPts;
        tp1   = baseExtreme - (prevRangeTotal * params.tp1Pct);
        tp2   = baseExtreme - (prevRangeTotal * params.tp2Pct);
        tp3   = baseExtreme - (prevRangeTotal * params.tp3Pct);
    } else {
        entry = baseExtreme + entryPts;
        sl    = baseExtreme - slPts;
        tp1   = baseExtreme + (prevRangeTotal * params.tp1Pct);
        tp2   = baseExtreme + (prevRangeTotal * params.tp2Pct);
        tp3   = baseExtreme + (prevRangeTotal * params.tp3Pct);
    }

    const riskPoints   = Math.abs(entry - sl);
    const rewardPoints = Math.abs(tp2 - entry);
    const rrRatio      = riskPoints === 0 ? Infinity : rewardPoints / riskPoints;
    const riskDollars  = riskPoints * instrument.multiplier;
    const rewardDollars= rewardPoints * instrument.multiplier;

    // --------------------------------------------------------
    // 6. FILTROS
    // --------------------------------------------------------
    const filters = computeFilters({ gapPct, prevRangeTotal, isGapUp, hasExtremeReal });

    // Win rate esperado según gap size
    let expectedWR = 36.1; // promedio general
    if (gapPct < 0.2) expectedWR = 38.7;
    else if (gapPct < 0.3) expectedWR = 37.0;
    else if (gapPct < 0.5) expectedWR = 37.8;
    else if (gapPct < 1.0) expectedWR = 36.4;
    else expectedWR = 28.3;

    // Win rate esperado según rango previo
    let expectedWR_range = 36.1;
    if (prevRangeTotal < 25) expectedWR_range = 50.1;
    else if (prevRangeTotal < 40) expectedWR_range = 43.8;
    else if (prevRangeTotal < 60) expectedWR_range = 32.2;
    else if (prevRangeTotal < 100) expectedWR_range = 21.9;
    else expectedWR_range = 16.7;

    // --------------------------------------------------------
    // 7. FILTROS MEJORADOS (análisis 10 años)
    // Calcula qué filtros aplican y el WR esperado con filtros
    // --------------------------------------------------------
    const filterAnalysis = computeAdvancedFilters({
        isGapUp, prevRangeTotal, gapPct, volRegime, closePosD1, dow
    });

    // WR esperado con filtros activos
    const filteredWR = filterAnalysis.bestFilterWR || expectedWR;

    return {
        // Rango
        prevRangeTotal,
        prevTrueHigh,
        prevTrueLow,
        // Gap
        gap,
        gapPct,
        isGapUp,
        direction,
        // Extremo
        baseExtreme,
        hasExtremeReal,
        // Niveles de trading
        entry, sl, tp1, tp2, tp3,
        entryPts, slPts,
        // Risk/Reward
        riskPoints, rewardPoints, rrRatio,
        riskDollars, rewardDollars,
        // Niveles de rango (metodología libreta)
        rangeLevels,
        // Filtros
        filters,
        filterAnalysis,
        // Win rate esperado
        expectedWR,
        expectedWR_range,
        filteredWR,
        volRegime,
        closePosD1,
        // Instrumento
        instrument,
        entryMode,
    };
}

/**
 * Calcula los filtros AVANZADOS del setup (basados en análisis de 10 años).
 * Resultados reales del backtest 2016-2026:
 * - Filtro A: LONG + Vol<80% + Rango<40 → WR=72.9%, PF=2.82 (85 trades)
 * - Filtro B: LONG + Close D-1<35% + Rango<40 → WR=67.9%, PF=2.25 (78 trades)
 * - Filtro C: LONG + Vol<100% + Rango<40 → WR=61.5%, PF=1.77 (187 trades) [RECOMENDADO]
 * - Filtro D: LONG + Vol<100% + Rango<40 + Mar-Jue → WR=62.3%, PF=1.89 (114 trades)
 */
function computeAdvancedFilters({ isGapUp, prevRangeTotal, gapPct, volRegime, closePosD1, dow }) {
    const isLong = !isGapUp;
    const rangeOk = prevRangeTotal < 40;
    const volLow80  = volRegime !== null && volRegime < 0.80;  // ATR5 < 80% ATR20
    const volLow100 = volRegime !== null && volRegime < 1.00;  // ATR5 < 100% ATR20
    const closeLow  = closePosD1 !== null && closePosD1 < 0.35; // Close D-1 en zona baja
    const isMidWeek = dow !== null && [1, 2, 3].includes(dow); // Mar=1, Mie=2, Jue=3

    // Evaluar cada filtro
    const filterA = isLong && volLow80  && rangeOk;  // WR=72.9%
    const filterB = isLong && closeLow  && rangeOk;  // WR=67.9%
    const filterC = isLong && volLow100 && rangeOk;  // WR=61.5% (RECOMENDADO)
    const filterD = isLong && volLow100 && rangeOk && isMidWeek; // WR=62.3%

    // Determinar el mejor filtro activo
    let activeFilters = [];
    let bestFilterWR = null;
    let bestFilterName = null;
    let bestFilterPF = null;
    let qualityScore = 0; // 0=no aplica, 1=baseline, 2=bueno, 3=muy bueno, 4=excelente

    if (filterA) {
        activeFilters.push({ name: 'Filtro A', wr: 72.9, pf: 2.82, trades: 85, label: 'Vol<80% + Rango<40' });
        if (!bestFilterWR || 72.9 > bestFilterWR) { bestFilterWR = 72.9; bestFilterName = 'A'; bestFilterPF = 2.82; qualityScore = 4; }
    }
    if (filterB) {
        activeFilters.push({ name: 'Filtro B', wr: 67.9, pf: 2.25, trades: 78, label: 'Close D-1<35% + Rango<40' });
        if (!bestFilterWR || 67.9 > bestFilterWR) { bestFilterWR = 67.9; bestFilterName = 'B'; bestFilterPF = 2.25; qualityScore = Math.max(qualityScore, 4); }
    }
    if (filterD) {
        activeFilters.push({ name: 'Filtro D', wr: 62.3, pf: 1.89, trades: 114, label: 'Vol<100% + Rango<40 + Mar-Jue' });
        if (!bestFilterWR || 62.3 > bestFilterWR) { bestFilterWR = 62.3; bestFilterName = 'D'; bestFilterPF = 1.89; qualityScore = Math.max(qualityScore, 3); }
    }
    if (filterC) {
        activeFilters.push({ name: 'Filtro C', wr: 61.5, pf: 1.77, trades: 187, label: 'Vol<100% + Rango<40' });
        if (!bestFilterWR || 61.5 > bestFilterWR) { bestFilterWR = 61.5; bestFilterName = 'C'; bestFilterPF = 1.77; qualityScore = Math.max(qualityScore, 3); }
    }

    // Si es LONG sin filtros especiales
    if (isLong && !filterC && !filterA && !filterB) {
        bestFilterWR = 42.1; bestFilterName = 'LONG base'; bestFilterPF = 1.45; qualityScore = 2;
    }

    // Si es SHORT
    if (!isLong) {
        bestFilterWR = 31.7; bestFilterName = 'SHORT base'; bestFilterPF = 0.91; qualityScore = 1;
    }

    // Datos para mostrar en la UI
    const hasHighQualitySetup = qualityScore >= 3;
    const recommendation = qualityScore >= 4 ? 'SETUP PREMIUM ★★★' :
                           qualityScore >= 3 ? 'SETUP BUENO ★★' :
                           qualityScore >= 2 ? 'SETUP NORMAL ★' :
                           'SETUP BAJO (SHORT)';

    // Condiciones faltantes para llegar al filtro C (el más accesible)
    const missingForC = [];
    if (!isLong) missingForC.push('Necesita Gap DOWN (no UP)');
    if (!rangeOk) missingForC.push(`Rango D-1 debe ser <40 pts (actual: ${prevRangeTotal.toFixed(1)})`);
    if (!volLow100 && volRegime !== null) missingForC.push(`Vol régimen debe ser <1.0 (actual: ${volRegime.toFixed(2)})`);
    if (volRegime === null) missingForC.push('Ingresar ATR5/ATR20 para activar filtro de volatilidad');

    return {
        filterA, filterB, filterC, filterD,
        activeFilters,
        bestFilterWR,
        bestFilterName,
        bestFilterPF,
        qualityScore,
        hasHighQualitySetup,
        recommendation,
        missingForC,
        volRegime,
        closePosD1,
    };
}

/**
 * Calcula los filtros del setup.
 */
function computeFilters({ gapPct, prevRangeTotal, isGapUp, hasExtremeReal }) {
    const gapFilter   = gapPct >= params.minGapPct;
    const rangeFilter = prevRangeTotal >= params.minPrevRange;
    const criticalPass = gapFilter && rangeFilter;

    let alertType;
    if (!criticalPass) alertType = 'danger';
    else if (isGapUp) alertType = 'warning-gap-up';
    else if (!hasExtremeReal) alertType = 'warning-pending';
    else alertType = 'success';

    return { gapFilter, rangeFilter, criticalPass, alertType, hasExtremeReal };
}

// Export para Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        instruments, entryModes, params, RANGE_FRACTIONS, BACKTEST_STATS,
        calcTrueRange, calcRangeLevels, computeLevels, computeFilters,
    };
}
