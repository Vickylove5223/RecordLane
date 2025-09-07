import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

export interface AuthResponse {
  user: AuthUser | null
  session: Session | null
  error?: AuthError | null
}

export interface SignUpRequest {
  email: string
  password: string
  metadata?: Record<string, any>
}

export interface SignInRequest {
  email: string
  password: string
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error.message)
    return null
  }

  return user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata
  } : null
}

// Get current session
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting current session:', error.message)
    return null
  }

  return session
}

// Sign up with email and password
export async function signUp({ email, password, metadata }: SignUpRequest): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })

  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata
    } : null,
    session: data.session,
    error
  }
}

// Sign in with email and password
export async function signIn({ email, password }: SignInRequest): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata
    } : null,
    session: data.session,
    error
  }
}

// Sign out
export async function signOut(): Promise<{ error?: AuthError | null }> {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<{ error?: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { error }
}

// Sign in with GitHub
export async function signInWithGitHub(): Promise<{ error?: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { error }
}

// Reset password
export async function resetPassword(email: string): Promise<{ error?: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
  return { error }
}

// Update password
export async function updatePassword(password: string): Promise<{ error?: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({
    password
  })
  return { error }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

