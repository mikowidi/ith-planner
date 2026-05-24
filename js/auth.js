import { supabase } from './supabase.js'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = 'index.html'
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    window.location.href = 'index.html'
    return null
  }
  return session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function upsertProfile(userId, name, avatarColor) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, avatar_color: avatarColor })
  if (error) throw error
}

export async function inviteUser(email) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email)
  if (error) throw error
  return data
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  if (error) return []
  return data
}
