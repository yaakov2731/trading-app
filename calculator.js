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

// Fracciones de rango — metodología de octavos (R/8)
// El rango se divide en 8 partes iguales.
// Midpoint (R/2) = línea divisoria SELL ZONE (arriba) / BUY ZONE (abajo).
// El precio tiende a buscar el 25% o 37.5% en la dirección del gap antes de reversar.
//
//   High ──────── 100%
//          R/8      87.5%  (SELL ZONE)
//          R/4      75.0%  (SELL ZONE)
//         3R/8      62.5%  (SELL ZONE)
//   Mid ─────────  50.0%  ← DIVISOR
//         3R/8      37.5%  (BUY ZONE)  ← objetivo gap pequeño
//          R/4      25.0%  (BUY ZONE)  ← objetivo gap mediano/grande
//          R/8      12.5%  (BUY ZONE)
//   Low ──────── 0%
const RANGE_FRACTIONS = {
    f1: 1 / 8,   // 0.125  = R/8
    f2: 1 / 4,   // 0.250  = R/4
    f3: 3 / 8,   // 0.375  = 3R/8
    f4: 1 / 2,   // 0.500  = R/2 (midpoint)
    f5: 5 / 8,   // 0.625  = 5R/8
    f6: 3 / 4,   // 0.750  = 3R/4
    f7: 7 / 8,   // 0.875  = 7R/8
};

// Entry modes - puntos desde el extremo real
// FILTRO A ÓPTIMO: Entry=4pts / SL=2.5pts → WR=83%, PF=10.13 (10 años de datos)
const entryModes = {
    'filtro_a':    { entry: 4.0, sl: 2.5,  label: '4 pts ★ Filtro A' },
    'aggressive':  { entry: 5.0, sl: 3.0,  label: '5 pts' },
    'standard':    { entry: 6.5, sl: 3.5,  label: '6.5 pts' },
    'conservative':{ entry: 8.0, sl: 4.0,  label: '8 pts' }
};

