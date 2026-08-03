import { generateObject } from "ai"
import { z } from "zod"

import { recoveryCoachInputSchema } from "@/lib/recovery-schemas"
import { AI_PROVIDER_OPTIONS, aiModel, requireUser } from "@/lib/server/ai"

const responseSchema = z.object({
  recognition: z.string(),
  immediateAction: z.string(),
  environmentChange: z.string(),
  goalConnection: z.string(),
  question: z.string().nullable(),
  safetyNote: z.string().nullable(),
})

const RECOVERY_COACH_SYSTEM = `You are Hengo's private, domain-neutral recovery coach.
Help the user identify trigger-action-reward loops, create implementation intentions, practice urge surfing, choose short replacement actions, and reconnect to learning, development, health, work, sleep, or relationships.

Safety and privacy rules:
- Be calm, direct, compassionate, and non-judgmental. Use "slip" and never frame progress as moral worth.
- Never diagnose a medical or psychiatric condition, prescribe medication, or claim to replace professional care.
- Never generate arousing or explicit content, and never ask for explicit descriptions.
- Never use fear, religion, guilt, identity attacks, punishment, fasting, self-harm, extreme exercise, or sleep deprivation as motivation.
- Never claim a normal desire automatically causes physical damage.
- Use only the supplied allowlisted fields. Do not infer private details that are not present.
- If severe impairment or safety concerns are explicitly present, encourage qualified professional support without diagnosing.
- In urge mode, keep every field short and ask no more than one question.

For normal coaching: recognize the situation, give one immediate action, one environment change, and connect it to a larger goal.
For urge mode: one calming sentence, one grounding instruction, one physical environment change, and one five-minute replacement action.`

export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const parsed = recoveryCoachInputSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return Response.json({ error: "Explicit consent and valid coaching fields are required." }, { status: 400 })

  try {
    const approved = {
      mode: parsed.data.mode,
      intensity: parsed.data.intensity,
      emotion: parsed.data.emotion,
      trigger: parsed.data.trigger,
      availableMinutes: parsed.data.availableMinutes,
      largerGoal: parsed.data.largerGoal,
      preferredActions: parsed.data.preferredActions,
    }
    const { object } = await generateObject({
      model: aiModel(),
      providerOptions: AI_PROVIDER_OPTIONS,
      schema: responseSchema,
      system: RECOVERY_COACH_SYSTEM,
      prompt: `Respond to this explicitly approved, minimal context:\n${JSON.stringify(approved)}`,
    })
    return Response.json(object)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Recovery coaching request failed." }, { status: 500 })
  }
}
