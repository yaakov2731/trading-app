# Trading System - Metodo 2 Calculator

## Overview

Aplicacion web para calcular niveles operativos del metodo de gap reversal y mostrar el contexto estadistico del backtest sin inflar el win rate.

## Current validated baseline

- Sistema base total: 1,545 trades
- Win rate real: 36.1%
- Profit factor: 1.11
- Longs (gap down): 42.1%
- Shorts (gap up): 31.7%

## Filtered subsets

Algunos filtros mejoran el resultado historico, pero sobre muestras bastante menores:

- Filtro C: 61.5% WR, n=187
- Filtro A: 72.9% WR, n=85
- Filtro D: 62.3% WR, n=114

Esos numeros deben leerse como subsets historicos, no como win rate general del sistema.

## Local usage

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar tests:

```bash
npm test
```

3. Abrir `index.html` en el navegador.

## Live demo

Acceso actual: https://yaakov2731.github.io/trading-app/

## Tech stack

- HTML
- CSS
- JavaScript vanilla
- GitHub Pages

## Risk disclaimer

El trading conlleva riesgo significativo. Esta herramienta es solo para analisis y educacion. No es asesoramiento financiero.
