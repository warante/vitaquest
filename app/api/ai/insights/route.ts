import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../../db/client"
import { configuredProfileId } from "../../../../db/config"
import { chatCompletion } from "../../../ai/client"
import { buildHealthSnapshot } from "../../../ai/snapshot"
import { insightsUserPrompt, parseInsightsJson, systemPrompt } from "../../../domain/ai-prompts"
import { detectAnomalies, HEALTH_DISCLAIMER, ruleBasedInsights } from "../../../domain/insights"

export const runtime = "nodejs"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const snapshot = await buildHealthSnapshot(db, profileId)

    const anomalies = detectAnomalies(snapshot)
    let insights = ruleBasedInsights(snapshot)
    let source: "ai" | "rules" = "rules"

    try {
      const model = new URL(request.url).searchParams.get("model") ?? undefined
      const text = await chatCompletion(
        [
          { role: "system", content: systemPrompt() },
          { role: "user", content: insightsUserPrompt(snapshot) },
        ],
        { model },
      )
      const parsed = parseInsightsJson(text).map((item) => ({ ...item, tone: "neutral" as const }))
      if (parsed.length > 0) {
        insights = parsed
        source = "ai"
      }
    } catch {
      // La IA no está disponible; se mantiene el fallback rule-based.
    }

    return NextResponse.json({
      source,
      insights,
      anomalies,
      disclaimer: HEALTH_DISCLAIMER,
    })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron generar los insights" }, { status: 500 })
  }
}
