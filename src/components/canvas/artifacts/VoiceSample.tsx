import { deriveVoiceSample } from "@/lib/blueprint/voice-sample"

/**
 * A single quoted line showing how the brand's tone and traits read out loud.
 *
 * `bp-artifact`: part of the printed deliverable — never split across a break.
 */
export function VoiceSample({
  title,
  personality,
  toneOfVoice,
}: {
  title: string
  personality: string[]
  toneOfVoice: string
}) {
  return (
    <section className="bp-artifact">
      <p className="mb-2.5 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        Voice sample
      </p>

      <p className="m-0 text-sm leading-[1.6] text-foreground italic">
        {deriveVoiceSample({ title, personality, toneOfVoice })}
      </p>
    </section>
  )
}
