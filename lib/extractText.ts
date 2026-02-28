// Extracts text from a PDF File object on the client side
// by reading it as base64 and sending to a simple text approach.
// For production, use pdf-parse on the server side.

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text()
  }

  if (file.type === 'application/pdf') {
    // We'll send the PDF to a server endpoint for extraction
    // For now, return a signal to handle it server-side
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/extract', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Failed to extract PDF text')
    const data = await res.json()
    return data.text
  }

  throw new Error('Unsupported file type. Please upload a PDF or TXT file.')
}
