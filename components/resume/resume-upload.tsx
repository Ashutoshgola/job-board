'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  uploadAndParseResume,
  uploadResumeOnly,
} from '@/lib/actions/resume'
import {
  ALLOWED_RESUME_MIME_TYPES,
  MAX_RESUME_FILE_SIZE,
} from '@/lib/resume/schema'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Upload01Icon } from '@hugeicons/core-free-icons'

type ResumeUploadProps = {
  parseOnUpload?: boolean
  label?: string
}

export function ResumeUpload({
  parseOnUpload = false,
  label = 'Upload resume',
}: ResumeUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (
      !ALLOWED_RESUME_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_RESUME_MIME_TYPES)[number]
      )
    ) {
      setError('Only PDF and DOCX files are supported.')
      return
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setError('File size must be 10 MB or less.')
      return
    }

    setError(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const result = parseOnUpload
      ? await uploadAndParseResume(formData)
      : await uploadResumeOnly(formData)

    setIsUploading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          event.target.value = ''
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} data-icon="inline-start" />
        {isUploading ? 'Uploading…' : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
