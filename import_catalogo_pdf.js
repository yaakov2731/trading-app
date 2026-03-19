#!/usr/bin/env node
/**
 * Importador de Catálogo PDF → Excel (Orden de Compra)
 * =====================================================
 * Uso:
 *   node import_catalogo_pdf.js <archivo.pdf> [--proveedor "Nombre"] [--out salida.xlsx]
 *
 * Qué hace:
 *   1. Extrae texto del PDF del proveedor
 *   2. Detecta líneas de producto (código, descripción, presentación, precio)
 *   3. Genera/actualiza el Excel de Orden de Compra con esos productos
 *
 * Patrones reconocidos (formatos comunes de catálogos AR):
 *   • "CODIGO  Descripción del producto  Presentación  $1.234,56"
 *   • "001 - Lavandina concentrada  Bidón 5L  2800"
 *   • Tablas con separadores por tabulación o múltiples espacios
 */

const fs       = require('fs');
const path     = require('path');
const pdfParse = require('pdf-parse');
const XLSX     = require('xlsx');

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log(`
USO:
  node import_catalogo_pdf.js <catalogo.pdf> [opciones]

OPCIONES:
  --proveedor "Nombre Proveedor"   Nombre del proveedor (se incluye en el Excel)
  --out       salida.xlsx          Nombre del archivo de salida (default: OC_<proveedor>_<fecha>.xlsx)
  --hoja      "Nombre hoja"        Nombre de la hoja en el Excel (default: ORDEN DE COMPRA)
  --help                           Muestra esta ayuda

EJEMPLOS:
  node import_catalogo_pdf.js catalogo_quimica_sur.pdf --proveedor "Química Sur SRL"
  node import_catalogo_pdf.js lista_precios.pdf --proveedor "PaperMax" --out pedido_marzo.xlsx
`);
  process.exit(0);
}

const pdfArg       = args[0];
const proveedorIdx = args.indexOf('--proveedor');
const outIdx       = args.indexOf('--out');
const hojaIdx      = args.indexOf('--hoja');

const nombreProveedor = proveedorIdx !== -1 ? args[proveedorIdx + 1] : 'Proveedor';
const hojaName        = hojaIdx      !== -1 ? args[hojaIdx + 1]      : 'ORDEN DE COMPRA';
const fechaHoy        = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const defaultOut      = `OC_${nombreProveedor.replace(/\s+/g, '_')}_${fechaHoy}.xlsx`;
const outFile         = outIdx !== -1 ? args[outIdx + 1] : defaultOut;

if (!fs.existsSync(pdfArg)) {
  console.error(`ERROR: No se encontró el archivo: ${pdfArg}`);
  process.exit(1);
}

// ─── PARSER DE LÍNEAS DE PRODUCTO ────────────────────────────────────────────

/**
 * Categorías detectadas por palabras clave en la descripción.
 * Se asigna automáticamente al importar.
 */
const CATEGORIAS_KW = [
  { cat: 'Limpiadores y Desinfectantes', kw: ['lavandina','cloro','desinfect','desengras','limpiador','limpiavidrio','detergente','jabon','jabón','alcohol','gel','quitasarro','quita sarro','desodor','pastilla'] },
  { cat: 'Papel Higiénico y Toallas',    kw: ['papel higienico','papel higiénico','jrt','toalla','servilleta','rollo cocina','film','aluminio','papel manteca','sulfito'] },
  { cat: 'Descartables Gastronomía',     kw: ['vaso','plato','cubierto','sorbete','contenedor','bandeja','caja carton','caja cartón','bolsa papel','kraft','guante','cofia','gorra','barbijo','descartable'] },
  { cat: 'Bolsas de Residuos',           kw: ['bolsa negra','bolsa residuo','bolsa verde','bolsa transparent','residuo'] },
  { cat: 'Accesorios de Limpieza',       kw: ['trapo','repasador','esponja','guante goma','cepillo','mecha','mopa','secador','escoba','balde','fibra','pulverizador','microfibra','palito'] },
];

