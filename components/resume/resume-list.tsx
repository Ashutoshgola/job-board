'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  deleteResume,
  getResumeDownloadUrl,
} from '@/lib/actions/resume'
import type { Tables } from '@/lib/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ResumeUpload } from '@/components/resume/resume-upload'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ResumeList({ resumes }: { resumes: Tables<'resumes'>[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDownload = (resumeId: string) => {
    startTransition(async () => {
      const { url, error } = await getResumeDownloadUrl(resumeId)
      if (error || !url) return
      window.open(url, '_blank')
    })
  }

  const handleDelete = (resumeId: string) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return

    startTransition(async () => {
      await deleteResume(resumeId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resume</h1>
          <p className="text-muted-foreground">
            Manage your uploaded resumes.
          </p>
        </div>
        <ResumeUpload label="Upload another resume" />
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No resumes yet</CardTitle>
            <CardDescription>
              Upload a resume to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUpload parseOnUpload label="Upload resume" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{resume.file_name}</p>
                    {resume.is_primary && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(resume.created_at)} ·{' '}
                    {formatFileSize(resume.file_size)} ·{' '}
                    {resume.mime_type.includes('pdf') ? 'PDF' : 'DOCX'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDownload(resume.id)}
                  >
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(resume.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
