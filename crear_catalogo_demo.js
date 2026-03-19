/**
 * Genera un PDF de catálogo de proveedor de ejemplo
 * (simula una lista de precios real de distribuidora AR)
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 40, size: 'A4' });
const out = 'catalogo_demo_proveedor.pdf';
doc.pipe(fs.createWriteStream(out));

const COL = { cod: 40, desc: 120, pres: 340, uni: 420, precio: 490 };
const W   = 555;

// ── Colores ──
const AZUL  = '#1a3a6b';
const GRIS  = '#4a4a4a';
const LGRIS = '#f0f0f0';
const VERDE = '#1a6b3a';

function header() {
  doc.rect(0, 0, 595, 80).fill(AZUL);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
     .text('DISTRIBUIDORA CLEAN MAX S.R.L.', 40, 18);
  doc.fontSize(10).font('Helvetica')
     .text('CUIT: 30-71234567-8  |  Tel: (011) 4523-7890  |  cleanmax@correo.com.ar', 40, 44)
     .text('Av. Constitución 3456, Gral. Pacheco, Pcia. Bs. As.  |  Zona: GBA Norte y Delta', 40, 58);
  doc.fillColor(GRIS);
}

function seccion(titulo, y) {
  doc.rect(40, y, W, 18).fill(AZUL);
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
     .text(titulo, 44, y + 4);
  doc.fillColor(GRIS);
  return y + 18;
}

function filaTitulo(y) {
  doc.rect(40, y, W, 14).fill('#c8d8f0');
  doc.fillColor(AZUL).fontSize(7).font('Helvetica-Bold');
  doc.text('CÓDIGO',     COL.cod,  y+3);
  doc.text('DESCRIPCIÓN',COL.desc, y+3);
  doc.text('PRESENTACIÓN',COL.pres,y+3);
  doc.text('UNIDAD',     COL.uni,  y+3);
  doc.text('PRECIO ARS', COL.precio,y+3);
  doc.fillColor(GRIS);
  return y + 14;
}

function fila(cod, desc, pres, uni, precio, y, shade) {
  if (shade) doc.rect(40, y, W, 13).fill(LGRIS);
  doc.font('Helvetica').fontSize(7.5).fillColor('#222');
  doc.text(cod,    COL.cod,  y+2, { width: 75 });
  doc.text(desc,   COL.desc, y+2, { width: 210 });
  doc.text(pres,   COL.pres, y+2, { width: 75 });
  doc.text(uni,    COL.uni,  y+2, { width: 65 });
  doc.font('Helvetica-Bold').text(precio, COL.precio, y+2, { width: 65 });
  doc.font('Helvetica').fillColor(GRIS);
  return y + 13;
}

// ── Construir PDF ──

header();

doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold')
   .text('LISTA DE PRECIOS — ARTÍCULOS DE LIMPIEZA Y DESCARTABLES', 40, 95);
doc.fontSize(8).font('Helvetica').fillColor(GRIS)
   .text('Vigencia: Marzo 2026  |  Precios en ARS sin IVA (21%)  |  Condición: Contado / 30 días según cliente', 40, 112);

let y = 130;

// LIMPIADORES
y = seccion('1. PRODUCTOS DE LIMPIEZA Y DESINFECCIÓN', y);
y = filaTitulo(y);
const limpiadores = [
  ['LD-001','Lavandina concentrada 10%',          'Bidón 5 L',         'Bidón', '2.800'],
  ['LD-002','Lavandina lista para usar',           'Botella 2 L',       'Botella','950'],
  ['LD-003','Desinfectante multiusos fragancia pino','Bidón 5 L',       'Bidón', '3.200'],
  ['LD-004','Desengrasante industrial fuerte',     'Bidón 5 L',         'Bidón', '3.800'],
  ['LD-005','Limpiador multiusos neutro pisos duros','Bidón 5 L',       'Bidón', '2.900'],
  ['LD-006','Limpiavidrios con alcohol isopropilico','Botella gatillo 500 mL','Botella','780'],
  ['LD-007','Detergente concentrado lavavajillas', 'Bidón 5 L',         'Bidón', '3.100'],
  ['LD-008','Alcohol en gel 70° recarga dispensador','Bidón 5 L',       'Bidón', '4.200'],
  ['LD-009','Jabón líquido de manos recarga',      'Bidón 5 L',         'Bidón', '3.500'],
  ['LD-010','Quita sarro baño ácido',              'Botella 750 mL',    'Botella','1.100'],
  ['LD-011','Desodorante de ambientes aerosol pino','Aerosol 400 mL',   'Unidad', '1.400'],
  ['LD-012','Pastillas urinal WC canasto',         'Unidad',            'Unidad', '450'],
];
limpiadores.forEach((r, i) => { y = fila(...r, y, i%2===0); });

y += 6;

// PAPEL
y = seccion('2. PAPEL HIGIÉNICO, TOALLAS Y SERVILLETAS', y);
y = filaTitulo(y);
const papel = [
  ['PH-001','Papel higiénico industrial JRT 300 m','Rollo 300 m',       'Rollo', '1.800'],
  ['PH-002','Papel higiénico hoja doble x 30 rollos','Pack x 30',       'Pack',  '8.500'],
  ['PH-003','Toallas papel interfoliadas dispenser','Paquete x 150 hjs','Paquete','950'],
  ['PH-004','Toallas papel rollo bobina 100 m',    'Rollo 100 m',       'Rollo', '2.200'],
  ['PH-005','Servilletas 30x30 cm',                'Pack x 500',        'Pack',  '3.200'],
  ['PH-006','Servilletas cocktail 20x20 cm',       'Pack x 500',        'Pack',  '1.800'],
  ['PH-007','Rollo de cocina gastronomía 250 hojas','Rollo',            'Rollo', '600'],
  ['PH-008','Papel film 45 cm x 300 m industria',  'Rollo',             'Rollo', '4.500'],
  ['PH-009','Papel aluminio 45 cm x 100 m',        'Rollo',             'Rollo', '3.800'],
];
papel.forEach((r, i) => { y = fila(...r, y, i%2===0); });

// Nueva página
doc.addPage();
header();
y = 95;

// DESCARTABLES
y = seccion('3. DESCARTABLES GASTRONOMÍA Y FOOD COURT', y);
y = filaTitulo(y);
const desc = [
  ['DG-001','Vaso térmico PS 8 oz café',           'Pack x 50',         'Pack',  '1.400'],
  ['DG-002','Vaso térmico PS 12 oz bebidas cal.',  'Pack x 50',         'Pack',  '1.700'],
  ['DG-003','Vaso plástico transparente 200 mL',   'Pack x 100',        'Pack',  '1.200'],
  ['DG-004','Vaso plástico transparente 300 mL',   'Pack x 100',        'Pack',  '1.500'],
  ['DG-005','Tapa para vaso térmico 8/12 oz',      'Pack x 50',         'Pack',  '900'],
  ['DG-006','Plato plástico llano 23 cm',          'Pack x 25',         'Pack',  '2.200'],
  ['DG-007','Plato plástico hondo 23 cm',          'Pack x 25',         'Pack',  '2.400'],
  ['DG-008','Set cubierto tenedor cuchillo cuchara PS','Pack x 100',    'Pack',  '3.200'],
  ['DG-009','Sorbete flexible individual',         'Pack x 500',        'Pack',  '1.600'],
  ['DG-010','Sorbete papel biodegradable',         'Pack x 100',        'Pack',  '1.100'],
  ['DG-011','Contenedor espumado 23x15 cm',        'Pack x 50',         'Pack',  '2.800'],
  ['DG-012','Bandeja aluminio Nro 3 porciones',    'Pack x 100',        'Pack',  '4.500'],
  ['DG-013','Caja cartón hamburguesa 12x12 cm',    'Pack x 100',        'Pack',  '5.500'],
  ['DG-014','Bolsa papel madera kraft 25x35 cm',   'Pack x 100',        'Pack',  '3.800'],
  ['DG-015','Guantes descartables latex x 100',    'Caja x 100',        'Caja',  '4.200'],
  ['DG-016','Guantes descartables nitrilo x 100',  'Caja x 100',        'Caja',  '5.800'],
  ['DG-017','Gorra descartable cofia x 100',       'Pack x 100',        'Pack',  '1.200'],
  ['DG-018','Barbijo descartable 3 capas x 50',    'Caja x 50',         'Caja',  '3.500'],
];
desc.forEach((r, i) => { y = fila(...r, y, i%2===0); });

y += 6;

// BOLSAS
y = seccion('4. BOLSAS DE RESIDUOS', y);
y = filaTitulo(y);
const bolsas = [
  ['BR-001','Bolsa negra residuos 40 L 60x90 cm',  'Pack x 10',         'Pack',  '650'],
  ['BR-002','Bolsa negra residuos 80 L 80x110 cm', 'Pack x 10',         'Pack',  '1.100'],
  ['BR-003','Bolsa negra residuos 120 L 90x130 cm','Pack x 10',         'Pack',  '1.600'],
  ['BR-004','Bolsa transparente reciclaje 50 L',   'Pack x 10',         'Pack',  '700'],
  ['BR-005','Bolsa verde orgánicos 40 L',          'Pack x 10',         'Pack',  '700'],
];
bolsas.forEach((r, i) => { y = fila(...r, y, i%2===0); });

y += 6;

// ACCESORIOS
y = seccion('5. ACCESORIOS Y UTENSILIOS DE LIMPIEZA', y);
y = filaTitulo(y);
const accesorios = [
  ['AC-001','Trapo de piso algodón 70x80 cm',      'Unidad',            'Unidad','1.200'],
  ['AC-002','Repasador gamuza cocina 50x70 cm',    'Unidad',            'Unidad','850'],
  ['AC-003','Esponja doble faz verde',             'Pack x 10',         'Pack',  '2.200'],
  ['AC-004','Guantes de goma largos limpieza',     'Par',               'Par',   '980'],
  ['AC-005','Cepillo de baño con soporte',         'Unidad',            'Unidad','1.500'],
  ['AC-006','Mecha mopa de piso repuesto',         'Unidad',            'Unidad','2.800'],
  ['AC-007','Secador de piso goma 40 cm',          'Unidad',            'Unidad','2.200'],
  ['AC-008','Escoba plástica con palito',          'Unidad',            'Unidad','1.800'],
  ['AC-009','Balde plástico 12 L con escurridor',  'Unidad',            'Unidad','3.200'],
  ['AC-010','Fibra verde abrasiva',                'Pack x 10',         'Pack',  '1.900'],
  ['AC-011','Pulverizador pistola gatillo 1 L',    'Unidad',            'Unidad','750'],
  ['AC-012','Paño microfibra 40x40 cm',            'Pack x 5',          'Pack',  '2.500'],
];
accesorios.forEach((r, i) => { y = fila(...r, y, i%2===0); });

// Pie de página
y += 12;
doc.rect(40, y, W, 0.5).fill('#aaaaaa');
y += 6;
doc.fontSize(7).font('Helvetica').fillColor(GRIS)
   .text('Los precios expresados son en pesos argentinos (ARS) sin IVA. Sujetos a cambio sin previo aviso.', 40, y)
   .text('Mínimo de compra: $50.000 + IVA. Envío sin cargo en zona GBA Norte para pedidos mayores a $150.000 + IVA.', 40, y+10)
   .text('Vigencia lista: Marzo 2026  |  Próxima actualización: 01/04/2026', 40, y+20);

doc.end();
console.log('PDF generado:', out);
