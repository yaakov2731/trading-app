/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

// Load calculator module into global scope (mimics <script src="calculator.js">)
const calcModule = require('./calculator');
Object.assign(global, calcModule);

// Load the HTML source
const htmlSource = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

// Extract the inline script content (the second <script> block with function definitions)
function extractInlineScript(html) {
    // Match the second script block (the one without src)
    const matches = [...html.matchAll(/<script>([^]*?)<\/script>/g)];
    // Return concatenated inline scripts
    return matches.map(m => m[1]).join('\n');
}

const inlineScript = extractInlineScript(htmlSource);

beforeEach(() => {
    // Reset DOM
    document.documentElement.innerHTML = htmlSource;

    // Execute inline script in global scope
    const fn = new Function(inlineScript);
    fn.call(global);

    // Expose functions that were defined in the inline script to global scope
    // The Function constructor runs in its own scope, so we need to re-extract
    // We'll use a different approach: eval with indirect eval to get global scope
    (0, eval)(inlineScript);
});

// ──────────────────────────────────────────────
// DOM structure tests
// ──────────────────────────────────────────────
describe('DOM structure', () => {
    test('all required input elements exist', () => {
        expect(document.getElementById('prevHigh')).not.toBeNull();
        expect(document.getElementById('prevLow')).not.toBeNull();
        expect(document.getElementById('prevClose')).not.toBeNull();
        expect(document.getElementById('todayOpen')).not.toBeNull();
        expect(document.getElementById('extremeReal')).not.toBeNull();
    });

    test('all select elements exist', () => {
        expect(document.getElementById('entryMode')).not.toBeNull();
        expect(document.getElementById('instrument')).not.toBeNull();
    });

    test('optimize checkbox exists and is enabled by default', () => {
        const cb = document.getElementById('optimizeToExtremes');
        expect(cb).not.toBeNull();
        expect(cb.checked).toBe(true);
    });

    test('instrument select includes GC option', () => {
        const options = [...document.getElementById('instrument').options].map(o => o.value);
        expect(options).toEqual(expect.arrayContaining(['GC']));
    });

    test('results section exists and is initially hidden', () => {
        const results = document.getElementById('resultsSection');
        expect(results).not.toBeNull();
        expect(results.classList.contains('visible')).toBe(false);
    });

    test('all result display elements exist', () => {
        const ids = [
            'entryLevel', 'slLevel', 'tp1Level', 'tp2Level', 'tp3Level',
            'slPoints', 'potentialProfit', 'riskAmount',
            'rrRatio', 'directionBadge', 'gapTag', 'rangeTag', 'wrTag',
            'filterGap', 'filterRange', 'filterGapType', 'filterExtreme',
            'filterAlert', 'checklistCounter'
        ];
        ids.forEach(id => {
            expect(document.getElementById(id)).not.toBeNull();
        });
    });

    test('checklist items exist (4 items)', () => {
        const items = document.querySelectorAll('.checklist-item');
        expect(items.length).toBe(4);
    });

    test('checklist checkboxes exist (4 checkboxes)', () => {
        const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        expect(checkboxes.length).toBe(4);
    });
});

