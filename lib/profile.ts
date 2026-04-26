import { supabase } from "@/lib/supabase"

export type Profile = {
  id: string
  nickname: string
  country_code: string
  created_at?: string
  updated_at?: string
}

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as Profile | null
}

export async function isNicknameAvailable(nickname: string, userId?: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("nickname", nickname.trim())
    .maybeSingle()

  if (error) throw error

  if (!data) return true
  if (userId && data.id === userId) return true

  return false
}

export async function createMyProfile(input: {
  userId: string
  nickname: string
  countryCode: string
}) {
  const { error } = await supabase.from("profiles").insert({
    id: input.userId,
    nickname: input.nickname.trim(),
    country_code: input.countryCode,
  })

  if (error) throw error
}

export async function updateMyProfile(input: {
  userId: string
  nickname: string
  countryCode: string
}) {
  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: input.nickname.trim(),
      country_code: input.countryCode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)

  if (error) throw error
}