const bannedTerms = [
  "nigger",
  "nigga",
  "negro",
  "frocio",
  "froc",
  "ricchione",
  "terrone",
  "zingaro",
  "zingara",
  "retard",
  "mongolo",
  "mongoloide",
  "spastico",
  "spastica",
  "hitler",
  "nazi",
  "nazista",
  "kkk",
  "fag",
  "slut",
  "whore",
  "rape",
  "rapist",
]

function normalizeNickname(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9]/g, "")
}

export function validateNickname(raw: string) {
  const nickname = raw.trim()

  if (nickname.length < 3) {
    return {
      valid: false,
      message: "Il nickname deve avere almeno 3 caratteri.",
    }
  }

  if (nickname.length > 14) {
    return {
      valid: false,
      message: "Il nickname può avere massimo 14 caratteri.",
    }
  }

  if (!/^[a-zA-Z0-9 _.-]+$/.test(nickname)) {
    return {
      valid: false,
      message: "Usa solo lettere, numeri, spazi e i simboli base.",
    }
  }

  const normalized = normalizeNickname(nickname)
  const hasBanned = bannedTerms.some((term) => normalized.includes(term))

  if (hasBanned) {
    return {
      valid: false,
      message: "Questo nickname non è consentito. Scegline uno rispettoso.",
    }
  }

  return {
    valid: true,
    message: "",
  }
}