/**
 * Generador de Plantilla Excel - Orden de Compra
 * Artículos de Limpieza, Papelería y Descartables
 * Shopping Center - Tigre, Argentina
 */

const XLSX = require('xlsx');

// ─── CATÁLOGO DE PRODUCTOS ───────────────────────────────────────────────────

const CATALOGO = [
  // ── LIMPIADORES Y DESINFECTANTES ──
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-001', descripcion: 'Lavandina concentrada 10%', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 2800, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-002', descripcion: 'Lavandina lista para usar', presentacion: 'Botella 2 L', unidad: 'Botella', precio_ref: 950, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-003', descripcion: 'Desinfectante multiusos fragancia pino', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 3200, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-004', descripcion: 'Desengrasante industrial', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 3800, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-005', descripcion: 'Limpiador multiusos neutro (pisos duros)', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 2900, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-006', descripcion: 'Limpiavidrios con alcohol', presentacion: 'Botella gatillo 500 mL', unidad: 'Botella', precio_ref: 780, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-007', descripcion: 'Detergente concentrado lavavajillas', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 3100, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-008', descripcion: 'Alcohol en gel 70° (dispensador recarga)', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 4200, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-009', descripcion: 'Jabón líquido de manos (recarga)', presentacion: 'Bidón 5 L', unidad: 'Bidón', precio_ref: 3500, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-010', descripcion: 'Quita sarro baño (ácido)', presentacion: 'Botella 750 mL', unidad: 'Botella', precio_ref: 1100, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-011', descripcion: 'Desodorante de ambientes aerosol', presentacion: 'Aerosol 400 mL', unidad: 'Unidad', precio_ref: 1400, proveedor_ref: 'Droguería / Químicos' },
  { categoria: 'Limpiadores y Desinfectantes', codigo: 'LD-012', descripcion: 'Pastillas urinal / WC (canasto)', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 450, proveedor_ref: 'Droguería / Químicos' },

  // ── PAPEL HIGIÉNICO Y TOALLAS ──
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-001', descripcion: 'Papel higiénico industrial (JRT) 300 m', presentacion: 'Rollo 300 m', unidad: 'Rollo', precio_ref: 1800, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-002', descripcion: 'Papel higiénico hoja doble x 30 rollos', presentacion: 'Pack x 30', unidad: 'Pack', precio_ref: 8500, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-003', descripcion: 'Toallas de papel interfoliadas (dispenser)', presentacion: 'Paquete x 150 hojas', unidad: 'Paquete', precio_ref: 950, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-004', descripcion: 'Toallas de papel en rollo (bobina) 100 m', presentacion: 'Rollo 100 m', unidad: 'Rollo', precio_ref: 2200, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-005', descripcion: 'Servilletas 30x30 cm x 500 u', presentacion: 'Pack x 500', unidad: 'Pack', precio_ref: 3200, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-006', descripcion: 'Servilletas cocktail 20x20 cm x 500 u', presentacion: 'Pack x 500', unidad: 'Pack', precio_ref: 1800, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-007', descripcion: 'Rollo de cocina (gastronomía) 250 hojas', presentacion: 'Rollo', unidad: 'Rollo', precio_ref: 600, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-008', descripcion: 'Papel film 45 cm x 300 m (rollo industria)', presentacion: 'Rollo', unidad: 'Rollo', precio_ref: 4500, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-009', descripcion: 'Papel aluminio 45 cm x 100 m', presentacion: 'Rollo', unidad: 'Rollo', precio_ref: 3800, proveedor_ref: 'Distribuidora Papel' },
  { categoria: 'Papel Higiénico y Toallas', codigo: 'PH-010', descripcion: 'Papel manteca / sulfito 30x40 cm x 1 kg', presentacion: 'Kg', unidad: 'Kg', precio_ref: 2100, proveedor_ref: 'Distribuidora Papel' },

  // ── DESCARTABLES GASTRONOMÍA ──
  { categoria: 'Descartables Gastronomía', codigo: 'DG-001', descripcion: 'Vaso térmico PS 8 oz (café)', presentacion: 'Pack x 50', unidad: 'Pack', precio_ref: 1400, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-002', descripcion: 'Vaso térmico PS 12 oz (bebidas calientes)', presentacion: 'Pack x 50', unidad: 'Pack', precio_ref: 1700, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-003', descripcion: 'Vaso plástico transparente 200 mL x 100 u', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 1200, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-004', descripcion: 'Vaso plástico transparente 300 mL x 100 u', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 1500, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-005', descripcion: 'Tapa para vaso térmico 8/12 oz x 50 u', presentacion: 'Pack x 50', unidad: 'Pack', precio_ref: 900, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-006', descripcion: 'Plato plástico llano 23 cm x 25 u', presentacion: 'Pack x 25', unidad: 'Pack', precio_ref: 2200, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-007', descripcion: 'Plato plástico hondo 23 cm x 25 u', presentacion: 'Pack x 25', unidad: 'Pack', precio_ref: 2400, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-008', descripcion: 'Cubierto set tenedor+cuchillo+cuchara PS x 100', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 3200, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-009', descripcion: 'Sorbete flexible individual x 500 u', presentacion: 'Pack x 500', unidad: 'Pack', precio_ref: 1600, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-010', descripcion: 'Sorbete papel biodegradable x 100 u', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 1100, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-011', descripcion: 'Contenedor espumado (telgopor) 23x15 cm', presentacion: 'Pack x 50', unidad: 'Pack', precio_ref: 2800, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-012', descripcion: 'Bandeja aluminio Nº 3 (porciones)', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 4500, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-013', descripcion: 'Caja de cartón hamburgesa 12x12 cm', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 5500, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-014', descripcion: 'Bolsa papel madera kraft 25x35 cm', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 3800, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-015', descripcion: 'Guantes descartables de latex S/M/G x 100', presentacion: 'Caja x 100', unidad: 'Caja', precio_ref: 4200, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-016', descripcion: 'Guantes descartables nitrilo x 100', presentacion: 'Caja x 100', unidad: 'Caja', precio_ref: 5800, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-017', descripcion: 'Gorra descartable (cofia) x 100 u', presentacion: 'Pack x 100', unidad: 'Pack', precio_ref: 1200, proveedor_ref: 'Descartables AR' },
  { categoria: 'Descartables Gastronomía', codigo: 'DG-018', descripcion: 'Barbijo descartable 3 capas x 50 u', presentacion: 'Caja x 50', unidad: 'Caja', precio_ref: 3500, proveedor_ref: 'Descartables AR' },

  // ── BOLSAS DE RESIDUOS ──
  { categoria: 'Bolsas de Residuos', codigo: 'BR-001', descripcion: 'Bolsa negra residuos 40 L (60x90 cm) x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 650, proveedor_ref: 'Distribuidora Bolsas' },
  { categoria: 'Bolsas de Residuos', codigo: 'BR-002', descripcion: 'Bolsa negra residuos 80 L (80x110 cm) x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 1100, proveedor_ref: 'Distribuidora Bolsas' },
  { categoria: 'Bolsas de Residuos', codigo: 'BR-003', descripcion: 'Bolsa negra residuos 120 L (90x130 cm) x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 1600, proveedor_ref: 'Distribuidora Bolsas' },
  { categoria: 'Bolsas de Residuos', codigo: 'BR-004', descripcion: 'Bolsa transparente reciclaje 50 L x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 700, proveedor_ref: 'Distribuidora Bolsas' },
  { categoria: 'Bolsas de Residuos', codigo: 'BR-005', descripcion: 'Bolsa verde orgánicos 40 L x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 700, proveedor_ref: 'Distribuidora Bolsas' },

  // ── ACCESORIOS DE LIMPIEZA ──
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-001', descripcion: 'Trapo de piso de algodón (piso) 70x80 cm', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 1200, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-002', descripcion: 'Repasador de cocina (gamuza) 50x70 cm', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 850, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-003', descripcion: 'Esponja doble faz (verde) x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 2200, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-004', descripcion: 'Guantes de goma largos (S/M/G)', presentacion: 'Par', unidad: 'Par', precio_ref: 980, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-005', descripcion: 'Cepillo de baño con soporte', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 1500, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-006', descripcion: 'Mechita / mopa de piso (repuesto)', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 2800, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-007', descripcion: 'Secador de piso (goma) 40 cm', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 2200, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-008', descripcion: 'Escoba plástica c/ palito', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 1800, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-009', descripcion: 'Balde plástico 12 L c/ escurridor', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 3200, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-010', descripcion: 'Fibra verde abrasiva (verde) x 10 u', presentacion: 'Pack x 10', unidad: 'Pack', precio_ref: 1900, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-011', descripcion: 'Pulverizador / Pistola gatillo 1 L', presentacion: 'Unidad', unidad: 'Unidad', precio_ref: 750, proveedor_ref: 'Bazar / Ferretería' },
  { categoria: 'Accesorios de Limpieza', codigo: 'AC-012', descripcion: 'Paño de microfibra 40x40 cm x 5 u', presentacion: 'Pack x 5', unidad: 'Pack', precio_ref: 2500, proveedor_ref: 'Bazar / Ferretería' },
];

// ─── CONSTRUCCIÓN DEL WORKBOOK ────────────────────────────────────────────────

const wb = XLSX.utils.book_new();

// ── HOJA 1: ORDEN DE COMPRA ───────────────────────────────────────────────────

function crearHojaOrdenCompra() {
  const ws_data = [];

  // Cabecera principal
  ws_data.push(['ORDEN DE COMPRA - ARTÍCULOS DE LIMPIEZA, PAPELERÍA Y DESCARTABLES', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['DATOS DEL SHOPPING', '', '', 'DATOS DEL PEDIDO', '', '', '', 'DATOS DEL PROVEEDOR', '', '']);
  ws_data.push(['Razón Social:', 'Shopping Tigre S.A.', '', 'N° Orden:', 'OC-2026-', '', '', 'Proveedor:', '', '']);
  ws_data.push(['CUIT:', '30-XXXXXXXX-X', '', 'Fecha emisión:', '', '', '', 'CUIT Proveedor:', '', '']);
  ws_data.push(['Dirección:', 'Av. Julio Roca 1XXX, Tigre', '', 'Fecha entrega requerida:', '', '', '', 'Contacto:', '', '']);
  ws_data.push(['Localidad:', 'Tigre, Pcia. Bs. As.', '', 'Área solicitante:', '', '', '', 'Teléfono:', '', '']);
  ws_data.push(['Tel/Contacto:', '', '', 'Solicitado por:', '', '', '', 'Email:', '', '']);
  ws_data.push(['', '', '', 'Aprobado por:', '', '', '', 'Condición pago:', '', '']);
  ws_data.push(['', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['', '', '', '', '', '', '', '', '', '']);

  // Encabezado de tabla
  ws_data.push([
    'N°', 'Código', 'Categoría', 'Descripción del Artículo', 'Presentación',
    'Unidad', 'Cantidad Solicitada', 'Precio Unit. Ref. (ARS)', 'Subtotal (ARS)', 'Observaciones'
  ]);

  // Filas de productos agrupadas por categoría
  let rowNum = 1;
  let currentCat = '';
  CATALOGO.forEach(item => {
    if (item.categoria !== currentCat) {
      // Fila de categoría
      ws_data.push([`── ${item.categoria.toUpperCase()} ──`, '', '', '', '', '', '', '', '', '']);
      currentCat = item.categoria;
    }
    ws_data.push([
      rowNum++,
      item.codigo,
      item.categoria,
      item.descripcion,
      item.presentacion,
      item.unidad,
      '',                 // Cantidad (a completar)
      item.precio_ref,    // Precio ref
      '',                 // Subtotal (fórmula)
      ''                  // Observaciones
    ]);
  });

  // Totales
  ws_data.push(['', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['', '', '', '', '', '', '', 'SUBTOTAL s/IVA:', '', '']);
  ws_data.push(['', '', '', '', '', '', '', 'IVA 21%:', '', '']);
  ws_data.push(['', '', '', '', '', '', '', 'TOTAL CON IVA:', '', '']);
  ws_data.push(['', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['CONDICIONES GENERALES:', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['• La mercadería debe entregarse en el horario: Lunes a Viernes 07:00 a 16:00 hs.', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['• El ingreso de proveedores por acceso de carga (calle lateral al shopping).', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['• Remito en original y duplicado. Factura tipo A o B según corresponda.', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['• Ante cualquier consulta comunicarse con el Dpto. de Compras.', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['', '', '', '', '', '', '', '', '', '']);
  ws_data.push(['_______________________________', '', '', '_______________________________', '', '', '', '_______________________________', '', '']);
  ws_data.push(['Firma Solicitante', '', '', 'Firma Responsable de Compras', '', '', '', 'Firma y Sello Proveedor', '', '']);
  ws_data.push(['Aclaración:', '', '', 'Aclaración:', '', '', '', 'Aclaración:', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Anchos de columna
  ws['!cols'] = [
    { wch: 5 },   // N°
    { wch: 9 },   // Código
    { wch: 26 },  // Categoría
    { wch: 48 },  // Descripción
    { wch: 22 },  // Presentación
    { wch: 10 },  // Unidad
    { wch: 12 },  // Cantidad
    { wch: 18 },  // Precio ref
    { wch: 16 },  // Subtotal
    { wch: 24 },  // Observaciones
  ];

  return ws;
}

// ── HOJA 2: CATÁLOGO COMPLETO ─────────────────────────────────────────────────

function crearHojaCatalogo() {
  const header = ['Código', 'Categoría', 'Descripción', 'Presentación', 'Unidad', 'Precio Ref. (ARS)', 'Proveedor Referencia'];
  const rows = CATALOGO.map(p => [
    p.codigo, p.categoria, p.descripcion,
    p.presentacion, p.unidad, p.precio_ref, p.proveedor_ref
  ]);
  const ws = XLSX.utils.aoa_to_sheet([
    ['CATÁLOGO DE PRODUCTOS - LIMPIEZA / PAPELERÍA / DESCARTABLES'],
    ['Shopping Center Tigre — Referencia de precios: Marzo 2026 (ARS sin IVA)'],
    [],
    header,
    ...rows
  ]);
  ws['!cols'] = [
    { wch: 9 }, { wch: 26 }, { wch: 48 },
    { wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 24 }
  ];
  return ws;
}

// ── HOJA 3: CONTROL DE STOCK ──────────────────────────────────────────────────

function crearHojaStock() {
  const header = [
    'Código', 'Descripción', 'Categoría',
    'Stock Mínimo', 'Stock Máximo', 'Stock Actual',
    'Unidad', 'A Pedir', 'Último Pedido', 'Proveedor Habitual', 'Notas'
  ];
  const rows = CATALOGO.map(p => [
    p.codigo, p.descripcion, p.categoria,
    '', '', '', p.unidad, '', '', p.proveedor_ref, ''
  ]);
  const ws = XLSX.utils.aoa_to_sheet([
    ['CONTROL DE STOCK — INSUMOS SHOPPING'],
    ['Período:', '', 'Responsable:', '', '', '', '', '', '', '', ''],
    [],
    header,
    ...rows
  ]);
  ws['!cols'] = [
    { wch: 9 }, { wch: 40 }, { wch: 24 },
    { wch: 13 }, { wch: 13 }, { wch: 13 },
    { wch: 10 }, { wch: 9 }, { wch: 14 }, { wch: 22 }, { wch: 22 }
  ];
  return ws;
}

// ── HOJA 4: COMPARATIVO DE PROVEEDORES ───────────────────────────────────────

function crearHojaComparativo() {
  const ws_data = [
    ['COMPARATIVO DE PRECIOS — PROVEEDORES'],
    ['Artículo analizado:', '', 'Fecha:', '', '', '', '', ''],
    [],
    ['Proveedor', 'CUIT', 'Precio Unit. (s/IVA)', 'Condición Pago', 'Plazo Entrega', 'Flete Incluido', 'Observaciones', 'Recomendado'],
    ['Proveedor 1', '', '', '', '', '', '', ''],
    ['Proveedor 2', '', '', '', '', '', '', ''],
    ['Proveedor 3', '', '', '', '', '', '', ''],
    [],
    ['RESUMEN MENSUAL DE COMPRAS', '', '', '', '', '', '', ''],
    ['Mes', 'Total Limpieza', 'Total Papel/Higiene', 'Total Descartables', 'Total Accesorios', 'Total Bolsas', 'TOTAL MES', 'Variación %'],
    ['Enero', '', '', '', '', '', '', ''],
    ['Febrero', '', '', '', '', '', '', ''],
    ['Marzo', '', '', '', '', '', '', ''],
    ['Abril', '', '', '', '', '', '', ''],
    ['Mayo', '', '', '', '', '', '', ''],
    ['Junio', '', '', '', '', '', '', ''],
    ['Julio', '', '', '', '', '', '', ''],
    ['Agosto', '', '', '', '', '', '', ''],
    ['Septiembre', '', '', '', '', '', '', ''],
    ['Octubre', '', '', '', '', '', '', ''],
    ['Noviembre', '', '', '', '', '', '', ''],
    ['Diciembre', '', '', '', '', '', '', ''],
    ['TOTAL AÑO', '', '', '', '', '', '', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [
    { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 17 },
    { wch: 15 }, { wch: 14 }, { wch: 24 }, { wch: 14 }
  ];
  return ws;
}

// ── ENSAMBLAR Y GUARDAR ───────────────────────────────────────────────────────

const wsOrden      = crearHojaOrdenCompra();
const wsCatalogo   = crearHojaCatalogo();
const wsStock      = crearHojaStock();
const wsComparativo = crearHojaComparativo();

XLSX.utils.book_append_sheet(wb, wsOrden,       'ORDEN DE COMPRA');
XLSX.utils.book_append_sheet(wb, wsCatalogo,    'CATÁLOGO');
XLSX.utils.book_append_sheet(wb, wsStock,       'CONTROL DE STOCK');
XLSX.utils.book_append_sheet(wb, wsComparativo, 'COMPARATIVO PROVEEDORES');

const outFile = 'Plantilla_Pedido_Limpieza_Shopping_Tigre.xlsx';
XLSX.writeFile(wb, outFile);

console.log(`✔  Archivo generado: ${outFile}`);
console.log(`   Hojas incluidas:`);
console.log(`   1. ORDEN DE COMPRA   — Plantilla lista para imprimir/enviar`);
console.log(`   2. CATÁLOGO          — ${CATALOGO.length} productos estándar con precios de referencia`);
console.log(`   3. CONTROL DE STOCK  — Seguimiento de inventario mínimo/máximo`);
console.log(`   4. COMPARATIVO PROVEEDORES — Tabla de cotizaciones y resumen anual`);
