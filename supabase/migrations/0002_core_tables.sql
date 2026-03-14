-- =============================================================================
-- 0002_core_tables.sql
-- Roles, users, locations, categories, units
-- =============================================================================

-- ── Roles ─────────────────────────────────────────────────────────────────────

CREATE TABLE roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  label       TEXT        NOT NULL,
  description TEXT,
  permissions JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT roles_name_check CHECK (name IN ('admin','supervisor','encargado','read_only'))
);

-- ── Users ─────────────────────────────────────────────────────────────────────
-- Mirrors auth.users — synced via trigger

CREATE TABLE users (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT        NOT NULL UNIQUE,
  full_name      TEXT        NOT NULL DEFAULT '',
  role           TEXT        NOT NULL DEFAULT 'encargado',
  avatar_url     TEXT,
  phone          TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_role_fk FOREIGN KEY (role) REFERENCES roles(name)
);

-- ── Locations ─────────────────────────────────────────────────────────────────

CREATE TABLE locations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'restaurant',
  address     TEXT,
  phone       TEXT,
  timezone    TEXT        NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  color       TEXT        NOT NULL DEFAULT '#3b82f6',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INT         NOT NULL DEFAULT 0,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT locations_type_check CHECK (
    type IN ('restaurant','cafe','bar','events','warehouse','other')
  ),
  CONSTRAINT locations_color_check CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);

-- ── User ↔ Location assignments ───────────────────────────────────────────────

CREATE TABLE user_locations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'encargado',
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_locations_unique UNIQUE (user_id, location_id),
  CONSTRAINT user_locations_role_fk FOREIGN KEY (role) REFERENCES roles(name)
);

-- ── Categories ────────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  prefix      TEXT        NOT NULL UNIQUE,           -- CAR, VER, BEB …
  name        TEXT        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT '#64748b',
  icon        TEXT        NOT NULL DEFAULT 'package',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_prefix_check CHECK (prefix ~ '^[A-Z]{2,5}$'),
  CONSTRAINT categories_color_check  CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);

-- ── Units of measure ──────────────────────────────────────────────────────────

CREATE TABLE units (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT        NOT NULL UNIQUE,
  name              TEXT        NOT NULL,
  symbol            TEXT        NOT NULL,
  base_unit_id      UUID        REFERENCES units(id),
  conversion_factor NUMERIC(12,6) NOT NULL DEFAULT 1,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT units_conversion_positive CHECK (conversion_factor > 0)
);
