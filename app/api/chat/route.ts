import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server.' }, { status: 500 })
    }

    const groq = new Groq({ apiKey })

    const { question, documentText, history } = await req.json()
    if (!question || !documentText) {
      return NextResponse.json({ error: 'Question and document required.' }, { status: 400 })
    }

    const messages = [
      {
        role: 'system' as const,
        content: `You are a friendly legal assistant. Answer questions about this document in plain English.\n\nDOCUMENT:\n${documentText.slice(0, 12000)}`
      },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: question }
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.5,
    })

    const answer = completion.choices[0].message.content
    return NextResponse.json({ answer })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}