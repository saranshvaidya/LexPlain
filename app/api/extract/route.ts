import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.type === 'text/plain') {
      const text = await file.text()
      return NextResponse.json({ text })
    }

    if (file.type === 'application/pdf') {
      const buffer = Buffer.from(await file.arrayBuffer())
      // Dynamically import pdf-parse (server only)
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      return NextResponse.json({ text: data.text })
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Extract error:', error)
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 })
  }
}
