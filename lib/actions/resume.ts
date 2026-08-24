'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { parseResume } from '@/lib/resume/parse'
import { formatGeminiError } from '@/lib/resume/config'
import { saveParsedProfileData } from '@/lib/resume/save-parsed-profile'
import {
  isAllowedResumeMimeType,
  MAX_RESUME_FILE_SIZE,
} from '@/lib/resume/schema'
import { getAuthenticatedUserId } from '@/lib/queries/profile'

export type ResumeActionResult =
  | { success: true; resumeId: string }
  | { success: false; error: string }

export async function uploadAndParseResume(
  formData: FormData
): Promise<ResumeActionResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: 'You must be signed in to upload a resume.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'Please select a resume file to upload.' }
  }

  if (!isAllowedResumeMimeType(file.type)) {
    return {
      success: false,
      error: 'Only PDF and DOCX files are supported.',
    }
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    return { success: false, error: 'File size must be 10 MB or less.' }
  }

  const supabase = await createClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileId = randomUUID()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${userId}/${fileId}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message || 'Failed to upload resume.',
    }
  }

  const { data: existingResumes } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)

  const isPrimary = !existingResumes || existingResumes.length === 0

  const { data: resumeRow, error: insertError } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      is_primary: isPrimary,
    })
    .select('id')
    .single()

  if (insertError || !resumeRow) {
    await supabase.storage.from('resumes').remove([filePath])
    return {
      success: false,
      error: insertError?.message || 'Failed to save resume metadata.',
    }
  }

  try {
    const parsed = await parseResume(buffer, file.type)
    await saveParsedProfileData(supabase, userId, parsed)
  } catch (error) {
    await supabase.storage.from('resumes').remove([filePath])
    await supabase.from('resumes').delete().eq('id', resumeRow.id)

    return {
      success: false,
      error: `Resume parsing failed: ${formatGeminiError(error)}`,
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/resume')

  return { success: true, resumeId: resumeRow.id }
}

export async function uploadResumeOnly(
  formData: FormData
): Promise<ResumeActionResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: 'You must be signed in to upload a resume.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'Please select a resume file to upload.' }
  }

  if (!isAllowedResumeMimeType(file.type)) {
    return {
      success: false,
      error: 'Only PDF and DOCX files are supported.',
    }
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    return { success: false, error: 'File size must be 10 MB or less.' }
  }

  const supabase = await createClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileId = randomUUID()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${userId}/${fileId}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message || 'Failed to upload resume.',
    }
  }

  const { data: existingResumes } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)

  const isPrimary = !existingResumes || existingResumes.length === 0

  const { data: resumeRow, error: insertError } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      is_primary: isPrimary,
    })
    .select('id')
    .single()

  if (insertError || !resumeRow) {
    await supabase.storage.from('resumes').remove([filePath])
    return {
      success: false,
      error: insertError?.message || 'Failed to save resume metadata.',
    }
  }

  revalidatePath('/dashboard/resume')

  return { success: true, resumeId: resumeRow.id }
}

export async function deleteResume(
  resumeId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: 'You must be signed in.' }
  }

  const supabase = await createClient()

  const { data: resume, error: fetchError } = await supabase
    .from('resumes')
    .select('file_path, is_primary')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError || !resume) {
    return { success: false, error: 'Resume not found.' }
  }

  const { error: storageError } = await supabase.storage
    .from('resumes')
    .remove([resume.file_path])

  if (storageError) {
    return { success: false, error: storageError.message }
  }

  const { error: deleteError } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', userId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  if (resume.is_primary) {
    const { data: remaining } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (remaining && remaining.length > 0) {
      await supabase
        .from('resumes')
        .update({ is_primary: true })
        .eq('id', remaining[0].id)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/resume')

  return { success: true }
}

export async function getResumeDownloadUrl(
  resumeId: string
): Promise<{ url: string | null; error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { url: null, error: 'You must be signed in.' }
  }

  const supabase = await createClient()

  const { data: resume, error } = await supabase
    .from('resumes')
    .select('file_path')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !resume) {
    return { url: null, error: 'Resume not found.' }
  }

  const { data, error: signedError } = await supabase.storage
    .from('resumes')
    .createSignedUrl(resume.file_path, 60)

  if (signedError || !data?.signedUrl) {
    return { url: null, error: signedError?.message || 'Failed to generate download URL.' }
  }

  return { url: data.signedUrl }
}