// ──────────────────────────────────────────────
// calculateLevels UI integration
// ──────────────────────────────────────────────
describe('calculateLevels – UI integration', () => {
    function fillInputs({ prevHigh = '6100', prevLow = '6050', prevClose = '6080', todayOpen = '6065', extremeReal = '6045' } = {}) {
        document.getElementById('prevHigh').value = prevHigh;
        document.getElementById('prevLow').value = prevLow;
        document.getElementById('prevClose').value = prevClose;
        document.getElementById('todayOpen').value = todayOpen;
        document.getElementById('extremeReal').value = extremeReal;
    }

    test('shows results section after calculation', () => {
        fillInputs();
        calculateLevels();
        expect(document.getElementById('resultsSection').classList.contains('visible')).toBe(true);
    });

    test('displays correct direction badge for LONG', () => {
        fillInputs({ todayOpen: '6065' }); // gap down => LONG
        calculateLevels();
        const badge = document.getElementById('directionBadge');
        expect(badge.classList.contains('long')).toBe(true);
        expect(badge.textContent).toContain('LONG');
    });

    test('displays correct direction badge for SHORT', () => {
        fillInputs({ todayOpen: '6095', extremeReal: '6115' }); // gap up => SHORT
        calculateLevels();
        const badge = document.getElementById('directionBadge');
        expect(badge.classList.contains('short')).toBe(true);
        expect(badge.textContent).toContain('SHORT');
    });

    test('displays entry level value', () => {
        fillInputs();
        calculateLevels();
        const entry = document.getElementById('entryLevel').textContent;
        expect(entry).not.toBe('--');
        expect(parseFloat(entry)).not.toBeNaN();
    });

    test('displays all level values as numbers', () => {
        fillInputs();
        calculateLevels();
        ['entryLevel', 'slLevel', 'tp1Level', 'tp2Level', 'tp3Level'].forEach(id => {
            const val = document.getElementById(id).textContent;
            expect(parseFloat(val)).not.toBeNaN();
        });
    });

    test('displays range in rangeTag', () => {
        fillInputs();
        calculateLevels();
        const range = document.getElementById('rangeTag').textContent;
        expect(range).toContain('pts');
    });

    test('displays summary values', () => {
        fillInputs();
        calculateLevels();
        expect(document.getElementById('potentialProfit').textContent).toContain('$');
        expect(document.getElementById('riskAmount').textContent).toContain('$');
        expect(document.getElementById('rrRatio').textContent).toContain('1:');
    });

    test('displays filter statuses', () => {
        fillInputs();
        calculateLevels();
        ['filterGap', 'filterRange', 'filterGapType', 'filterExtreme'].forEach(id => {
            const el = document.getElementById(id);
            expect(el.textContent).not.toBe('--');
            expect(el.classList.contains('pass') || el.classList.contains('fail') || el.classList.contains('warn')).toBe(true);
        });
    });

    test('displays filter alert message', () => {
        fillInputs();
        calculateLevels();
        const alert = document.getElementById('filterAlert');
        expect(alert.innerHTML).not.toBe('');
        expect(alert.querySelector('.alert')).not.toBeNull();
    });

    test('alert shows danger when gap is too small', () => {
        fillInputs({ todayOpen: '6081' }); // tiny gap
        calculateLevels();
        const alert = document.getElementById('filterAlert');
        expect(alert.querySelector('.alert-danger')).not.toBeNull();
    });

    test('alert shows success for valid gap-down setup', () => {
        fillInputs({ todayOpen: '6065', extremeReal: '6045' });
        calculateLevels();
        const alert = document.getElementById('filterAlert');
        expect(alert.querySelector('.alert-success')).not.toBeNull();
    });

    test('alert shows warning for gap-up setup', () => {
        fillInputs({ todayOpen: '6095', extremeReal: '6115' });
        calculateLevels();
        const alert = document.getElementById('filterAlert');
        expect(alert.querySelector('.alert-warning')).not.toBeNull();
    });

    test('shows waiting alert when no extreme provided', () => {
        fillInputs({ extremeReal: '' }); // gap down, no extreme
        calculateLevels();
        const alert = document.getElementById('filterAlert');
        const alertEl = alert.querySelector('.alert');
        expect(alertEl).not.toBeNull();
    });

    test('alerts user when required fields are missing', () => {
        window.alert = jest.fn();
        fillInputs({ prevHigh: '' });
        calculateLevels();
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Completar'));
    });

    test('alerts user when High D-1 is lower than Low D-1', () => {
        window.alert = jest.fn();
        fillInputs({ prevHigh: '6040', prevLow: '6050' });
        calculateLevels();
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('High D-1'));
    });

    test('gap meta tag shows gap value', () => {
        fillInputs();
        calculateLevels();
        const gapTag = document.getElementById('gapTag');
        expect(gapTag.textContent).toContain('Gap:');
    });

    test('range meta tag shows range value', () => {
        fillInputs();
        calculateLevels();
        const rangeTag = document.getElementById('rangeTag');
        expect(rangeTag.textContent).toContain('Rango:');
    });

    test('entry label updates with mode info', () => {
        fillInputs();
        document.getElementById('entryMode').value = 'aggressive';
        calculateLevels();
        const label = document.querySelector('.level-card.entry .level-label');
        expect(label.textContent).toContain('5 pts');
    });

    test('SL label updates with SL points', () => {
        fillInputs();
        calculateLevels();
        const label = document.querySelector('.level-card.sl .level-label');
        expect(label.textContent).toContain('pts');
    });

    test('changing instrument affects dollar amounts', () => {
        fillInputs();
        document.getElementById('instrument').value = 'ES';
        calculateLevels();
        const esProfit = document.getElementById('potentialProfit').textContent;

        document.getElementById('instrument').value = 'MES';
        calculateLevels();
        const mesProfit = document.getElementById('potentialProfit').textContent;

        // ES multiplier (50) is 10x MES (5), allow $5 rounding tolerance (toFixed(0) rounding)
        const esVal = parseFloat(esProfit.replace('$', ''));
        const mesVal = parseFloat(mesProfit.replace('$', ''));
        expect(Math.abs(esVal - mesVal * 10)).toBeLessThanOrEqual(5);
    });
});

