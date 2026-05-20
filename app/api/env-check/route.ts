import { NextResponse } from 'next/server'

export const runtime = 'edge'

export function GET() {
  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
  return NextResponse.json({
    hasUrl: Boolean(url),
    preview: url ? `${url.slice(0, 40)}…` : null,
  })
}
