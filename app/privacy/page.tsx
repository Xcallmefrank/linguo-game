"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"

export default function PrivacyPage() {
  const router = useRouter()
  const { t, locale } = useLocale()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    router.push("/")
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-10">
        <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="space-y-6 text-zinc-200">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {t("privacy.title")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {t("privacy.heading")}
              </h1>
            </div>

            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              {locale === "it" ? (
                <>
                  <p>
                    Linguo è un gioco web che permette di riconoscere lingue,
                    salvare punteggi e creare sfide condivisibili.
                  </p>

                  <p>
                    Alcuni dati tecnici e di utilizzo possono essere trattati per il
                    corretto funzionamento del sito, per misurare l’utilizzo del
                    servizio e per la pubblicazione di annunci pubblicitari.
                  </p>

                  <p>
                    Gli annunci possono essere forniti da Google AdSense. Le scelte
                    relative al consenso possono essere gestite tramite il link
                    “Gestisci consenso” disponibile nel footer del sito.
                  </p>

                  <p>
                    Le informazioni inserite nel gioco, come nickname, punteggi e
                    dati di sfida, possono essere salvate per consentire il
                    confronto tra utenti e la condivisione dei risultati.
                  </p>

                  <p>
                    Per richieste relative a privacy o contenuti, aggiungi qui il
                    tuo indirizzo email di contatto quando vuoi rendere questa
                    pagina definitiva.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Linguo is a web game that lets players recognize languages,
                    save scores, and create shareable challenges.
                  </p>

                  <p>
                    Some technical and usage data may be processed to ensure the
                    website works correctly, measure service usage, and display
                    advertising.
                  </p>

                  <p>
                    Ads may be provided through Google AdSense. Consent choices
                    can be managed through the “Manage consent” link available in
                    the site footer.
                  </p>

                  <p>
                    Information entered in the game, such as nicknames, scores,
                    and challenge data, may be stored to enable user comparison
                    and result sharing.
                  </p>

                  <p>
                    
                  
                  </p>
                </>
              )}
            </div>

            <div className="pt-2">
              <Button
                onClick={handleBack}
                className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
              >
                {t("privacy.back")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}