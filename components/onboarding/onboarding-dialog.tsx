'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { uploadAndParseResume } from '@/lib/actions/resume'
import {
  ALLOWED_RESUME_MIME_TYPES,
  MAX_RESUME_FILE_SIZE,
} from '@/lib/resume/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { Upload01Icon } from '@hugeicons/core-free-icons'

type UploadStep = 'idle' | 'uploading' | 'parsing' | 'saving' | 'success'

const stepMessages: Record<UploadStep, string> = {
  idle: '',
  uploading: 'Uploading resume…',
  parsing: 'Parsing resume with AI…',
  saving: 'Saving your profile…',
  success: 'Profile pre-filled! Taking you to review…',
}

export function OnboardingDialog() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<UploadStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_RESUME_MIME_TYPES.includes(file.type as (typeof ALLOWED_RESUME_MIME_TYPES)[number])) {
      return 'Only PDF and DOCX files are supported.'
    }
    if (file.size > MAX_RESUME_FILE_SIZE) {
      return 'File size must be 10 MB or less.'
    }
    return null
  }

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      setStep('uploading')

      const formData = new FormData()
      formData.append('file', file)

      setStep('parsing')
      const result = await uploadAndParseResume(formData)

      if (!result.success) {
        setError(result.error)
        setStep('idle')
        return
      }

      setStep('saving')
      setStep('success')
      router.push('/dashboard/profile?from=resume')
      router.refresh()
    },
    [router]
  )

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleUpload(file)
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void handleUpload(file)
  }

  const isProcessing = step !== 'idle' && step !== 'success'

  return (
    <Dialog open modal disablePointerDismissal onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base">Welcome! Upload your resume</DialogTitle>
          <DialogDescription>
            To get started, upload your resume. We&apos;ll extract what we can
            and pre-fill your profile — you can add or edit anything that&apos;s
            missing afterward.
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !isProcessing && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
        >
          <HugeiconsIcon
            icon={Upload01Icon}
            strokeWidth={1.5}
            className="size-10 text-muted-foreground"
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drag and drop your resume here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse (PDF, DOCX — max 10 MB)
            </p>
          </div>
          <Button type="button" disabled={isProcessing} size="sm">
            Choose file
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={onFileChange}
          disabled={isProcessing}
        />

        {step !== 'idle' && (
          <p className="text-center text-sm text-muted-foreground">
            {stepMessages[step]}
          </p>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
