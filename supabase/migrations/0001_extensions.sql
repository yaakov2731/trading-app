-- =============================================================================
-- 0001_extensions.sql
-- Enable required PostgreSQL extensions
-- =============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search (used for product search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Unaccented text search (Spanish support)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Confirm extensions installed
DO $$
BEGIN
  RAISE NOTICE 'Extensions enabled: pgcrypto, uuid-ossp, pg_trgm, unaccent';
END;
$$;
