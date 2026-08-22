import { NextResponse } from "next/server"

export function GET(): NextResponse<{ readonly status: "ok"; readonly service: "vitaquest" }> {
  return NextResponse.json({ status: "ok", service: "vitaquest" })
}
