# Deployment Guide — Inventory System MVP

## Environment Variables

Create `.env.local` for local development and set these in your hosting provider for production:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## Database Setup

### 1. Run migrations in order

```bash
# Via Supabase CLI
supabase db push

# Or manually via SQL editor in Supabase dashboard
# Run files in supabase/migrations/ in numeric order:
# 0001_base.sql → 0002_... → ... → 0009_triggers.sql
```

### 2. Additional tables needed for Batch 6-8 features

Run the following in your Supabase SQL editor:

```sql
-- Opening balance candidates
CREATE TABLE migration_opening_balance_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id UUID NOT NULL REFERENCES migration_import_runs(id),
  import_row_id UUID REFERENCES migration_import_rows(id),
  sku TEXT,
  product_name TEXT,
  matched_product_id UUID REFERENCES products(id),
  location_raw TEXT,
  matched_location_id UUID REFERENCES locations(id),
  quantity NUMERIC NOT NULL,
  unit_raw TEXT,
  matched_unit_id UUID REFERENCES units(id),
  snapshot_datetime TIMESTAMPTZ,
  confidence TEXT NOT NULL DEFAULT 'unresolved',
  status TEXT NOT NULL DEFAULT 'pending',
  override_quantity NUMERIC,
  override_product_id UUID REFERENCES products(id),
  override_location_id UUID REFERENCES locations(id),
  notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cutover audit log
CREATE TABLE migration_cutover_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dry_run BOOLEAN NOT NULL DEFAULT FALSE,
  applied_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  result_summary JSONB
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  target_table TEXT,
  target_id UUID,
  location_id UUID REFERENCES locations(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE migration_opening_balance_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_cutover_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins access opening balances" ON migration_opening_balance_candidates
  USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "Admins access cutover log" ON migration_cutover_log
  USING (auth_user_role() = 'admin');
CREATE POLICY "Admins access audit logs" ON audit_logs
  USING (auth_user_role() IN ('admin', 'supervisor'));
```

### 3. Seed data

```bash
supabase db seed
# Or run: supabase/seed.sql in the SQL editor
```

---

## Auth Setup

1. In Supabase Dashboard → Auth → Settings:
   - Enable Email/Password auth
   - Set Site URL to your production domain
   - Configure Redirect URLs

2. Create the first admin user:
```sql
-- After user signs up via the auth form, promote them to admin:
UPDATE users SET role = 'admin' WHERE email = 'admin@yourcompany.com';
```

3. The `handle_new_auth_user()` trigger automatically creates a `users` record on signup.

---

## Build & Run

### Local development
```bash
pnpm install
pnpm dev
# App runs on http://localhost:3000
```

### Production build
```bash
pnpm build
pnpm start
```

### With Docker (optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Deployment Checklist

### Pre-deploy
- [ ] All environment variables set in hosting provider
- [ ] Database migrations ran successfully
- [ ] Seed data loaded
- [ ] First admin user created and promoted
- [ ] Supabase RLS policies active
- [ ] Auth redirect URLs configured

### Deploy steps (Vercel/Railway/Fly.io)
1. Connect git repository
2. Set environment variables
3. Deploy `main` branch
4. Run DB migrations if not auto-run

### Post-deploy smoke checks
- [ ] Can log in with admin account
- [ ] Dashboard loads without errors
- [ ] Products page shows seed products
- [ ] Can create a test purchase
- [ ] Stock updates after purchase receive
- [ ] No console errors in production

---

## Performance Notes

- Supabase connection pooling: use `pgbouncer` mode for high traffic
- Enable Supabase CDN for assets
- Next.js static pages: dashboard KPIs cache for 60s (ISR)
- Large product imports: chunked 200 rows at a time to avoid request limits
- Movements export: paginated to avoid memory issues on large datasets

---

## Monitoring

- Monitor Supabase logs for slow queries
- Set up alerts for auth errors (Supabase Dashboard → Auth → Logs)
- Use Vercel Analytics or equivalent for page performance
- Check `audit_logs` table for unusual activity patterns
