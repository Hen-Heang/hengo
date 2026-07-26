import { assertSupabaseConfigured, supabase } from "@/lib/supabase"

// Auth over Supabase. Signup stashes the onboarding answers in user_metadata,
// and ensureProfile() copies them into kori_profiles on the first authenticated
// session — this works whether or not email confirmation is enabled (with
// confirmation on, there is no session at signup, so RLS would block the insert).

export interface RegisterInput {
  email: string
  password: string
  displayName: string
  koreanLevel: string
  country?: string
  nativeLanguage?: string
  occupation?: string
  yearsOfExperience?: number
  learningGoal?: string
}

async function ensureProfile() {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  await supabase.from("kori_profiles").upsert(
    {
      id: user.id,
      display_name: (meta.display_name as string) ?? null,
      korean_level: (meta.korean_level as string) ?? "BEGINNER",
      country: (meta.country as string) ?? null,
      native_language: (meta.native_language as string) ?? null,
      occupation: (meta.occupation as string) ?? null,
      years_of_experience: (meta.years_of_experience as number) ?? null,
      learning_goal: (meta.learning_goal as string) ?? null,
      avatar_url: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  )
}

export const authApi = {
  register: async (input: RegisterInput) => {
    assertSupabaseConfigured()
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          display_name: input.displayName,
          korean_level: input.koreanLevel,
          country: input.country ?? null,
          native_language: input.nativeLanguage ?? null,
          occupation: input.occupation ?? null,
          years_of_experience: input.yearsOfExperience ?? null,
          learning_goal: input.learningGoal ?? null,
        },
      },
    })
    if (error) throw error
    if (data.session) await ensureProfile()
    return {
      userId: data.user?.id ?? null,
      email: input.email,
      // True when Supabase email confirmation is enabled: the user must click
      // the link in their inbox before they can sign in.
      needsEmailConfirmation: !data.session,
    }
  },

  login: async (input: { email: string; password: string }) => {
    assertSupabaseConfigured()
    const { data, error } = await supabase.auth.signInWithPassword(input)
    if (error) throw error
    await ensureProfile()
    return { userId: data.user.id, email: data.user.email ?? input.email }
  },

  // Google Identity Services ID token → Supabase session. The Google provider
  // (with the same client ID) must be enabled under Supabase Auth > Providers.
  loginWithGoogle: async (idToken: string, nonce?: string) => {
    assertSupabaseConfigured()
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce,
    })
    if (error) throw error
    await ensureProfile()
    return { userId: data.user.id, email: data.user.email ?? "" }
  },

  logout: async () => {
    assertSupabaseConfigured()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Sends a reset-password email; the link lands on /reset-password, where
  // Supabase's detectSessionInUrl picks up the recovery token automatically.
  requestPasswordReset: async (email: string) => {
    assertSupabaseConfigured()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  // Called from /reset-password once Supabase has exchanged the recovery
  // link for a session; sets the new password on that session.
  updatePassword: async (newPassword: string) => {
    assertSupabaseConfigured()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}