// ──────────────────────────────────────────────
// showTab behavior
// ──────────────────────────────────────────────
describe('showTab', () => {
    test('works without event object (programmatic call)', () => {
        showTab('backtest');
        expect(document.getElementById('tab-backtest').classList.contains('active')).toBe(true);
        const backtestBtn = document.querySelector('.tab-btn[data-tab="backtest"]');
        expect(backtestBtn.classList.contains('active')).toBe(true);
    });
});

// ──────────────────────────────────────────────
// updateFilter function
// ──────────────────────────────────────────────
describe('updateFilter – DOM updates', () => {
    test('sets pass class and checkmark', () => {
        updateFilter('filterGap', true, '0.25%');
        const el = document.getElementById('filterGap');
        expect(el.classList.contains('pass')).toBe(true);
        expect(el.textContent).toContain('✓');
        expect(el.textContent).toContain('0.25%');
    });

    test('sets fail class and X mark', () => {
        updateFilter('filterGap', false, '0.10%');
        const el = document.getElementById('filterGap');
        expect(el.classList.contains('fail')).toBe(true);
        expect(el.textContent).toContain('✗');
    });

    test('respects forceClass override', () => {
        updateFilter('filterGapType', false, 'UP (64% fill)', 'warn');
        const el = document.getElementById('filterGapType');
        expect(el.classList.contains('warn')).toBe(true);
        expect(el.textContent).toContain('⚠');
    });
});

// ──────────────────────────────────────────────
// toggleCheck and updateChecklistCounter
// ──────────────────────────────────────────────
describe('toggleCheck', () => {
    test('toggles checkbox on first click', () => {
        const item = document.querySelector('.checklist-item');
        const cb = item.querySelector('input[type="checkbox"]');
        expect(cb.checked).toBe(false);

        toggleCheck(item);
        expect(cb.checked).toBe(true);
        expect(item.classList.contains('checked')).toBe(true);
    });

    test('toggles checkbox off on second click', () => {
        const item = document.querySelector('.checklist-item');
        toggleCheck(item);
        toggleCheck(item);
        const cb = item.querySelector('input[type="checkbox"]');
        expect(cb.checked).toBe(false);
        expect(item.classList.contains('checked')).toBe(false);
    });

    test('updates counter after toggle', () => {
        const items = document.querySelectorAll('.checklist-item');
        toggleCheck(items[0]);
        const counter = document.getElementById('checklistCounter');
        expect(counter.textContent).toBe('1/4');
    });
});

