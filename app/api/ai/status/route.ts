import { NextResponse } from "next/server"
import { AI_BASE_URL, getAiConfig, isAiConfigured } from "../../../ai/client"
import { AI_TEMPERATURE } from "../../../domain/ai-models"

export const runtime = "nodejs"

export async function GET(): Promise<NextResponse> {
  const config = getAiConfig()
  return NextResponse.json({
    configured: isAiConfigured(config),
    model: config.model,
    endpoint: AI_BASE_URL,
    temperature: AI_TEMPERATURE,
  })
}
