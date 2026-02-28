import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server.' }, { status: 500 })
    }

    const groq = new Groq({ apiKey })

    const { text } = await req.json()
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Document too short.' }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a legal expert. Analyze this legal document and respond ONLY with valid JSON in this structure:
{
  "title": "document title",
  "documentType": "type of document",
  "summary": "3-5 sentence plain English summary",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "risks": [
    {"level": "high", "title": "risk title", "description": "plain English description"},
    {"level": "medium", "title": "risk title", "description": "plain English description"},
    {"level": "low", "title": "risk title", "description": "plain English description"}
  ],
  "importantDates": ["date 1"],
  "partiesInvolved": ["party 1", "party 2"],
  "recommendation": "practical recommendation"
}
Respond with ONLY the JSON, no markdown, no explanation.

DOCUMENT:
${text.slice(0, 15000)}`
      }],
      temperature: 0.3,
    })

    const responseText = completion.choices[0].message.content || ''
    const clean = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}