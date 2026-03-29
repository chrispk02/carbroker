"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export interface User {
  id: string
  name: string
  email: string
  role: "buyer" | "seller"
  avatar?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (
    name: string,
    email: string,
    password: string,
    role: "buyer" | "seller"
  ) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>
  sendPhoneOtp: (phone: string) => Promise<{ error: string | null }>
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>
  sendLoginOtp: (phone: string) => Promise<{ error: string | null }>
  verifyLoginOtp: (phone: string, token: string) => Promise<{ error: string | null }>
  sendPasswordReset: (email: string, locale: string) => Promise<{ error: string | null }>
  loginWithGoogle: (locale: string, returnUrl?: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    name:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.email?.split("@")[0] ||
      "Người dùng",
    email: supabaseUser.email ?? "",
    role: supabaseUser.user_metadata?.role ?? "buyer",
    avatar: supabaseUser.user_metadata?.avatar_url,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { error: "Email hoặc mật khẩu không đúng" }
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: "Vui lòng xác nhận email trước khi đăng nhập" }
        }
        return { error: error.message }
      }
      return { error: null }
    },
    [supabase]
  )

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "buyer" | "seller"
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        if (error.message.includes("already registered")) {
          return { error: "Email này đã được đăng ký" }
        }
        if (error.message.includes("Password should be")) {
          return { error: "Mật khẩu phải có ít nhất 6 ký tự" }
        }
        return { error: error.message }
      }
      return { error: null }
    },
    [supabase]
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const resendConfirmationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) return { error: error.message }
    return { error: null }
  }, [supabase])

  const sendPhoneOtp = useCallback(async (phone: string) => {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Không thể gửi OTP' }
    return { error: null }
  }, [])

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: token, loginMode: false }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Mã OTP không đúng' }
    return { error: null }
  }, [])

  const sendLoginOtp = useCallback(async (phone: string) => {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Không thể gửi OTP' }
    return { error: null }
  }, [])

  const sendPasswordReset = useCallback(async (email: string, locale: string) => {
    const redirectTo = `${window.location.origin}/auth/callback?next=/${locale}/auth/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) return { error: error.message }
    return { error: null }
  }, [supabase])

  const loginWithGoogle = useCallback(async (locale: string, returnUrl?: string) => {
    const next = returnUrl || `/${locale}`
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [supabase])

  const verifyLoginOtp = useCallback(async (phone: string, token: string) => {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: token, loginMode: true }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Mã OTP không đúng' }

    // Exchange token_hash lấy Supabase session
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'magiclink',
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [supabase])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        resendConfirmationEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendLoginOtp,
        verifyLoginOtp,
        sendPasswordReset,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
