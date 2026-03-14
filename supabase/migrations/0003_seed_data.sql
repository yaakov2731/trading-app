-- =============================================================================
-- GastroStock - Seed Data
-- =============================================================================

-- Roles
INSERT INTO roles (name, label, description, permissions) VALUES
('admin',      'Administrador',  'Full system access',                   '{"all": true}'),
('manager',    'Gerente',        'Manage all locations, approve transfers','{"stock": "write", "users": "read", "reports": "read", "export": "write", "products": "write", "transfers": "approve"}'),
('supervisor', 'Supervisor',     'Manage assigned locations',            '{"stock": "write", "reports": "read", "transfers": "write", "physical_count": "write"}'),
('operator',   'Operador',       'Register stock movements',             '{"stock": "write", "movements": "write"}'),
('auditor',    'Auditor',        'Read-only access to all data',         '{"all": "read"}')
ON CONFLICT (name) DO NOTHING;

-- Locations
INSERT INTO locations (code, name, type, color, sort_order) VALUES
('UMO',      'Umo Grill',    'restaurant', '#3b82f6', 1),
('GELATO',   'Puerto Gelato','cafe',        '#f59e0b', 2),
('BROOKLYN', 'Brooklyn',     'restaurant', '#8b5cf6', 3),
('TRENTO',   'Trento Cafe',  'cafe',        '#06b6d4', 4),
('EVENTOS',  'Eventos',      'events',     '#10b981', 5),
('SHOPPING', 'Shopping',     'restaurant', '#f43f5e', 6)
ON CONFLICT (code) DO NOTHING;

-- Units
INSERT INTO units (code, name, symbol, conversion_factor) VALUES
('kg',    'Kilogramo',  'kg',   1),
('g',     'Gramo',      'g',    0.001),
('L',     'Litro',      'L',    1),
('ml',    'Mililitro',  'ml',   0.001),
('u',     'Unidad',     'u',    1),
('caja',  'Caja',       'caja', 1),
('bolsa', 'Bolsa',      'bolsa',1),
('bot',   'Botella',    'bot',  1),
('lata',  'Lata',       'lata', 1),
('paq',   'Paquete',    'paq',  1),
('doc',   'Docena',     'doc',  12),
('rol',   'Rollo',      'rol',  1)
ON CONFLICT (code) DO NOTHING;

-- Set base unit for weight subunits
UPDATE units SET base_unit_id = (SELECT id FROM units WHERE code = 'kg')
WHERE code = 'g';

UPDATE units SET base_unit_id = (SELECT id FROM units WHERE code = 'L')
WHERE code = 'ml';

-- Categories with SKU prefixes
INSERT INTO categories (code, prefix, name, description, color, icon, sort_order) VALUES
('CARNES',    'CAR',  'Carnes',           'Carnes y aves',                '#ef4444', 'beef',        1),
('VERDURAS',  'VER',  'Verduras',         'Verduras y hortalizas',        '#22c55e', 'leaf',        2),
('FRUTAS',    'FRU',  'Frutas',           'Frutas frescas',               '#f97316', 'apple',       3),
('LACTEOS',   'LAC',  'Lácteos',          'Lácteos y quesos',             '#fbbf24', 'milk',        4),
('BEBIDAS',   'BEB',  'Bebidas',          'Bebidas alcohólicas y no alc', '#3b82f6', 'wine',        5),
('LIMPIEZA',  'LIM',  'Limpieza',         'Productos de limpieza',        '#06b6d4', 'sparkles',    6),
('SECOS',     'SEC',  'Secos',            'Abarrotes y secos',            '#a78bfa', 'package',     7),
('CONDIMENT', 'CON',  'Condimentos',      'Especias y condimentos',       '#f59e0b', 'salt',        8),
('PANADERIA', 'PAN',  'Panadería',        'Pan y repostería',             '#d97706', 'croissant',   9),
('HELADOS',   'HEL',  'Helados',          'Helados y postres fríos',      '#ec4899', 'ice-cream',  10),
('DESECH',    'DES',  'Descartables',     'Descartables y empaques',      '#94a3b8', 'trash',      11),
('OTROS',     'OTR',  'Otros',            'Otros productos',              '#64748b', 'box',        12)
ON CONFLICT (code) DO NOTHING;

-- Initialize SKU sequences for all categories
INSERT INTO sku_sequences (category_id, last_sequence)
SELECT id, 0 FROM categories
ON CONFLICT (category_id) DO NOTHING;

-- Sample suppliers
INSERT INTO suppliers (code, name, contact, email, phone) VALUES
('SUP001', 'Frigorífico Central',    'Juan García',   'compras@frigocentral.com', '+54 11 4000-0001'),
('SUP002', 'Distribuidora Norte',    'María López',   'ventas@distnorte.com',     '+54 11 4000-0002'),
('SUP003', 'Vinoteca Premium',       'Carlos Ruiz',   'pedidos@vinoprem.com',     '+54 11 4000-0003'),
('SUP004', 'Verdulería El Campo',    'Ana Martínez',  'info@elcampo.com',         '+54 11 4000-0004'),
('SUP005', 'Limpieza Total SA',      'Pedro Silva',   'ventas@limptotal.com',     '+54 11 4000-0005')
ON CONFLICT (code) DO NOTHING;
