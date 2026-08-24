import { redirect } from 'next/navigation'

import { JobsDashboard } from '@/components/jobs/jobs-dashboard'
import { calculateProfileCompleteness } from '@/lib/profile/completeness'
import { buildJobSearchContext } from '@/lib/jobs/profile-context'
import { getJobsForUser, getRecentJobActivity } from '@/lib/queries/jobs'
import { getProfileData } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { JOB_PLATFORMS } from '@/lib/jobs/platforms'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/sign-in?next=/dashboard/jobs')
  }

  const userId = data.claims.sub as string
  const profileData = await getProfileData(userId)
  const searchContext = buildJobSearchContext(profileData)

  const [jobsResult, activity] = await Promise.all([
    getJobsForUser(userId, [...JOB_PLATFORMS]),
    getRecentJobActivity(userId),
  ])

  const completeness = calculateProfileCompleteness({
    profile: {
      full_name: profileData.profile?.full_name ?? '',
      email: profileData.profile?.email ?? '',
      phone: profileData.profile?.phone ?? '',
      location: profileData.profile?.location ?? '',
      linkedin_url: profileData.profile?.linkedin_url ?? '',
      github_url: profileData.profile?.github_url ?? '',
      website_url: profileData.profile?.website_url ?? '',
      portfolio_url: profileData.profile?.portfolio_url ?? '',
      professional_summary: profileData.profile?.professional_summary ?? '',
    },
    skills: profileData.skills.map((skill) => skill.skill),
    workExperiences: profileData.workExperiences.map((exp) => ({
      company: exp.company,
      title: exp.title,
      start_date: exp.start_date ?? '',
      end_date: exp.end_date ?? '',
      is_current: exp.is_current,
      responsibilities: exp.responsibilities,
    })),
    educationEntries: profileData.educationEntries.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree ?? '',
      field_of_study: edu.field_of_study ?? '',
      start_date: edu.start_date ?? '',
      end_date: edu.end_date ?? '',
      description: edu.description ?? '',
    })),
    projects: profileData.projects.map((project) => ({
      name: project.name,
      description: project.description ?? '',
      url: project.url ?? '',
      technologies: project.technologies,
    })),
    certifications: profileData.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer ?? '',
      issue_date: cert.issue_date ?? '',
      url: cert.url ?? '',
    })),
    profileLinks: profileData.profileLinks.map((link) => ({
      label: link.label,
      url: link.url,
    })),
  })

  const firstName = profileData.profile?.full_name?.split(' ')[0] ?? null
  const profileIncomplete = completeness.percentage < 50

  return (
    <JobsDashboard
      initialJobs={jobsResult.jobs}
      initialFromCache={jobsResult.fromCache}
      initialFetchedAt={jobsResult.fetchedAt}
      initialError={jobsResult.error}
      firstName={firstName}
      role={searchContext.role}
      completeness={completeness}
      activity={activity}
      profileIncomplete={profileIncomplete}
    />
  )
}