function detectarCategoria(descripcion) {
  const d = descripcion.toLowerCase();
  for (const { cat, kw } of CATEGORIAS_KW) {
    if (kw.some(k => d.includes(k))) return cat;
  }
  return 'Sin Categoría';
}

/**
 * Normaliza un string de precio argentino:
 *   "$1.234,56" → 1234.56
 *   "1234,56"   → 1234.56
 *   "1234.56"   → 1234.56
 *   "1234"      → 1234
 */
function parsePrecio(str) {
  if (!str) return null;
  // Quitar símbolo peso y espacios
  let s = str.replace(/[$\s]/g, '');
  // Formato AR: punto como miles, coma como decimal
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // Coma como separador de miles o decimal
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Extrae líneas de producto del texto del PDF.
 * Estrategia: buscar líneas con al menos código + descripción + precio.
 *
 * Patrones probados contra catálogos reales de distribuidores AR:
 *   A) COD  Descripción  Presentación  Precio
 *   B) Descripción  Presentación  Precio
 *   C) Nro) Descripción ... $ Precio
 */
function extraerProductos(texto, nombreProv) {
  const productos = [];
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 3);

  // Regex de precio: número con separadores AR/EN al final de línea o campo
  const rePrecio = /\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*$/;
  // Regex de código de artículo: secuencia alfanum al inicio (3–12 chars)
  const reCodigo = /^([A-Za-z0-9]{2,12}[-.]?\d{0,4})\s{2,}/;

  // Regex para línea tipo tabla: 2+ columnas separadas por 2+ espacios o tabs
  const reColumnas = /^(.+?)(?:\t|\s{2,})(.+?)(?:\t|\s{2,})(.*)$/;

  let contadorAuto = 1;

  for (const linea of lineas) {
    // Ignorar encabezados típicos de catálogos
    if (/^(codigo|código|descripcion|descripción|precio|unidad|presentacion|total|subtotal|iva|pagina|página|\d+\s*\/\s*\d+)/i.test(linea)) continue;
    if (linea.length < 8) continue;

    const precioMatch = linea.match(rePrecio);
    if (!precioMatch) continue; // sin precio → no es línea de producto

    const precio = parsePrecio(precioMatch[1]);
    if (!precio || precio > 10_000_000) continue; // filtrar números raros

    // Quitar el precio del resto de la línea para parsear descripción
    const sinPrecio = linea.slice(0, linea.lastIndexOf(precioMatch[0])).trim();

    let codigo = '';
    let descripcion = sinPrecio;
    let presentacion = '';

    // Intentar extraer código al inicio
    const codMatch = sinPrecio.match(reCodigo);
    if (codMatch) {
      codigo = codMatch[1];
      descripcion = sinPrecio.slice(codMatch[0].length).trim();
    }

    // Intentar separar descripción de presentación (último segmento tras 2+ espacios)
    const colMatch = descripcion.match(/^(.+?)\s{2,}(.+)$/);
    if (colMatch) {
      // Heurística: si el último segmento parece presentación (contiene L, kg, cm, ml, x, /)
      if (/(\d\s*(L|Kg|kg|ml|mL|cm|g|u|un|x)\b|x\s*\d|\d+\s*\/)/i.test(colMatch[2])) {
        descripcion  = colMatch[1].trim();
        presentacion = colMatch[2].trim();
      }
    }

    // Limpiar descripción de caracteres raros de PDF
    descripcion = descripcion.replace(/\s+/g, ' ').replace(/[^\w\s\-()/.,áéíóúüñÁÉÍÓÚÜÑ%°]/g, '').trim();
    if (descripcion.length < 4) continue;

    if (!codigo) {
      codigo = `IMP-${String(contadorAuto).padStart(3, '0')}`;
      contadorAuto++;
    }

    productos.push({
      codigo,
      descripcion,
      presentacion,
      precio_ref: precio,
      categoria: detectarCategoria(descripcion),
      proveedor_ref: nombreProv,
    });
  }

  return productos;
}

