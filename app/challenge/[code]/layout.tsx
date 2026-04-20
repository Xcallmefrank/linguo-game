import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"

type ChallengeMetaRow = {
  creator_name: string
  creator_score: number
  total_questions: number
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params

  const { data } = await supabase
    .from("challenges")
    .select("creator_name, creator_score, total_questions")
    .eq("share_code", code)
    .single<ChallengeMetaRow>()

  const creatorName = data?.creator_name ?? "Un giocatore"
  const creatorScore = data?.creator_score ?? 0
  const totalQuestions = data?.total_questions ?? 10

  const title = `${creatorName} ha fatto ${creatorScore}/${totalQuestions} su Linguo`
  const description = "Riuscirai a batterlo? Apri la challenge e scoprilo."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}