'use client'

import { useRef, useState } from 'react'
import { Download, FileText, Loader2, RefreshCw, Sparkles, Trash2, Upload } from 'lucide-react'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { analyzeResumeATS, type AtsAnalysis } from '@/lib/actions/resume-ats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function resumeLines(analysis: AtsAnalysis) {
  const { resume } = analysis
  const profile = resume.profile
  const lines: string[] = []
  if (profile.full_name) lines.push(profile.full_name)
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin_url, profile.github_url, profile.website_url, profile.portfolio_url].filter(Boolean).join(' | ')
  if (contact) lines.push(contact)
  const summary = profile.professional_summary || [resume.work_experiences[0]?.title, resume.skills.slice(0, 5).join(', ')].filter(Boolean).join(' | ')
  if (summary) lines.push(`PROFESSIONAL SUMMARY\n${summary}`)
  if (resume.skills.length) lines.push(`SKILLS\n${resume.skills.join(' | ')}`)
  if (resume.work_experiences.length) lines.push(`EXPERIENCE\n${resume.work_experiences.map((item) => `${item.title}${item.company ? `, ${item.company}` : ''}${item.start_date || item.end_date ? ` | ${item.start_date || ''} - ${item.is_current ? 'Present' : item.end_date || ''}` : ''}\n${item.responsibilities.map((bullet) => `• ${bullet}`).join('\n')}`).join('\n\n')}`)
  if (resume.projects.length) lines.push(`PROJECTS\n${resume.projects.map((item) => `${item.name}${item.technologies.length ? ` | ${item.technologies.join(', ')}` : ''}\n${item.description || ''}${item.url ? `\n${item.url}` : ''}`).join('\n\n')}`)
  if (resume.education_entries.length) lines.push(`EDUCATION\n${resume.education_entries.map((item) => [item.degree, item.field_of_study, item.institution, item.start_date || item.end_date ? `${item.start_date || ''} - ${item.end_date || ''}` : ''].filter(Boolean).join(' | ')).join('\n')}`)
  if (resume.certifications.length) lines.push(`CERTIFICATIONS\n${resume.certifications.map((item) => [item.name, item.issuer, item.issue_date].filter(Boolean).join(' | ')).join('\n')}`)
  return lines
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function ResumeATSOptimizer() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return
    const extension = nextFile.name.toLowerCase().split('.').pop()
    if (!['pdf', 'docx'].includes(extension || '')) return setError('Only PDF and DOCX files are supported.')
    if (nextFile.size > 10 * 1024 * 1024) return setError('File size must be 10 MB or less.')
    setError(''); setAnalysis(null); setFile(nextFile)
  }

  const analyze = async () => {
    if (!file || !jobDescription.trim()) return
    setError(''); setIsLoading(true); setAnalysis(null)
    const stepTimer = window.setInterval(() => setLoadingStep((step) => Math.min(step + 1, 2)), 1400)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobDescription', jobDescription)
      const result = await analyzeResumeATS(formData)
      if (!result.success) setError(result.error)
      else setAnalysis(result.analysis)
    } catch {
      setError('We could not complete the analysis. Please try again.')
    } finally {
      window.clearInterval(stepTimer); setIsLoading(false); setLoadingStep(0)
    }
  }

  const downloadDocx = async () => {
    if (!analysis) return
    const children = resumeLines(analysis).flatMap((section) => {
      const [heading, ...body] = section.split('\n')
      return [new Paragraph({ text: heading, heading: body.length ? HeadingLevel.HEADING_2 : HeadingLevel.TITLE }), ...body.map((line) => new Paragraph({ children: [new TextRun(line)] }))]
    })
    downloadBlob(await Packer.toBlob(new Document({ sections: [{ children }] })), 'optimized-resume.docx')
  }

  const downloadPdf = async () => {
    if (!analysis) return
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    let page = pdf.addPage()
    let y = page.getHeight() - 48
    for (const line of resumeLines(analysis).flatMap((section) => section.split('\n'))) {
      const isHeading = line === line.toUpperCase() && line.length < 40
      page.drawText(line.replace(/^• /, '- '), { x: 48, y, size: isHeading ? 11 : 9, font, color: rgb(0.08, 0.1, 0.13) })
      y -= isHeading ? 20 : 14
      if (y < 40) { page = pdf.addPage(); y = page.getHeight() - 48 }
    }
    const pdfBytes = await pdf.save()
    downloadBlob(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }), 'optimized-resume.pdf')
  }

  const lines = analysis ? resumeLines(analysis) : []
  const loadingMessages = ['Analyzing your resume...', 'Comparing your resume with the job description...', 'Optimizing your resume...']

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 pb-8">
      <header className="max-w-2xl"><div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-5" /></div><h1 className="text-3xl font-semibold tracking-tight">Resume ATS Optimizer</h1><p className="mt-2 text-sm text-muted-foreground">Tailor your resume to any job description and maximize your ATS compatibility.</p></header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Upload Resume</CardTitle><CardDescription>PDF or DOCX, up to 10 MB</CardDescription></CardHeader><CardContent>
          {file ? <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-4"><FileText className="size-8 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Remove resume" onClick={() => { setFile(null); setAnalysis(null) }}><Trash2 /></Button><Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><RefreshCw /> Replace</Button></div> : <button type="button" className={`flex min-h-48 w-full flex-col items-center justify-center rounded-md border border-dashed p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-muted/30'}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]) }}><Upload className="mb-3 size-7 text-primary" /><span className="text-sm font-medium">Drop your resume here or browse</span><span className="mt-1 text-xs text-muted-foreground">PDF and DOCX files only</span></button>}
          <input ref={inputRef} type="file" hidden accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Job Description</CardTitle><CardDescription>Use the complete description for the most useful comparison.</CardDescription></CardHeader><CardContent><Textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the complete job description here..." className="min-h-48 resize-y" /><div className="mt-2 text-right text-xs tabular-nums text-muted-foreground">{jobDescription.length.toLocaleString()} characters</div></CardContent></Card>
      </div>
      <div className="flex flex-col gap-3"><Button type="button" size="lg" className="w-full sm:w-fit" disabled={!file || !jobDescription.trim() || isLoading} onClick={analyze}>{isLoading ? <><Loader2 className="animate-spin" /> {loadingMessages[loadingStep]}</> : <><Sparkles /> Analyze &amp; Optimize Resume</>}</Button>{error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}</div>
      {analysis && <>
        <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>ATS Compatibility Score</CardTitle><CardDescription>Estimated from the uploaded resume and this job description.</CardDescription></div><div className="text-right"><div className="text-4xl font-semibold tabular-nums text-primary">{analysis.score}<span className="text-xl text-muted-foreground">/100</span></div><div className="mt-1 text-xs font-medium text-emerald-600">ATS Optimized</div></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{analysis.metrics.map((metric) => <div key={metric.label} className="rounded-md border p-3"><div className="flex justify-between gap-2 text-xs"><span>{metric.label}</span><span className="font-medium tabular-nums">{metric.score}%</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${metric.score}%` }} /></div></div>)}</div><div className="mt-6 grid gap-5 md:grid-cols-2"><Insight title="Missing Keywords" items={analysis.missingKeywords} empty="No obvious missing keywords found." /><Insight title="Recommended Improvements" items={analysis.recommendedImprovements} empty="Your resume is well aligned." /><Insight title="Matched Skills" items={analysis.matchedSkills} empty="No exact skill matches found." /><div><h3 className="mb-2 text-sm font-medium">Experience Alignment</h3><p className="text-sm leading-6 text-muted-foreground">{analysis.experienceAlignment}</p></div></div></CardContent></Card>
        <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Optimized Resume</CardTitle><CardDescription>Reorganized from your original resume using ATS-friendly formatting. No new claims were added.</CardDescription></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={downloadPdf}><Download /> PDF</Button><Button type="button" variant="outline" size="sm" onClick={downloadDocx}><Download /> DOCX</Button></div></div></CardHeader><CardContent><article className="mx-auto max-w-3xl border bg-white p-6 text-black shadow-sm sm:p-10">{lines.map((section, index) => { const [heading, ...body] = section.split('\n'); return <section key={`${heading}-${index}`} className="mb-6 last:mb-0"><h2 className={index === 0 && !body.length ? 'mb-2 text-2xl font-bold' : 'mb-2 border-b pb-1 text-sm font-bold tracking-wide'}>{heading}</h2>{body.map((line, index) => (
  <p key={`${line}-${index}`} className="text-sm leading-6">
    {line}
  </p>
))}</section> })}</article></CardContent></Card>
      </>}
    </main>
  )
}

function Insight({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><h3 className="mb-2 text-sm font-medium">{title}</h3>{items.length ? <ul className="space-y-1 text-sm text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><span className="text-primary">•</span><span>{item}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}</div>
}
