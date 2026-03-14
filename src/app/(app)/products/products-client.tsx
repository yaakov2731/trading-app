'use client'

import * as React from 'react'
import { Plus, Search, Package, Tag, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button, SaveButton, CancelButton } from '@/components/ui/button'
import { Input, FormField, NumberInput, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty } from '@/components/ui/table'
import { createProduct, updateProduct, deactivateProduct } from '@/server/actions/products'
import { createProductSchema, type CreateProductInput } from '@/lib/schemas'
import type { Product, Category, Unit } from '@/lib/types'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'

interface ProductsPageClientProps {
  initialProducts: Product[]
  categories:      Category[]
  units:           Unit[]
}

export function ProductsPageClient({ initialProducts, categories, units }: ProductsPageClientProps) {
  const [products, setProducts]     = React.useState<Product[]>(initialProducts)
  const [query,    setQuery]        = React.useState('')
  const [catFilter, setCatFilter]   = React.useState('all')
  const [showInactive, setShowInactive] = React.useState(false)
  const [formOpen, setFormOpen]     = React.useState(false)
  const [editProduct, setEditProduct] = React.useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { min_stock: 0 },
  })

  const filtered = React.useMemo(() => {
    let result = products

    if (!showInactive) result = result.filter(p => p.is_active)
    if (catFilter !== 'all') result = result.filter(p => p.category_id === catFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      )
    }

    return result
  }, [products, showInactive, catFilter, query])

  function openCreate() {
    setEditProduct(null)
    reset({ min_stock: 0 })
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    reset({
      name:        product.name,
      category_id: product.category_id,
      unit_id:     product.unit_id,
      description: product.description ?? undefined,
      cost_price:  product.cost_price ?? undefined,
      sale_price:  product.sale_price ?? undefined,
      min_stock:   product.min_stock,
      barcode:     product.barcode ?? undefined,
      notes:       product.notes ?? undefined,
    })
    setFormOpen(true)
  }

  async function onSubmit(data: CreateProductInput) {
    setIsSubmitting(true)
    try {
      if (editProduct) {
        const result = await updateProduct(editProduct.id, data)
        if (!result.success) { toast.error(result.error!); return }
        setProducts(prev => prev.map(p => p.id === editProduct.id ? result.data! : p))
        toast.success('Producto actualizado')
      } else {
        const result = await createProduct(data)
        if (!result.success) { toast.error(result.error!); return }
        setProducts(prev => [result.data!, ...prev])
        toast.success(`Producto creado — SKU: ${result.data!.sku}`)
      }
      setFormOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(product: Product) {
    if (!product.is_active) return  // re-activate not implemented in demo
    const result = await deactivateProduct(product.id)
    if (!result.success) { toast.error(result.error!); return }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: false } : p))
    toast.success('Producto desactivado')
  }

  return (
    <div className="space-y-5">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU..."
            className="pl-9 h-9"
          />
        </div>

        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded border-slate-300"
          />
          Ver inactivos
        </label>

        <Button variant="primary" size="sm" onClick={openCreate} leftIcon={<Plus size={15} />}>
          Nuevo producto
        </Button>
      </div>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      <p className="text-sm text-slate-500">
        {filtered.length} productos
        {catFilter !== 'all' && ` en ${categories.find(c => c.id === catFilter)?.name}`}
      </p>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Stock Mín.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty
                icon={<Package size={28} />}
                title="Sin productos"
                description="Creá el primer producto para comenzar"
                action={<Button variant="primary" size="sm" onClick={openCreate}>Crear producto</Button>}
                colSpan={8}
              />
            ) : (
              filtered.map(product => (
                <TableRow key={product.id} className={!product.is_active ? 'opacity-50' : undefined}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {product.sku}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: product.category.color }}
                        />
                        <span className="text-xs text-slate-600">{product.category.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">{product.unit?.symbol}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.cost_price ? formatCurrency(product.cost_price) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {product.min_stock}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'success' : 'default'} size="sm">
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {product.is_legacy && (
                      <Badge variant="info" size="sm" className="ml-1.5">Legacy</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(product)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </Button>
                      {product.is_active && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleActive(product)}
                          title="Desactivar"
                          className="text-slate-400 hover:text-danger-600"
                        >
                          <ToggleLeft size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Create / Edit form dialog ─────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? `Editar — ${editProduct.name}` : 'Nuevo Producto'}
            </DialogTitle>
            {editProduct && (
              <p className="text-xs text-slate-400 font-mono mt-1">SKU: {editProduct.sku}</p>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Nombre" required error={errors.name?.message} className="sm:col-span-2">
                  <Input {...register('name')} placeholder="Nombre del producto" error={!!errors.name} />
                </FormField>

                <FormField label="Categoría" required error={errors.category_id?.message}>
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger error={!!errors.category_id}>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name} ({c.prefix})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Unidad de medida" required error={errors.unit_id?.message}>
                  <Controller
                    name="unit_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger error={!!errors.unit_id}>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Costo unitario" hint="Para valorización de inventario">
                  <Controller
                    name="cost_price"
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        {...field}
                        value={field.value ?? ''}
                        onChange={v => field.onChange(v === '' ? undefined : v)}
                        min={0}
                        step={0.01}
                        placeholder="$0.00"
                      />
                    )}
                  />
                </FormField>

                <FormField label="Stock mínimo" hint="Para alertas de stock bajo">
                  <Controller
                    name="min_stock"
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        {...field}
                        value={field.value ?? 0}
                        onChange={v => field.onChange(v === '' ? 0 : v)}
                        min={0}
                        step={0.001}
                        placeholder="0"
                      />
                    )}
                  />
                </FormField>

                <FormField label="Código de barras" className="sm:col-span-2">
                  <Input {...register('barcode')} placeholder="ISBN / EAN / código interno" />
                </FormField>

                <FormField label="Descripción" className="sm:col-span-2">
                  <Textarea {...register('description')} placeholder="Descripción opcional..." rows={2} />
                </FormField>

                <FormField label="Notas internas" className="sm:col-span-2">
                  <Textarea {...register('notes')} placeholder="Notas de uso interno..." rows={2} />
                </FormField>
              </div>

              {!editProduct && (
                <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
                  <p className="text-xs text-brand-700 font-medium">
                    El SKU se generará automáticamente según la categoría seleccionada.
                  </p>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <CancelButton onClick={() => setFormOpen(false)} />
              <SaveButton type="submit" loading={isSubmitting}>
                {editProduct ? 'Guardar cambios' : 'Crear producto'}
              </SaveButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
