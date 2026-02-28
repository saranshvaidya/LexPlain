# LexPlain — Legal Document Simplifier

A full-stack Next.js app that uses Gemini AI to simplify legal documents into plain English.

## Features

- 📄 **Upload PDFs or TXT files** — Drag & drop or click to browse
- 🧠 **Plain-English Summary** — Understand what the document says without jargon
- ⚠️ **Risk Flags** — Automatically detects high, medium, and low-risk clauses
- 💬 **Q&A Chatbot** — Ask any question about your document
- 🎨 **Beautiful UI** — Parchment-themed, professional design

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini API**
- **pdf-parse** (PDF text extraction)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your API key

Open `.env.local` and replace the placeholder:

```
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

`GEMINI_MODEL` is optional; if omitted, the app defaults to `gemini-2.0-flash`.

Get your API key from: https://aistudio.google.com

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
legal-simplifier/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   ← Summary + risk analysis
│   │   ├── chat/route.ts      ← Q&A chatbot
│   │   └── extract/route.ts   ← PDF text extraction
│   ├── globals.css            ← Styles
│   ├── layout.tsx
│   └── page.tsx               ← Main UI
├── lib/
│   └── extractText.ts         ← Client-side file handling
├── .env.local                 ← API key (DO NOT commit)
├── next.config.js
└── package.json
```

## How it Works

1. User uploads a PDF or TXT legal document
2. Server extracts the text using `pdf-parse`
3. On "Analyze", the text is sent to Gemini with a structured prompt
4. Gemini returns JSON with summary, key points, risk flags, and a recommendation
5. User can then ask follow-up questions via the chat interface

## Deployment

Deploy to Vercel in one click:
1. Push code to GitHub
2. Import repo at vercel.com
3. Add `GEMINI_API_KEY` as an environment variable
4. Deploy!

## Notes

- Documents are processed server-side and not stored anywhere
- Maximum ~15,000 characters of document text are sent to Gemini per analysis
- This app is for educational/informational purposes only — not a substitute for legal advice
