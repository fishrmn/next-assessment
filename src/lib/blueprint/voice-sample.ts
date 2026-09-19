/**
 * Builds the "sample line" shown under Voice & Personality: a quoted,
 * first-person example of how the brand's tone of voice reads in practice.
 */
export function deriveVoiceSample(input: {
  title: string
  personality: string[]
  toneOfVoice: string
}): string {
  const { title, personality, toneOfVoice } = input
  const tone = toneOfVoice.trim()

  if (!tone) {
    return "Fill in tone of voice and a sample line will set here."
  }

  const traits = personality.slice(0, 2).join(" and ").toLowerCase()
  const strippedTone = tone.replace(/\.$/, "")

  return `“${title || "We"} — ${traits ? traits + ", " : ""}${strippedTone}.”`
}
