'use server'

import { revalidatePath } from 'next/cache'

import type { JobPlatform } from '@/lib/jobs/platforms'
import { isJobPlatform, JOB_PLATFORMS } from '@/lib/jobs/platforms'
import { getAuthenticatedUserId } from '@/lib/queries/profile'
import { getJobsForUser } from '@/lib/queries/jobs'
import { createClient } from '@/lib/supabase/server'

export type JobsActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

function parsePlatforms(platforms?: string[]): JobPlatform[] {
  if (!platforms || platforms.length === 0) return [...JOB_PLATFORMS]
  return platforms.filter(isJobPlatform)
}

export async function refreshJobsAction(platforms?: string[]) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false as const, error: 'You must be signed in.' }
  }

  const selectedPlatforms = parsePlatforms(platforms)
  const result = await getJobsForUser(userId, selectedPlatforms, {
    forceRefresh: true,
  })

  revalidatePath('/dashboard/jobs')

  return {
    success: true as const,
    data: result,
  }
}

export async function loadJobsAction(platforms?: string[]) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false as const, error: 'You must be signed in.' }
  }

  const selectedPlatforms = parsePlatforms(platforms)
  const result = await getJobsForUser(userId, selectedPlatforms)

  return {
    success: true as const,
    data: result,
  }
}

export async function toggleSavedJobAction(
  jobId: string,
  saved: boolean
): Promise<JobsActionResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: 'You must be signed in.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('jobs')
    .update({ saved_status: saved })
    .eq('id', jobId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/jobs')
  return { success: true, data: undefined }
}
