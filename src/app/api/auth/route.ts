import { NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_session'
const MAX_AGE = 8 * 60 * 60 // 8h

export async function POST(req: Request) {
  const { password } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    sameSite: 'lax',
    path: '/',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}
