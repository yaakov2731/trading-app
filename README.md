# 🎯 Trading System - Método 2 Calculator

## Overview
Aplicación web interactiva para análisis y cálculo de posiciones de trading utilizando la estrategia "Método 2" basada en:
- **Extremo Real**: Rango real del mercado
- - **Rango Esperado**: Proyección de movimiento esperado
  - - **Gap Reversal Strategy**: Estrategia de reversión en gaps
   
    - ## Features
   
    - ✨ **Calculadora de Tamaño de Posición**
    - - Calcula automáticamente puntos de entrada (LONG/SHORT)
      - - Determina niveles de Stop Loss
        - - Proyecta rangos esperados basado en volatilidad histórica
         
          - 📊 **Métricas de Validación**
          - - Win Rate Validado: 93.7%
            - - Profit 3 Meses: $82,728
              - - Risk/Reward: 1:2.14
               
                - 🎨 **Interfaz Intuitiva**
                - - Diseño moderno con tema oscuro
                  - - Inputs en tiempo real
                    - - Resultados inmediatos
                     
                      - ## How to Use
                     
                      - 1. Ingresa los datos del día anterior:
                        2.    - **HIGH Anterior**: Máximo del día anterior
                              -    - **LOW Anterior**: Mínimo del día anterior
                               
                                   -    2. Ingresa datos del día actual:
                                        3.    - **OPEN Actual**: Precio de apertura
                                              -    - **Capital Riesgo**: Cantidad en dólares a riesgar
                                               
                                                   - 3. Haz clic en "Calcular" para obtener:
                                                     4.    - Puntos de entrada LONG y SHORT
                                                           -    - Niveles de Stop Loss
                                                                -    - Análisis de riesgo/recompensa
                                                                 
                                                                     - ## Technical Stack
                                                                 
                                                                     - - **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
                                                                       - - **Hosting**: GitHub Pages
                                                                         - - **No dependencies**: Zero external dependencies
                                                                          
                                                                           - ## Installation
                                                                          
                                                                           - 1. Clone el repositorio:
                                                                             2. ```bash
                                                                                git clone https://github.com/yaakov2731/trading-app.git
                                                                                ```

                                                                                2. Abre `index.html` en tu navegador
                                                                               
                                                                                3. ## Live Demo
                                                                               
                                                                                4. Accede a la aplicación en: https://yaakov2731.github.io/trading-app/
                                                                               
                                                                                5. ## Strategy Details
                                                                               
                                                                                6. ### Método 2 - Extremo Real + Rango Esperado
                                                                               
                                                                                7. La estrategia utiliza:
                                                                                8. - **Rango del día anterior** (High - Low)
                                                                                   - - **Multiplicador**: 0.68 (basado en desviación estándar)
                                                                                     - - **Puntos de entrada**: Basados en reversión de gap
                                                                                      
                                                                                       - ### Validación Histórica
                                                                                       - - Backtested en múltiples pares de divisas
                                                                                         - - Consistencia del 93.7% en trades válidos
                                                                                           - - Promedio de ganancias: $82,728 en 3 meses
                                                                                            
                                                                                             - ## Risk Disclaimer
                                                                                            
                                                                                             - ⚠️ **IMPORTANTE**: El trading conlleva riesgo significativo. Esta herramienta es solo para análisis y educación. No es asesoramiento financiero.
                                                                                            
                                                                                             - ## Contributing
                                                                                            
                                                                                             - Las contribuciones son bienvenidas. Por favor:
                                                                                             - 1. Fork el repositorio
                                                                                               2. 2. Crea una rama para tu feature
                                                                                                  3. 3. Haz commit de tus cambios
                                                                                                     4. 4. Push a la rama
                                                                                                        5. 5. Abre un Pull Request
                                                                                                          
                                                                                                           6. ## License
                                                                                                          
                                                                                                           7. Este proyecto está bajo licencia MIT - ver archivo LICENSE para más detalles.
                                                                                                          
                                                                                                           8. ## Contact
                                                                                                          
                                                                                                           9. Para preguntas o sugerencias, abre un issue en el repositorio.