describe('updateChecklistCounter', () => {
    test('starts at 0/4', () => {
        updateChecklistCounter();
        expect(document.getElementById('checklistCounter').textContent).toBe('0/4');
    });

    test('shows correct count as items are checked', () => {
        const items = document.querySelectorAll('.checklist-item');
        toggleCheck(items[0]);
        toggleCheck(items[1]);
        expect(document.getElementById('checklistCounter').textContent).toBe('2/4');
    });

    test('adds "ready" class at 3/4', () => {
        const items = document.querySelectorAll('.checklist-item');
        toggleCheck(items[0]);
        toggleCheck(items[1]);
        toggleCheck(items[2]);
        const counter = document.getElementById('checklistCounter');
        expect(counter.textContent).toBe('3/4');
        expect(counter.classList.contains('ready')).toBe(true);
    });

    test('adds "ready" class at 4/4', () => {
        const items = document.querySelectorAll('.checklist-item');
        items.forEach(item => toggleCheck(item));
        const counter = document.getElementById('checklistCounter');
        expect(counter.textContent).toBe('4/4');
        expect(counter.classList.contains('ready')).toBe(true);
    });

    test('removes "ready" class when dropping below 3', () => {
        const items = document.querySelectorAll('.checklist-item');
        toggleCheck(items[0]);
        toggleCheck(items[1]);
        toggleCheck(items[2]);
        expect(document.getElementById('checklistCounter').classList.contains('ready')).toBe(true);

        toggleCheck(items[0]); // uncheck
        expect(document.getElementById('checklistCounter').textContent).toBe('2/4');
        expect(document.getElementById('checklistCounter').classList.contains('ready')).toBe(false);
    });
});

// ──────────────────────────────────────────────
// copyLevel function
// ──────────────────────────────────────────────
describe('copyLevel', () => {
    test('copies value to clipboard on success', async () => {
        document.getElementById('entryLevel').textContent = '6051.50';
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });

        const btn = document.createElement('button');
        btn.textContent = 'Copy';
        const event = { target: btn };

        copyLevel(event, 'entryLevel');
        expect(writeText).toHaveBeenCalledWith('6051.50');

        // Wait for promise resolution
        await new Promise(r => setTimeout(r, 0));
        expect(btn.textContent).toBe('✓');
    });

    test('shows error indicator on clipboard failure', async () => {
        document.getElementById('entryLevel').textContent = '6051.50';
        const writeText = jest.fn().mockRejectedValue(new Error('denied'));
        Object.assign(navigator, { clipboard: { writeText } });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const btn = document.createElement('button');
        btn.textContent = 'Copy';
        const event = { target: btn };

        copyLevel(event, 'entryLevel');

        await new Promise(r => setTimeout(r, 0));
        expect(btn.textContent).toBe('✗');
        consoleSpy.mockRestore();
    });
});

// ──────────────────────────────────────────────
// Auto-suggest entry mode
// ──────────────────────────────────────────────
describe('calculateLevels – auto-suggest entry mode', () => {
    function fillInputs(overrides = {}) {
        const defaults = { prevHigh: '6100', prevLow: '6050', prevClose: '6080', todayOpen: '6065', extremeReal: '6045' };
        const vals = { ...defaults, ...overrides };
        Object.entries(vals).forEach(([k, v]) => {
            document.getElementById(k).value = v;
        });
    }

    test('suggests standard when gap up + aggressive selected', () => {
        fillInputs({ todayOpen: '6095', extremeReal: '6115' });
        document.getElementById('entryMode').value = 'aggressive';
        calculateLevels();
        expect(document.getElementById('entryMode').value).toBe('standard');
    });

    test('suggests aggressive when gap down + conservative selected', () => {
        fillInputs({ todayOpen: '6065', extremeReal: '6045' });
        document.getElementById('entryMode').value = 'conservative';
        calculateLevels();
        expect(document.getElementById('entryMode').value).toBe('aggressive');
    });

    test('does not change standard mode on gap up', () => {
        fillInputs({ todayOpen: '6095', extremeReal: '6115' });
        document.getElementById('entryMode').value = 'standard';
        calculateLevels();
        expect(document.getElementById('entryMode').value).toBe('standard');
    });
});

// ──────────────────────────────────────────────
// Select default values
// ──────────────────────────────────────────────
describe('Default select values', () => {
    test('entry mode defaults to filtro_a (WR=83% con condiciones óptimas)', () => {
        expect(document.getElementById('entryMode').value).toBe('filtro_a');
    });

    test('instrument defaults to ES', () => {
        expect(document.getElementById('instrument').value).toBe('ES');
    });
});
