'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/schemas'

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email,
        password: data.password,
      })

      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : error.message
        )
        return
      }

      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" required error={errors.email?.message} htmlFor="email">
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="tu@empresa.com"
          leftIcon={<Mail size={15} />}
          error={!!errors.email}
          autoComplete="email"
        />
      </FormField>

      <FormField label="Contraseña" required error={errors.password?.message} htmlFor="password">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          {...register('password')}
          placeholder="••••••••"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="pointer-events-auto text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={!!errors.password}
          autoComplete="current-password"
        />
      </FormField>

      <div className="pt-1">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          loadingText="Ingresando..."
        >
          Ingresar
        </Button>
      </div>
    </form>
  )
}
