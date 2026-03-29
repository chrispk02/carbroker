'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

function ResetPasswordForm() {
  const { locale, dictionary: t } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Exchange code for session if present (PKCE flow)
    const code = searchParams.get('code')
    const supabase = createClient()
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message)
        else setSessionReady(true)
      })
    } else {
      // Session may already be set via auth state change
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true)
        else setError(locale === 'vi' ? 'Link không hợp lệ hoặc đã hết hạn.' : 'Invalid or expired link.')
      })
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError(t.auth.passwordMismatch)
      return
    }
    setError(null)
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setIsLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push(`/${locale}`), 3000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href={`/${locale}`} className="text-xl font-bold text-foreground">CarBroker</Link>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{t.auth.passwordUpdated}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === 'vi' ? 'Đang chuyển hướng về trang chủ...' : 'Redirecting to home...'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t.auth.newPassword}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === 'vi' ? 'Nhập mật khẩu mới cho tài khoản của bạn' : 'Enter a new password for your account'}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
              )}

              {sessionReady ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field>
                    <FieldLabel>{t.auth.newPassword}</FieldLabel>
                    <Input
                      type="password"
                      placeholder={t.auth.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      autoFocus
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t.auth.confirmPassword}</FieldLabel>
                    <Input
                      type="password"
                      placeholder={t.auth.passwordPlaceholder}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      minLength={6}
                      required
                    />
                  </Field>
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <><KeyRound className="mr-2 size-4 animate-spin" />{t.common.loading}</>
                    ) : t.auth.updatePassword}
                  </Button>
                </form>
              ) : !error ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {t.common.loading}...
                </div>
              ) : null}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href={`/${locale}/auth`} className="font-medium text-accent hover:underline">
                  {t.auth.backToSignIn}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
