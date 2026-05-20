import { NextResponse } from 'next/server'

export const runtime = 'edge'

export function GET() {
  const url =
    process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbyTb4ofWovg7nlXj50uDdCxj3hoDpHhppOm2Z8x37WihBJYZKYr_zvQ-o-hCeKGzVwF/exec'
  return NextResponse.json({
    hasUrl: Boolean(url),
    preview: url ? `${url.slice(0, 40)}…` : null,
  })
}