// ─── GENERADOR DE EXCEL ───────────────────────────────────────────────────────

function generarExcel(productos, proveedor, outPath, hojaName) {
  const wb = XLSX.utils.book_new();
  const fechaEmision = new Date().toLocaleDateString('es-AR');

  // ── Hoja 1: ORDEN DE COMPRA ──────────────────────────────────────────────
  const wsData = [];

  wsData.push(['ORDEN DE COMPRA — CATÁLOGO IMPORTADO DE PROVEEDOR', '', '', '', '', '', '', '', '']);
  wsData.push(['']);
  wsData.push(['DATOS DEL SHOPPING',    '', '', 'DATOS DEL PEDIDO',          '', '', 'DATOS DEL PROVEEDOR', '', '']);
  wsData.push(['Razón Social:',  'Shopping Tigre S.A.',       '', 'N° Orden:',              `OC-${fechaEmision.replace(/\//g,'-')}-`, '', 'Proveedor:', proveedor, '']);
  wsData.push(['CUIT:',          '30-XXXXXXXX-X',             '', 'Fecha emisión:',         fechaEmision,                             '', 'CUIT:',      '',         '']);
  wsData.push(['Dirección:',     'Av. Julio Roca 1XXX, Tigre','', 'Fecha entrega requerida:','',                                       '', 'Contacto:',  '',         '']);
  wsData.push(['Localidad:',     'Tigre, Pcia. Bs. As.',      '', 'Área solicitante:',      '',                                       '', 'Teléfono:',  '',         '']);
  wsData.push(['Contacto:',      '',                          '', 'Solicitado por:',        '',                                       '', 'Email:',     '',         '']);
  wsData.push(['',               '',                          '', 'Aprobado por:',          '',                                       '', 'Condición pago:', '',    '']);
  wsData.push(['']);
  wsData.push(['']);

  // Encabezado tabla
  wsData.push([
    'N°', 'Código', 'Categoría', 'Descripción del Artículo',
    'Presentación', 'Unidad', 'Cantidad Solicitada',
    'Precio Unit. (ARS s/IVA)', 'Subtotal (ARS)', 'Observaciones'
  ]);

  // Filas de productos agrupadas por categoría
  let n = 1;
  let catActual = '';
  for (const p of productos) {
    if (p.categoria !== catActual) {
      wsData.push([`── ${p.categoria.toUpperCase()} ──`, '', '', '', '', '', '', '', '', '']);
      catActual = p.categoria;
    }
    wsData.push([
      n++, p.codigo, p.categoria, p.descripcion,
      p.presentacion, '', '',
      p.precio_ref, '', ''
    ]);
  }

  // Totales y firmas
  wsData.push(['']);
  wsData.push(['', '', '', '', '', '', '', 'SUBTOTAL s/IVA:', '', '']);
  wsData.push(['', '', '', '', '', '', '', 'IVA 21%:', '', '']);
  wsData.push(['', '', '', '', '', '', '', 'TOTAL CON IVA:', '', '']);
  wsData.push(['']);
  wsData.push(['CONDICIONES GENERALES:', '', '', '', '', '', '', '', '', '']);
  wsData.push(['• Entrega: Lunes a Viernes 07:00–16:00 hs. Acceso de carga lateral al shopping.', '', '', '', '', '', '', '', '', '']);
  wsData.push(['• Remito original + duplicado. Factura tipo A o B según corresponda.', '', '', '', '', '', '', '', '', '']);
  wsData.push(['']);
  wsData.push(['_______________________________', '', '', '_______________________________', '', '', '', '_______________________________', '', '']);
  wsData.push(['Firma Solicitante', '', '', 'Responsable de Compras', '', '', '', 'Firma y Sello Proveedor', '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(wsData);
  ws1['!cols'] = [
    { wch: 5 }, { wch: 10 }, { wch: 26 }, { wch: 46 },
    { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, hojaName);

  // ── Hoja 2: CATÁLOGO IMPORTADO ───────────────────────────────────────────
  const cat2 = [
    [`CATÁLOGO IMPORTADO — ${proveedor.toUpperCase()}`],
    [`Archivo origen: ${path.basename(pdfArg)}   |   Fecha importación: ${fechaEmision}   |   Total productos: ${productos.length}`],
    [''],
    ['Código', 'Descripción', 'Presentación', 'Precio Ref. (ARS s/IVA)', 'Categoría Asignada'],
    ...productos.map(p => [p.codigo, p.descripcion, p.presentacion, p.precio_ref, p.categoria])
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(cat2);
  ws2['!cols'] = [{ wch: 12 }, { wch: 50 }, { wch: 22 }, { wch: 22 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'CATÁLOGO IMPORTADO');

  // ── Hoja 3: REVISIÓN / CORRECCIONES ──────────────────────────────────────
  const rev = [
    ['REVISIÓN DE PRODUCTOS IMPORTADOS'],
    ['Revisá que la descripción, presentación y categoría sean correctas. Modificá directamente en esta hoja.'],
    [''],
    ['Código', 'Descripción Original (PDF)', 'Descripción Corregida', 'Presentación', 'Precio', 'Categoría', 'Incluir en Pedido (SI/NO)'],
    ...productos.map(p => [p.codigo, p.descripcion, '', p.presentacion, p.precio_ref, p.categoria, 'SI'])
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(rev);
  ws3['!cols'] = [{ wch: 12 }, { wch: 46 }, { wch: 36 }, { wch: 22 }, { wch: 14 }, { wch: 28 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'REVISIÓN');

  XLSX.writeFile(wb, outPath);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📄 Leyendo PDF: ${pdfArg}`);
  const buffer = fs.readFileSync(pdfArg);

  let data;
  try {
    data = await pdfParse(buffer);
  } catch (e) {
    console.error('ERROR al parsear el PDF:', e.message);
    process.exit(1);
  }

  const totalPags = data.numpages;
  const totalChars = data.text.length;
  console.log(`   Páginas: ${totalPags}  |  Caracteres extraídos: ${totalChars}`);

  const productos = extraerProductos(data.text, nombreProveedor);

  if (productos.length === 0) {
    console.warn('\n⚠  No se detectaron líneas de producto con precio.');
    console.warn('   Posibles causas:');
    console.warn('   • El PDF es escaneado (imagen) — requiere OCR');
    console.warn('   • El formato del catálogo no tiene precios numéricos visibles');
    console.warn('   • Los precios usan un formato no estándar');
    console.warn('\n   Tip: revisá el texto extraído guardado en "debug_pdf_text.txt"');
    fs.writeFileSync('debug_pdf_text.txt', data.text, 'utf8');
    process.exit(1);
  }

  // Resumen por categoría
  const porCat = {};
  for (const p of productos) {
    porCat[p.categoria] = (porCat[p.categoria] || 0) + 1;
  }

  console.log(`\n✅ Productos detectados: ${productos.length}`);
  for (const [cat, cnt] of Object.entries(porCat)) {
    console.log(`   ${cat}: ${cnt}`);
  }

  generarExcel(productos, nombreProveedor, outFile, hojaName);

  console.log(`\n📊 Excel generado: ${outFile}`);
  console.log('   Hojas:');
  console.log('   1. ORDEN DE COMPRA      — lista para completar cantidades y enviar');
  console.log('   2. CATÁLOGO IMPORTADO   — todos los productos del PDF');
  console.log('   3. REVISIÓN             — verificá/corregí categorías y descripciones');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Abrí el Excel en la hoja REVISIÓN y corregí lo que necesites');
  console.log('   2. Pasá a ORDEN DE COMPRA, completá columna "Cantidad Solicitada"');
  console.log('   3. Imprimí o enviá por email al proveedor\n');
}

main().catch(e => {
  console.error('Error inesperado:', e);
  process.exit(1);
});