// Parámetros del sistema
const params = {
    tp1Pct: 0.50,
    tp2Pct: 0.75,
    tp3Pct: 0.90,
    minGapPct: 0.10,        // Gap mínimo 0.10% (ajustado al backtest real)
    minPrevRange: 15,       // Rango mínimo 15 pts
    gapMoveEstimate: 0.42,  // Factor estimación extremo (42% del rango previo)
    rangeHighWarn: 60,      // Rango >60pts: 21.9% WR → zona de advertencia
    rangeExtremeWarn: 100,  // Rango >100pts: 16.7% WR → zona crítica
    bigGapWarn: 1.0,        // Gap >1%: 28.3% WR → advertencia
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
        { name: 'Sin filtros (baseline)',              trades: 1545, wr: 36.1, pf: 1.11,  pnl_usd: 56145,  conditions: 'Todos los setups' },
        { name: 'LONG + Vol<100% + Rango<40',          trades: 187,  wr: 61.5, pf: 1.77,  pnl_usd: 27631,  conditions: 'Gap DOWN + ATR5<ATR20 + Rango<40' },
        { name: 'LONG + Vol<80% + Rango<40',           trades: 85,   wr: 72.9, pf: 2.82,  pnl_usd: 20969,  conditions: 'Gap DOWN + ATR5<80%ATR20 + Rango<40' },
        { name: 'LONG + Close D-1<35% + Rango<40',     trades: 78,   wr: 67.9, pf: 2.25,  pnl_usd: 15634,  conditions: 'Gap DOWN + Close D-1 bajo + Rango<40' },
        { name: 'LONG + Vol<100% + Rango<40 + Mar-Jue', trades: 114, wr: 62.3, pf: 1.89,  pnl_usd: 19084,  conditions: 'Gap DOWN + ATR5<ATR20 + Rango<40 + Mar-Jue' },
    ],
    // FILTRO A CON ENTRY OPTIMIZADO (análisis de movimiento desde extremo)
    filtroAEntryStats: [
        { entry: 4.0, sl: 2.5, trades: 88, wr: 83.0, pf: 10.13, pnl_usd: 44503 },
        { entry: 4.0, sl: 3.0, trades: 88, wr: 84.1, pf: 10.12, pnl_usd: 44703 },
        { entry: 5.0, sl: 2.5, trades: 88, wr: 83.0, pf: 8.13,  pnl_usd: 40103 },
        { entry: 5.0, sl: 3.0, trades: 88, wr: 84.1, pf: 8.20,  pnl_usd: 40303 },
        { entry: 6.5, sl: 3.5, trades: 88, wr: 84.1, pf: 5.76,  pnl_usd: 33353 },
        { entry: 8.0, sl: 4.0, trades: 87, wr: 86.2, pf: 4.86,  pnl_usd: 27766 },
    ],
    // Estadísticas de movimiento desde el extremo (Filtro A, 88 trades, 10 años)
    extremeMovement: {
        // Distancia del extremo al cierre del día
        distToClose: { mean: 13.14, median: 10.62, p25: 3.50, p75: 20.00, p90: 30.32 },
        pctAboveExtreme: { '0pts': 87.5, '5pts': 69.3, '10pts': 52.3, '15pts': 38.6, '20pts': 25.0 },
        // MAE: máximo adverso desde el extremo
        mae: { mean: 3.66, median: 0.0, p75: 6.88, p90: 10.50, p95: 15.21 },
        maePct: { 'lt2': 65.9, 'lt3': 67.0, 'lt4': 68.2, 'lt5': 71.6, 'lt6': 72.7 },
        // MFE: máximo favorable desde el extremo
        mfe: { mean: 25.15, median: 22.75, p25: 16.19, p50: 22.75, p75: 31.50, p90: 41.40 },
        // Post-touch (datos 15m)
        postTouch: {
            pctSube4: 98.9, pctSube5: 98.9, pctSube8: 96.6,
            pctBaja3: 33.0, pctBaja4: 30.7, pctBaja5: 28.4,
            medianUp: 20.50, medianDown: 0.0
        }
    },
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
    const { f1, f2, f3, f4, f5, f6, f7 } = RANGE_FRACTIONS;
    const midpoint = prevTrueLow + rangeTotal * f4;  // = (H + L) / 2

    return {
        // ── SELL ZONE (arriba del midpoint) ────────────────────────
        H:       prevTrueHigh,                        // 100% — extremo SHORT
        H_r8:    prevTrueHigh - rangeTotal * f1,      // 87.5%
        H_r4:    prevTrueHigh - rangeTotal * f2,      // 75.0%
        H_3r8:   prevTrueHigh - rangeTotal * f3,      // 62.5%
        // ── MIDPOINT (línea divisoria) ──────────────────────────────
        midpoint,                                     // 50.0%
        // ── BUY ZONE (abajo del midpoint) ──────────────────────────
        L_3r8:   prevTrueLow  + rangeTotal * f3,      // 37.5% ← target gap pequeño
        L_r4:    prevTrueLow  + rangeTotal * f2,      // 25.0% ← target gap mediano/grande
        L_r8:    prevTrueLow  + rangeTotal * f1,      // 12.5%
        L:       prevTrueLow,                         // 0%   — extremo LONG
        // ── Extensiones (más allá del rango) ───────────────────────
        H_ext:   prevTrueHigh + rangeTotal * f2,      // +25%
        L_ext:   prevTrueLow  - rangeTotal * f2,      // -25%
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
        // Estimación basada en percentiles del rango anterior (metodología de la libreta).
        //
        // Regla: el precio busca el 25% o el 37.5% del rango en la dirección del gap,
        //        medido desde el extremo opuesto, ANTES de reversar.
        //
        // Gap DOWN (LONG) → extremo se forma en la BUY ZONE:
        //   - Gap pequeño (<0.30%): ~37.5% del rango desde el Low (precio bajó poco)
        //   - Gap mediano/grande  : ~25.0% del rango desde el Low (ya bajó bastante)
        //
        // Gap UP (SHORT) → extremo se forma en la SELL ZONE:
        //   - Gap pequeño (<0.30%): ~62.5% del rango desde el Low (precio subió poco)
        //   - Gap mediano/grande  : ~75.0% del rango desde el Low (ya subió bastante)
        let extremePct;
        if (isGapUp) {
            extremePct = gapPct < 0.30 ? RANGE_FRACTIONS.f5 : RANGE_FRACTIONS.f6; // 62.5% o 75%
        } else {
            extremePct = gapPct < 0.30 ? RANGE_FRACTIONS.f3 : RANGE_FRACTIONS.f2; // 37.5% o 25%
        }
        baseExtreme = prevTrueLow + prevRangeTotal * extremePct;
    }

    // --------------------------------------------------------
    // 5. ENTRY, SL, TPs DINÁMICOS
    // ─────────────────────────────────────────────────────
    // Los TPs se ajustan según el tamaño del rango previo.
    // Lógica: en rangos pequeños (alta WR) podemos pedir más del rango;
    // en rangos grandes (baja WR) conviene asegurar ganancias antes.
    //
    // Fuente: rangeAnalysis + extremeMovement data (MFE mediana).
    // Con range~30pts y Filtro A: MFE mediana=22.75pts ≈ 75% del rango → TP2 en 75% es preciso.
    // Con range>60pts y WR=21.9%: TP2 en 75% raramente se alcanza → moverlo a 60%.
    // ─────────────────────────────────────────────────────
    let tp1Pct, tp2Pct, tp3Pct;
    if (prevRangeTotal < 25) {
        // Rango pequeño: WR=50.1%. Alta probabilidad pero rango limitado.
        // Targets moderados para no perder la operación por ser muy ambicioso.
        tp1Pct = 0.50; tp2Pct = 0.70; tp3Pct = 0.85;
    } else if (prevRangeTotal < 40) {
        // Rango óptimo: WR=43.8% + filtros → 61-72%. Targets estándar.
        // La MFE mediana de Filtro A (22.75pts con range~30pts) ≈ 75% → TP2 óptimo.
        tp1Pct = params.tp1Pct; tp2Pct = params.tp2Pct; tp3Pct = params.tp3Pct; // 50/75/90
    } else if (prevRangeTotal < 60) {
        // Rango mediano: WR=32.2%. Asegurar ganancias más temprano.
        tp1Pct = 0.40; tp2Pct = 0.62; tp3Pct = 0.80;
    } else {
        // Rango grande: WR<22%. Muy difícil alcanzar el rango completo.
        // Salir rápido y reducir pérdidas.
        tp1Pct = 0.35; tp2Pct = 0.55; tp3Pct = 0.75;
    }

    const entryPts = entryMode.entry;
    const slPts    = entryMode.sl;
    let entry, sl, tp1, tp2, tp3;

    if (direction === 'SHORT') {
        entry = baseExtreme - entryPts;
        sl    = baseExtreme + slPts;
        tp1   = baseExtreme - (prevRangeTotal * tp1Pct);
        tp2   = baseExtreme - (prevRangeTotal * tp2Pct);
        tp3   = baseExtreme - (prevRangeTotal * tp3Pct);
    } else {
        entry = baseExtreme + entryPts;
        sl    = baseExtreme - slPts;
        tp1   = baseExtreme + (prevRangeTotal * tp1Pct);
        tp2   = baseExtreme + (prevRangeTotal * tp2Pct);
        tp3   = baseExtreme + (prevRangeTotal * tp3Pct);
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

    // WR combinado: dirección + tamaño de rango (insight clave del backtest de 10 años)
    // SHORT tiene WR base de 31.7%; LONG varía fuertemente según tamaño del rango previo
    let expectedWR_combined;
    if (direction === 'SHORT') {
        if (prevRangeTotal >= 100) expectedWR_combined = 15.0;       // Rango extremo → evitar
        else if (prevRangeTotal >= 60) expectedWR_combined = 20.0;   // Rango alto → muy difícil
        else if (prevRangeTotal >= 40) expectedWR_combined = 27.0;   // Rango medio → bajo
        else expectedWR_combined = 31.7;                              // Rango normal SHORT base
    } else {
        // LONG: el tamaño del rango es el predictor más fuerte
        if (prevRangeTotal < 25)       expectedWR_combined = 50.1;
        else if (prevRangeTotal < 40)  expectedWR_combined = 43.8;
        else if (prevRangeTotal < 60)  expectedWR_combined = 32.2;
        else if (prevRangeTotal < 100) expectedWR_combined = 21.9;
        else                           expectedWR_combined = 16.7;
    }
    // Penalizar gaps grandes (>1%): -8pp en cualquier dirección
    if (gapPct >= params.bigGapWarn) {
        expectedWR_combined = Math.max(10, expectedWR_combined - 8);
    }

    // --------------------------------------------------------
    // 8. SETUP SCORE (0–100) y EXPECTED VALUE (EV)
    // ─────────────────────────────────────────────────────
    // Setup Score: combina todos los factores en una puntuación única.
    const setupScore = computeSetupScore({
        direction, prevRangeTotal, gapPct, volRegime, closePosD1, dow, hasExtremeReal
    });
    const setupScoreInfo = setupScoreLabel(setupScore);

    // Expected Value (EV) en puntos:
    // EV = WR × rewardPoints - (1-WR) × riskPoints
    // Si EV > 0 → expectativa positiva (vale la pena operar)
    // Si EV < 0 → expectativa negativa (no operar aunque el setup parezca válido)
    const wrDecimal = expectedWR_combined / 100;
    const expectedValue = (wrDecimal * rewardPoints) - ((1 - wrDecimal) * riskPoints);

    // ── ZONA DEL OPEN (BUY o SELL) ───────────────────────────────────────
    // Determina en qué zona del rango anterior abrió el precio hoy.
    const openZone    = todayOpen <= rangeLevels.midpoint ? 'BUY' : 'SELL';
    const openZonePct = prevRangeTotal > 0
        ? ((todayOpen - prevTrueLow) / prevRangeTotal * 100).toFixed(1)
        : null;

    // Rango de incertidumbre de la estimación (solo relevante cuando !hasExtremeReal)
    // Banda: entre el nivel 25% y el 37.5% (BUY zone) o 62.5% y 75% (SELL zone)
    const estimationBand = hasExtremeReal ? null : {
        level25:  isGapUp ? (prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f6) // 75%
                          : (prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f2), // 25%
        level375: isGapUp ? (prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f5) // 62.5%
                          : (prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f3), // 37.5%
        note: isGapUp
            ? `Extremo estimado en SELL ZONE: ${(prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f5).toFixed(2)} – ${(prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f6).toFixed(2)} (62.5%–75% del rango)`
            : `Extremo estimado en BUY ZONE: ${(prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f2).toFixed(2)} – ${(prevTrueLow + prevRangeTotal * RANGE_FRACTIONS.f3).toFixed(2)} (25%–37.5% del rango)`
    };

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
        estimationBand,
        // Zona del open
        openZone,
        openZonePct,
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
        expectedWR_combined,
        filteredWR,
        // Setup Score y Expected Value
        setupScore,
        setupScoreInfo,
        expectedValue,
        // TPs dinámicos (porcentajes usados)
        tp1Pct, tp2Pct, tp3Pct,
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
 * Calcula un Score de calidad del setup (0–100 puntos).
 *
 * Basado exclusivamente en datos reales del backtest de 10 años (2016–2026).
 * Cada factor aporta puntos proporcionales a su impacto histórico en el WR.
 *
 * Escala:
 *   ≥ 70 → PREMIUM  (WR esperado ~65–83%)
 *   50–69 → BUENO   (WR esperado ~45–65%)
 *   30–49 → NEUTRAL (WR esperado ~32–45%)
 *   < 30  → EVITAR  (WR esperado <32%, incluye SHORT sin filtros)
 *
 * @param {object} params
 * @returns {number} score (0–100)
 */
function computeSetupScore({ direction, prevRangeTotal, gapPct, volRegime, closePosD1, dow, hasExtremeReal }) {
    let score = 25; // base neutral

    // ── DIRECCIÓN (mayor peso individual) ──────────────────────────
    // LONG base: WR=42.1%; SHORT base: WR=31.7%, PF=0.91 (negativo)
    if (direction === 'LONG') score += 15;
    else score -= 15;  // SHORT: -15 puntos por WR estructuralmente inferior

    // ── RANGO PREVIO (predictor más fuerte del WR según backtest) ──
    // Fuente: rangeAnalysis en BACKTEST_STATS
    if      (prevRangeTotal < 25)  score += 25;  // WR=50.1% → bonus máximo
    else if (prevRangeTotal < 40)  score += 15;  // WR=43.8% → bueno
    else if (prevRangeTotal < 60)  score += 0;   // WR=32.2% → neutral, sin cambio
    else if (prevRangeTotal < 100) score -= 18;  // WR=21.9% → zona peligrosa
    else                           score -= 30;  // WR=16.7% → evitar

    // ── TAMAÑO DEL GAP ─────────────────────────────────────────────
    // Fuente: gapAnalysis. Gaps grandes indican eventos atípicos.
    if      (gapPct < 0.3)  score += 5;   // WR≈38%  → ligeramente mejor
    else if (gapPct < 1.0)  score += 0;   // WR≈36-37% → neutral
    else                    score -= 12;  // WR=28.3% → penalización

    // ── RÉGIMEN DE VOLATILIDAD (ATR5/ATR20) ────────────────────────
    // Fuente: filterStats (Filtro A/C). Solo disponible si el usuario ingresa ATR.
    if (volRegime !== null) {
        if      (volRegime < 0.80) score += 20;  // Filtro A: WR=72.9% → +20pts
        else if (volRegime < 1.00) score += 10;  // Filtro C: WR=61.5% → +10pts
        else                       score -= 5;   // Volatilidad elevada → penalización leve
    }

    // ── POSICIÓN DEL CIERRE D-1 ─────────────────────────────────────
    // Fuente: Filtro B. Close en zona baja (bottom 35%) → WR=67.9%
    if (closePosD1 !== null) {
        if (closePosD1 < 0.35) score += 10;  // Filtro B activo → +10pts
    }

    // ── DÍA DE LA SEMANA ────────────────────────────────────────────
    // Fuente: Filtro D. Martes/Miércoles/Jueves son los mejores días.
    if (dow !== null) {
        if ([1, 2, 3].includes(dow)) score += 5;   // Mar-Jue → +5pts
        else                          score -= 3;  // Lun/Vie → leve penalización
    }

    // ── EXTREMO REAL CONFIRMADO ─────────────────────────────────────
    // Sin extremo real, los niveles son estimados (menor precisión)
    if (hasExtremeReal) score += 5;

    return Math.max(0, Math.min(100, score));
}

/**
 * Calcula etiqueta y clase CSS del setup score.
 * @param {number} score - 0 a 100
 * @returns {{ label: string, cssClass: string }}
 */
function setupScoreLabel(score) {
    if (score >= 70) return { label: 'PREMIUM ★★★',  cssClass: 'score-premium' };
    if (score >= 50) return { label: 'BUENO ★★',     cssClass: 'score-good'    };
    if (score >= 30) return { label: 'NEUTRAL ★',    cssClass: 'score-neutral' };
    return              { label: 'EVITAR ✗',         cssClass: 'score-avoid'   };
}

/**
 * Calcula los filtros del setup.
 *
 * Filtros críticos (criticalPass = false → NO operar):
 *   - gapFilter:   gap >= 0.10% mínimo
 *   - rangeFilter: rango previo >= 15 pts mínimo
 *
 * Filtros informativos (warnings basados en 10 años de backtest):
 *   - gapTypeFilter:    LONG (gap DOWN) preferido; SHORT → WR=31.7%, PF=0.91
 *   - extremeFilter:    extremo real confirmado (mejora precisión de niveles)
 *   - rangeHighFilter:  rango >60pts → WR=21.9% (zona de alto riesgo)
 *   - bigGapFilter:     gap >1% → WR=28.3% (peor rendimiento por tamaño de gap)
 */
function computeFilters({ gapPct, prevRangeTotal, isGapUp, hasExtremeReal }) {
    // Filtros críticos: definen si el setup es operable
    const gapFilter   = gapPct >= params.minGapPct;
    const rangeFilter = prevRangeTotal >= params.minPrevRange;
    const criticalPass = gapFilter && rangeFilter;

    // Filtros informativos: mejoran la selección de setups
    const gapTypeFilter   = !isGapUp;                                     // LONG (gap DOWN) preferido
    const extremeFilter   = hasExtremeReal === true;                       // extremo real confirmado
    const rangeHighFilter = prevRangeTotal >= params.rangeHighWarn;        // >60pts: 21.9% WR
    const bigGapFilter    = gapPct >= params.bigGapWarn;                   // >1%: 28.3% WR

    let alertType;
    if (!criticalPass)      alertType = 'danger';
    else if (isGapUp)       alertType = 'warning-gap-up';
    else if (!hasExtremeReal) alertType = 'warning-pending';
    else                    alertType = 'success';

    return {
        gapFilter, rangeFilter, criticalPass,
        gapTypeFilter, extremeFilter,
        rangeHighFilter, bigGapFilter,
        alertType, hasExtremeReal
    };
}

/**
 * Sugiere el modo de entrada óptimo según la dirección del gap.
 * - SHORT (gap UP):  mínimo 'standard' para evitar whipsaws
 * - LONG (gap DOWN): máximo 'standard' para no perder el movimiento
 *
 * @param {boolean} isGapUp - true si el gap es alcista
 * @param {string} entryModeKey - modo actual
 * @returns {string|null} - nuevo modo sugerido, o null si ya es correcto
 */
function suggestEntryMode(isGapUp, entryModeKey) {
    const modeOrder = ['filtro_a', 'aggressive', 'standard', 'conservative'];
    const currentIdx = modeOrder.indexOf(entryModeKey);
    if (currentIdx === -1) return null;

    if (isGapUp) {
        // SHORT: necesita al menos 'standard' (índice 2)
        if (currentIdx < 2) return 'standard';
    } else {
        // LONG: no usar 'conservative' (índice 3)
        if (currentIdx === 3) return 'aggressive';
    }
    return null;
}

/**
 * Retorna la clase CSS según si el filtro pasó o no.
 * @param {boolean} passed
 * @param {string} [forceClass] - clase forzada (ignora passed)
 * @returns {string}
 */
function getFilterStatusClass(passed, forceClass) {
    if (forceClass !== undefined) return forceClass;
    return passed ? 'pass' : 'fail';
}

/**
 * Retorna el icono según el estado del filtro.
 * @param {string} status - 'pass' | 'warn' | 'fail'
 * @returns {string}
 */
function getFilterIcon(status) {
    if (status === 'pass') return '✓';
    if (status === 'warn') return '⚠';
    return '✗';
}

// Export para Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        instruments, entryModes, params, RANGE_FRACTIONS, BACKTEST_STATS,
        calcTrueRange, calcRangeLevels, computeLevels, computeFilters,
        computeAdvancedFilters, computeSetupScore, setupScoreLabel,
        suggestEntryMode, getFilterStatusClass, getFilterIcon,
    };
}
