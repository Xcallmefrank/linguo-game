import { ImageResponse } from "next/og"
import { supabase } from "@/lib/supabase"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

type ChallengeOgRow = {
  creator_name: string
  creator_score: number
  total_questions: number
}

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const { data } = await supabase
    .from("challenges")
    .select("creator_name, creator_score, total_questions")
    .eq("share_code", code)
    .single<ChallengeOgRow>()

  const creatorName = data?.creator_name ?? "Un giocatore"
  const creatorScore = data?.creator_score ?? 0
  const totalQuestions = data?.total_questions ?? 10

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at top, rgba(34,197,94,0.18), transparent 28%), linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: "64px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.14,
            display: "flex",
            flexWrap: "wrap",
            alignContent: "space-between",
            justifyContent: "space-between",
            padding: "40px 56px",
            color: "#22c55e",
            fontSize: 42,
          }}
        >
          <span>字</span>
          <span>Ж</span>
          <span>あ</span>
          <span>ع</span>
          <span>한</span>
          <span>語</span>
          <span>Б</span>
          <span>ナ</span>
          <span>م</span>
          <span>글</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 40,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(18px)",
            padding: "56px",
            boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(34,197,94,0.24), #000)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 12px 35px rgba(34,197,94,0.18)",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              L
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: 6,
                }}
              >
                challenge
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 700,
                }}
              >
                Linguo
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.05,
              }}
            >
              {creatorName} ha fatto {creatorScore}/{totalQuestions}
            </div>

            <div
              style={{
                fontSize: 30,
                color: "#d4d4d8",
              }}
            >
              Riuscirai a batterlo?
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 24,
              color: "#a1a1aa",
            }}
          >
            <span>Riconosci la lingua. Batti i tuoi amici.</span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>linguo</span>
          </div>
        </div>
      </div>
    ),
    size
  )
}