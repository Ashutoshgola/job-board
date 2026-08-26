export function getGeminiModel(): string {
  return process.env.ATS_GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
}

export function formatGeminiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to parse resume.'
  }

  const raw = error.message.trim()

  if (!raw.startsWith('{')) {
    return raw
  }

  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string }
    }

    if (parsed.error?.message) {
      return parsed.error.message
    }
  } catch {
    // Fall through to raw message.
  }

  return raw
}