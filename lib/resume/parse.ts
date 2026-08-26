import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { getGeminiModel } from '@/lib/resume/config'
import { parsedResumeSchema, type ParsedResume } from '@/lib/resume/schema'

const resumeJsonSchema = z.toJSONSchema(parsedResumeSchema)

export async function parseResume(
  file: Buffer,
  mimeType: string
): Promise<ParsedResume> {
  const apiKey = process.env.ATS_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('ATS_GEMINI_API_KEY is not configured')
  }

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: [
      {
        text: `Extract all important information from this resume and return structured JSON.
Include: profile/contact info, professional summary, skills, work experience (with responsibilities as bullet points),
education, projects, certifications, and any other relevant links.
Use empty strings or null for missing fields. Preserve date formats as written on the resume.`,
      },
      {
        inlineData: {
          mimeType,
          data: file.toString('base64'),
        },
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: resumeJsonSchema,
    },
  })

  const text = response.text
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  const json = JSON.parse(text)
  return parsedResumeSchema.parse(json)
}
