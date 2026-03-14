-- =============================================================================
-- seed.sql
-- Development seed data: roles, locations, categories, units, sample products
-- Run after all migrations. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- =============================================================================

-- ── Roles ─────────────────────────────────────────────────────────────────────

INSERT INTO roles (name, display_name, description) VALUES
  ('admin',      'Administrador',   'Acceso total al sistema'),
  ('supervisor', 'Supervisor',      'Gestión de productos, reportes y configuración de ubicaciones'),
  ('encargado',  'Encargado',       'Operaciones de stock en ubicaciones asignadas'),
  ('read_only',  'Solo Lectura',    'Consulta de stock e historial sin modificaciones')
ON CONFLICT (name) DO NOTHING;

-- ── Locations ─────────────────────────────────────────────────────────────────

INSERT INTO locations (id, name, slug, description, color, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Umo Grill',      'umo-grill',      'Restaurante principal - parrilla y carnes',           '#ef4444', TRUE),
  ('11111111-0000-0000-0000-000000000002', 'Puerto Gelato',  'puerto-gelato',  'Heladería y postres artesanales',                     '#3b82f6', TRUE),
  ('11111111-0000-0000-0000-000000000003', 'Brooklyn',       'brooklyn',       'Hamburguesería estilo americano',                     '#f59e0b', TRUE),
  ('11111111-0000-0000-0000-000000000004', 'Trento Café',    'trento-cafe',    'Cafetería y pastelería',                              '#8b5cf6', TRUE),
  ('11111111-0000-0000-0000-000000000005', 'Eventos',        'eventos',        'Depósito y logística para eventos especiales',        '#10b981', TRUE),
  ('11111111-0000-0000-0000-000000000006', 'Shopping',       'shopping',       'Local en shopping center',                            '#ec4899', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── Units ─────────────────────────────────────────────────────────────────────

INSERT INTO units (id, name, symbol, unit_type) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Kilogramo',   'kg',  'weight'),
  ('22222222-0000-0000-0000-000000000002', 'Gramo',       'g',   'weight'),
  ('22222222-0000-0000-0000-000000000003', 'Litro',       'L',   'volume'),
  ('22222222-0000-0000-0000-000000000004', 'Mililitro',   'mL',  'volume'),
  ('22222222-0000-0000-0000-000000000005', 'Unidad',      'u',   'unit'),
  ('22222222-0000-0000-0000-000000000006', 'Porción',     'prc', 'unit'),
  ('22222222-0000-0000-0000-000000000007', 'Caja',        'caj', 'unit'),
  ('22222222-0000-0000-0000-000000000008', 'Botella',     'bot', 'unit'),
  ('22222222-0000-0000-0000-000000000009', 'Lata',        'lat', 'unit'),
  ('22222222-0000-0000-0000-000000000010', 'Bolsa',       'bol', 'unit'),
  ('22222222-0000-0000-0000-000000000011', 'Bandeja',     'bnd', 'unit'),
  ('22222222-0000-0000-0000-000000000012', 'Docena',      'doc', 'unit')
ON CONFLICT (id) DO NOTHING;

-- ── Categories ────────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, prefix, description, color, is_active) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Carnes',          'CAR', 'Carnes rojas, blancas y embutidos',            '#ef4444', TRUE),
  ('33333333-0000-0000-0000-000000000002', 'Verduras',        'VER', 'Verduras frescas y congeladas',                '#22c55e', TRUE),
  ('33333333-0000-0000-0000-000000000003', 'Bebidas',         'BEB', 'Bebidas alcohólicas y sin alcohol',            '#3b82f6', TRUE),
  ('33333333-0000-0000-0000-000000000004', 'Lácteos',         'LAC', 'Leche, quesos, manteca, crema',                '#f59e0b', TRUE),
  ('33333333-0000-0000-0000-000000000005', 'Panificados',     'PAN', 'Pan, bollos, hamburguesas, brioche',           '#d97706', TRUE),
  ('33333333-0000-0000-0000-000000000006', 'Salsas',          'SAL', 'Salsas, condimentos y aderezos',               '#f97316', TRUE),
  ('33333333-0000-0000-0000-000000000007', 'Frutas',          'FRU', 'Frutas frescas y congeladas',                  '#ec4899', TRUE),
  ('33333333-0000-0000-0000-000000000008', 'Abarrotes',       'ABA', 'Productos secos y enlatados',                  '#8b5cf6', TRUE),
  ('33333333-0000-0000-0000-000000000009', 'Limpieza',        'LIM', 'Productos de limpieza e higiene',              '#06b6d4', TRUE),
  ('33333333-0000-0000-0000-000000000010', 'Descartables',    'DES', 'Vasos, platos, cubiertos descartables',        '#64748b', TRUE),
  ('33333333-0000-0000-0000-000000000011', 'Helados',         'HEL', 'Bases, coberturas e insumos para helados',     '#a78bfa', TRUE),
  ('33333333-0000-0000-0000-000000000012', 'Cafetería',       'CAF', 'Café, té, infusiones y accesorios',            '#78716c', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── SKU sequences (initialize at 0 for each category) ────────────────────────

INSERT INTO sku_sequences (category_id, last_sequence) VALUES
  ('33333333-0000-0000-0000-000000000001', 0),
  ('33333333-0000-0000-0000-000000000002', 0),
  ('33333333-0000-0000-0000-000000000003', 0),
  ('33333333-0000-0000-0000-000000000004', 0),
  ('33333333-0000-0000-0000-000000000005', 0),
  ('33333333-0000-0000-0000-000000000006', 0),
  ('33333333-0000-0000-0000-000000000007', 0),
  ('33333333-0000-0000-0000-000000000008', 0),
  ('33333333-0000-0000-0000-000000000009', 0),
  ('33333333-0000-0000-0000-000000000010', 0),
  ('33333333-0000-0000-0000-000000000011', 0),
  ('33333333-0000-0000-0000-000000000012', 0)
ON CONFLICT (category_id) DO NOTHING;

-- ── Sample products (legacy import — SKUs provided manually) ──────────────────
-- These represent common inventory items across the restaurant group.
-- Using create_product_with_sku() RPC so sequence is NOT consumed.

SELECT create_product_with_sku(
  p_name        := 'Asado de tira',
  p_category_id := '33333333-0000-0000-0000-000000000001',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 1800.00,
  p_sale_price  := NULL,
  p_min_stock   := 5,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'CAR-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CAR-0001');

SELECT create_product_with_sku(
  p_name        := 'Vacío',
  p_category_id := '33333333-0000-0000-0000-000000000001',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 2100.00,
  p_min_stock   := 3,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'CAR-0002'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CAR-0002');

SELECT create_product_with_sku(
  p_name        := 'Bife de chorizo',
  p_category_id := '33333333-0000-0000-0000-000000000001',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 2800.00,
  p_min_stock   := 3,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'CAR-0003'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CAR-0003');

SELECT create_product_with_sku(
  p_name        := 'Hamburguesa 180g',
  p_category_id := '33333333-0000-0000-0000-000000000001',
  p_unit_id     := '22222222-0000-0000-0000-000000000005',
  p_cost_price  := 450.00,
  p_min_stock   := 20,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'CAR-0004'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CAR-0004');

SELECT create_product_with_sku(
  p_name        := 'Lechuga iceberg',
  p_category_id := '33333333-0000-0000-0000-000000000002',
  p_unit_id     := '22222222-0000-0000-0000-000000000005',
  p_cost_price  := 180.00,
  p_min_stock   := 10,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'VER-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'VER-0001');

SELECT create_product_with_sku(
  p_name        := 'Tomate perita',
  p_category_id := '33333333-0000-0000-0000-000000000002',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 350.00,
  p_min_stock   := 5,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'VER-0002'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'VER-0002');

SELECT create_product_with_sku(
  p_name        := 'Cebolla',
  p_category_id := '33333333-0000-0000-0000-000000000002',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 200.00,
  p_min_stock   := 5,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'VER-0003'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'VER-0003');

SELECT create_product_with_sku(
  p_name        := 'Coca-Cola 500mL',
  p_category_id := '33333333-0000-0000-0000-000000000003',
  p_unit_id     := '22222222-0000-0000-0000-000000000009',
  p_cost_price  := 320.00,
  p_min_stock   := 24,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'BEB-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BEB-0001');

SELECT create_product_with_sku(
  p_name        := 'Agua mineral 500mL',
  p_category_id := '33333333-0000-0000-0000-000000000003',
  p_unit_id     := '22222222-0000-0000-0000-000000000008',
  p_cost_price  := 180.00,
  p_min_stock   := 24,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'BEB-0002'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BEB-0002');

SELECT create_product_with_sku(
  p_name        := 'Cerveza Corona 330mL',
  p_category_id := '33333333-0000-0000-0000-000000000003',
  p_unit_id     := '22222222-0000-0000-0000-000000000009',
  p_cost_price  := 420.00,
  p_min_stock   := 24,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'BEB-0003'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BEB-0003');

SELECT create_product_with_sku(
  p_name        := 'Queso cheddar laminado',
  p_category_id := '33333333-0000-0000-0000-000000000004',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 950.00,
  p_min_stock   := 2,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'LAC-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'LAC-0001');

SELECT create_product_with_sku(
  p_name        := 'Pan hamburguesa brioche',
  p_category_id := '33333333-0000-0000-0000-000000000005',
  p_unit_id     := '22222222-0000-0000-0000-000000000005',
  p_cost_price  := 95.00,
  p_min_stock   := 30,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'PAN-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PAN-0001');

SELECT create_product_with_sku(
  p_name        := 'Ketchup Heinz 1L',
  p_category_id := '33333333-0000-0000-0000-000000000006',
  p_unit_id     := '22222222-0000-0000-0000-000000000008',
  p_cost_price  := 780.00,
  p_min_stock   := 3,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'SAL-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SAL-0001');

SELECT create_product_with_sku(
  p_name        := 'Café molido 1kg',
  p_category_id := '33333333-0000-0000-0000-000000000012',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 2800.00,
  p_min_stock   := 2,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'CAF-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CAF-0001');

SELECT create_product_with_sku(
  p_name        := 'Azúcar blanca 1kg',
  p_category_id := '33333333-0000-0000-0000-000000000008',
  p_unit_id     := '22222222-0000-0000-0000-000000000001',
  p_cost_price  := 450.00,
  p_min_stock   := 5,
  p_is_legacy   := TRUE,
  p_legacy_sku  := 'ABA-0001'
) WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'ABA-0001');

-- ── Suppliers ─────────────────────────────────────────────────────────────────

INSERT INTO suppliers (id, code, name, contact, phone, is_active) VALUES
  ('44444444-0000-0000-0000-000000000001', 'PROV-001', 'Frigorífico El Gaucho',    'Juan Pereyra',   '+54 11 4555-0001', TRUE),
  ('44444444-0000-0000-0000-000000000002', 'PROV-002', 'Distribuidora Verde',      'María López',    '+54 11 4555-0002', TRUE),
  ('44444444-0000-0000-0000-000000000003', 'PROV-003', 'Bebidas del Norte S.A.',   'Carlos Ruiz',    '+54 11 4555-0003', TRUE),
  ('44444444-0000-0000-0000-000000000004', 'PROV-004', 'Lácteos San Martín',       'Ana Fernández',  '+54 11 4555-0004', TRUE),
  ('44444444-0000-0000-0000-000000000005', 'PROV-005', 'Panadería Artesanal Gral', 'Pedro Gómez',    '+54 11 4555-0005', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── Update SKU sequences to match seeded products ────────────────────────────
-- After using legacy SKUs, set sequences so next auto-generated won't collide.

UPDATE sku_sequences SET last_sequence = 4  WHERE category_id = '33333333-0000-0000-0000-000000000001'; -- CAR
UPDATE sku_sequences SET last_sequence = 3  WHERE category_id = '33333333-0000-0000-0000-000000000002'; -- VER
UPDATE sku_sequences SET last_sequence = 3  WHERE category_id = '33333333-0000-0000-0000-000000000003'; -- BEB
UPDATE sku_sequences SET last_sequence = 1  WHERE category_id = '33333333-0000-0000-0000-000000000004'; -- LAC
UPDATE sku_sequences SET last_sequence = 1  WHERE category_id = '33333333-0000-0000-0000-000000000005'; -- PAN
UPDATE sku_sequences SET last_sequence = 1  WHERE category_id = '33333333-0000-0000-0000-000000000006'; -- SAL
UPDATE sku_sequences SET last_sequence = 1  WHERE category_id = '33333333-0000-0000-0000-000000000008'; -- ABA
UPDATE sku_sequences SET last_sequence = 1  WHERE category_id = '33333333-0000-0000-0000-000000000012'; -- CAF
