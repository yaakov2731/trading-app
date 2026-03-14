# UI Polish Guide — Inventory System MVP

## What Was Added in Batch 9

### Shared UI Primitives (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `PageHeader` | Consistent page titles with back nav and action slots |
| `SectionCard` | Content cards with optional header/footer |
| `FilterBar` | Wraps filter controls with consistent styling |
| `StatusPill` | Semantic status badges with colour variants |
| `DataToolbar` | Count display + export link above data tables |
| `ResponsiveTableShell` | Card shell for desktop table + mobile list split |
| `MobileActionBar` | Sticky bottom action bar for mobile create flows |
| `FormSection` | Groupped form sections with titles |
| `FormField` | Label + error + hint wrapper for form inputs |
| `AppBreadcrumbs` | Lightweight breadcrumb navigation |
| `SearchInput` | Debounced search with clear button |
| `EmptyListState` | Consistent empty states in card context |
| `InlineStat` | Compact KPI card for grid layouts |

### Polish Components (`components/polish/`)

| Component | Purpose |
|-----------|---------|
| `GlobalCommandBar` | Cmd+K quick search and navigation |
| `LocationSwitcher` | Location context dropdown for nav bar |
| `QuickCreateMenu` | + button with quick create shortcuts |
| `AppFooterMeta` | Footer with version, role, and keyboard hints |

### Hooks (`hooks/`)

| Hook | Purpose |
|------|---------|
| `useDebouncedValue` | Debounce any value with configurable delay |
| `useIsMobile` | Viewport breakpoint detection |
| `useLocationContext` | Client-side location selection state |
| `usePageFilters` | URL-driven filter management with Next.js router |

### Utilities (`lib/utils/`)

| File | Purpose |
|------|---------|
| `formatting.ts` | Quantities, currency, percentages, signed values |
| `dates.ts` | Argentine locale date/time formatting, ISO helpers |
| `number.ts` | Safe parsing, rounding, stock status classification |
| `query-keys.ts` | Typed query key factories for all data entities |
| `cn.ts` | Lightweight class name merger |

### Server Helpers (`lib/server/`)

| File | Purpose |
|------|---------|
| `performance.ts` | Query timing, chunking, parallel runners |
| `cache-helpers.ts` | Next.js unstable_cache wrappers + revalidation tags |
| `fetch-optimizations.ts` | Batch fetches, ID maps, lean movement queries |

### Route Loading States

All major routes now have `loading.tsx` skeleton files:
- `/dashboard/loading.tsx`
- `/products/loading.tsx`
- `/history/loading.tsx`
- `/purchases/loading.tsx`
- `/counts/loading.tsx`
- `/transfers/loading.tsx`
- `/reports/loading.tsx`
- `/exports/loading.tsx`

---

## Visual Consistency Rules

### Colour Semantics

| Use | Colour |
|-----|--------|
| Success / positive | `emerald-400` |
| Warning / review | `amber-400` |
| Error / critical | `red-400` |
| Info / neutral | `blue-400` |
| Brand actions | `brand-500` |
| Muted content | `slate-400` to `slate-600` |

### Corner Radius

| Element | Radius |
|---------|--------|
| Cards | `rounded-2xl` |
| Inputs | `rounded-xl` |
| Buttons | `rounded-xl` |
| Pills / badges | `rounded-lg` |
| Small chips | `rounded-lg` |

### Spacing

| Context | Spacing |
|---------|---------|
| Page outer padding | `px-4 sm:px-6 py-8` |
| Section spacing | `space-y-6` |
| Card padding | `p-5` or `p-6` |
| Table row padding | `px-4 py-3` |
| Form field gap | `space-y-4` |

### Typography

| Element | Style |
|---------|-------|
| Page titles | `text-xl sm:text-2xl font-bold text-white` |
| Section titles | `font-semibold text-white text-sm sm:text-base` |
| Body text | `text-sm text-slate-300` |
| Labels | `text-sm font-medium text-slate-300` |
| Captions | `text-xs text-slate-500` |
| Monospace (SKU) | `font-mono text-brand-400` |

---

## What Still Needs Refinement

- [ ] Chart library integration for `reports/` pages (currently scaffolded)
- [ ] Global command bar keyboard navigation (↑↓ key handling)
- [ ] Toast position on mobile (consider top-right vs bottom-right)
- [ ] Transfer and count pages could use `MobileActionBar`
- [ ] Location switcher should sync to URL param on change
- [ ] Print stylesheet for purchase receipts / count sheets
- [ ] Dark/light mode toggle (currently dark-only)

---

## UX Principles

1. **Mobile-first:** All pages must be usable one-handed on a phone.
2. **Action clarity:** Primary actions use 3D brand buttons; secondary are ghost/outline.
3. **Scan-friendly:** Status pills and SKU codes must be immediately readable.
4. **Loading clarity:** Every async section shows a skeleton, never a blank space.
5. **Error clarity:** Errors show beside the offending field, not in a generic alert.
6. **Calm:** Avoid flashy animations. Prefer subtle transitions (200-300ms).
7. **Operational:** The app is used during busy kitchen/storeroom operations. Fast taps, big touch targets.
