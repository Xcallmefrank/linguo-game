import PlayClient from "./play-client"

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string }>
}) {
  const params = await searchParams
  const challengeCode = params.challenge ?? null

  return <PlayClient challengeCode={challengeCode} />
}