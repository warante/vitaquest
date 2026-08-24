import { NextResponse } from "next/server"
import { z } from "zod"
import { DatabaseConfigurationError, getDatabase } from "../../../../db/client"
import { configuredProfileId } from "../../../../db/config"
import { type ChatMessage, chatCompletion } from "../../../ai/client"
import { buildHealthSnapshot } from "../../../ai/snapshot"
import { chatUserPrompt, systemPrompt } from "../../../domain/ai-prompts"
import { answerFromData, HEALTH_DISCLAIMER } from "../../../domain/insights"

export const runtime = "nodejs"

const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  model: z.string().trim().max(120).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = chatRequestSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const snapshot = await buildHealthSnapshot(db, profileId)

    try {
      const messages: readonly ChatMessage[] = [
        { role: "system", content: systemPrompt() },
        ...(input.history ?? []).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        { role: "user", content: chatUserPrompt(snapshot, input.question) },
      ]
      const answer = await chatCompletion(messages, { model: input.model })
      return NextResponse.json({ answer, source: "ai", disclaimer: HEALTH_DISCLAIMER })
    } catch {
      return NextResponse.json({
        answer: answerFromData(snapshot, input.question),
        source: "rules",
        disclaimer: HEALTH_DISCLAIMER,
      })
    }
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Pregunta no válida" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo responder la pregunta" }, { status: 500 })
  }
}
