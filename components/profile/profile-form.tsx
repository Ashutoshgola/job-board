'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Award01Icon,
  Briefcase01Icon,
  Certificate01Icon,
  CodeIcon,
  FileEditIcon,
  GraduationCapIcon,
  Link01Icon,
  Tag01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'

import { updateProfile, type ProfileUpdatePayload } from '@/lib/actions/profile'
import {
  calculateProfileCompleteness,
  getIncompleteProfileSections,
  type ProfileSectionId,
} from '@/lib/profile/completeness'
import type { ProfileData } from '@/lib/queries/profile'
import { ProfileCompletenessCard } from '@/components/profile/profile-completeness-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type FormState = ProfileUpdatePayload

const profileTabs: Array<{
  id: ProfileSectionId
  label: string
  icon: typeof UserIcon
}> = [
  { id: 'basic', label: 'Basic info', icon: UserIcon },
  { id: 'summary', label: 'Summary', icon: FileEditIcon },
  { id: 'skills', label: 'Skills', icon: Tag01Icon },
  { id: 'experience', label: 'Experience', icon: Briefcase01Icon },
  { id: 'education', label: 'Education', icon: GraduationCapIcon },
  { id: 'projects', label: 'Projects', icon: CodeIcon },
  { id: 'certifications', label: 'Certifications', icon: Certificate01Icon },
  { id: 'links', label: 'Links', icon: Link01Icon },
]

function toFormState(data: ProfileData): FormState {
  return {
    profile: {
      full_name: data.profile?.full_name ?? '',
      email: data.profile?.email ?? '',
      phone: data.profile?.phone ?? '',
      location: data.profile?.location ?? '',
      linkedin_url: data.profile?.linkedin_url ?? '',
      github_url: data.profile?.github_url ?? '',
      website_url: data.profile?.website_url ?? '',
      portfolio_url: data.profile?.portfolio_url ?? '',
      professional_summary: data.profile?.professional_summary ?? '',
    },
    skills: data.skills.map((s) => s.skill),
    workExperiences: data.workExperiences.map((exp) => ({
      company: exp.company,
      title: exp.title,
      start_date: exp.start_date ?? '',
      end_date: exp.end_date ?? '',
      is_current: exp.is_current,
      responsibilities: exp.responsibilities,
    })),
    educationEntries: data.educationEntries.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree ?? '',
      field_of_study: edu.field_of_study ?? '',
      start_date: edu.start_date ?? '',
      end_date: edu.end_date ?? '',
      description: edu.description ?? '',
    })),
    projects: data.projects.map((p) => ({
      name: p.name,
      description: p.description ?? '',
      url: p.url ?? '',
      technologies: p.technologies,
    })),
    certifications: data.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer ?? '',
      issue_date: c.issue_date ?? '',
      url: c.url ?? '',
    })),
    profileLinks: data.profileLinks.map((l) => ({
      label: l.label,
      url: l.url,
    })),
  }
}

export function ProfileForm({
  data,
  showReviewBanner = false,
}: {
  data: ProfileData
  showReviewBanner?: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => toFormState(data))
  const [activeTab, setActiveTab] = useState<ProfileSectionId>('basic')
  const [skillInput, setSkillInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const completeness = useMemo(
    () => calculateProfileCompleteness(form),
    [form]
  )
  const incompleteSections = getIncompleteProfileSections(data)

  const save = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateProfile(form)
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile saved successfully.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  const addSkill = () => {
    const skill = skillInput.trim()
    if (!skill || form.skills.includes(skill)) return
    setForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }))
    setSkillInput('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Pre-filled from your resume where possible. Complete each tab and
            save your changes.
          </p>
        </div>
        <Button type="button" onClick={save} disabled={isPending} size="lg">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <ProfileCompletenessCard
            completeness={completeness}
            showReviewHint={showReviewBanner || incompleteSections.length > 0}
            onSectionClick={setActiveTab}
          />
        </aside>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ProfileSectionId)}
          orientation="vertical"
          className="min-w-0 flex-row gap-6"
        >
          <TabsList
            variant="line"
            className="h-auto w-full max-w-full shrink-0 flex-col items-stretch bg-transparent p-0 sm:max-w-[220px]"
          >
            {profileTabs.map((tab) => {
              const section = completeness.sections.find(
                (item) => item.id === tab.id
              )
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="justify-start gap-2 px-3 py-2"
                >
                  <HugeiconsIcon icon={tab.icon} strokeWidth={2} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {section?.complete && (
                    <HugeiconsIcon
                      icon={Award01Icon}
                      strokeWidth={2}
                      className="size-3 text-emerald-500"
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="min-w-0 flex-1 space-y-4">
            <TabsContent value="basic" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                    <div>
                      <CardTitle>Basic information</CardTitle>
                      <CardDescription>
                        Your contact details and profile links.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ['full_name', 'Full name'],
                      ['email', 'Email'],
                      ['phone', 'Phone'],
                      ['location', 'Location'],
                      ['linkedin_url', 'LinkedIn URL'],
                      ['github_url', 'GitHub URL'],
                      ['website_url', 'Website URL'],
                      ['portfolio_url', 'Portfolio URL'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={form.profile[key] ?? ''}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, [key]: e.target.value },
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={FileEditIcon} strokeWidth={2} />
                    <CardTitle>Professional summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={6}
                    value={form.profile.professional_summary ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        profile: {
                          ...prev.profile,
                          professional_summary: e.target.value,
                        },
                      }))
                    }
                    placeholder="Brief summary of your experience and goals…"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} />
                    <CardTitle>Skills</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          className="ml-1 hover:text-destructive"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              skills: prev.skills.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={addSkill}>
                      Add skill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="mt-0">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} />
                    <div>
                      <CardTitle>Work experience</CardTitle>
                      <CardDescription>Your employment history.</CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        workExperiences: [
                          ...prev.workExperiences,
                          {
                            company: '',
                            title: '',
                            start_date: '',
                            end_date: '',
                            is_current: false,
                            responsibilities: [''],
                          },
                        ],
                      }))
                    }
                  >
                    Add experience
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.workExperiences.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No work experience added yet.
                    </p>
                  )}
                  {form.workExperiences.map((exp, index) => (
                    <div key={index} className="space-y-3 rounded-lg border p-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              workExperiences: prev.workExperiences.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => {
                              const next = [...form.workExperiences]
                              next[index] = { ...next[index], company: e.target.value }
                              setForm((prev) => ({ ...prev, workExperiences: next }))
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Job title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => {
                              const next = [...form.workExperiences]
                              next[index] = { ...next[index], title: e.target.value }
                              setForm((prev) => ({ ...prev, workExperiences: next }))
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Start date</Label>
                          <Input
                            value={exp.start_date ?? ''}
                            placeholder="Jan 2020"
                            onChange={(e) => {
                              const next = [...form.workExperiences]
                              next[index] = { ...next[index], start_date: e.target.value }
                              setForm((prev) => ({ ...prev, workExperiences: next }))
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>End date</Label>
                          <Input
                            value={exp.end_date ?? ''}
                            placeholder="Present"
                            onChange={(e) => {
                              const next = [...form.workExperiences]
                              next[index] = { ...next[index], end_date: e.target.value }
                              setForm((prev) => ({ ...prev, workExperiences: next }))
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Responsibilities</Label>
                        {exp.responsibilities.map((item, respIndex) => (
                          <div key={respIndex} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const next = [...form.workExperiences]
                                const responsibilities = [...next[index].responsibilities]
                                responsibilities[respIndex] = e.target.value
                                next[index] = { ...next[index], responsibilities }
                                setForm((prev) => ({ ...prev, workExperiences: next }))
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = [...form.workExperiences]
                                next[index] = {
                                  ...next[index],
                                  responsibilities: next[index].responsibilities.filter(
                                    (_, i) => i !== respIndex
                                  ),
                                }
                                setForm((prev) => ({ ...prev, workExperiences: next }))
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const next = [...form.workExperiences]
                            next[index] = {
                              ...next[index],
                              responsibilities: [...next[index].responsibilities, ''],
                            }
                            setForm((prev) => ({ ...prev, workExperiences: next }))
                          }}
                        >
                          Add bullet
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="mt-0">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={GraduationCapIcon} strokeWidth={2} />
                    <CardTitle>Education</CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        educationEntries: [
                          ...prev.educationEntries,
                          {
                            institution: '',
                            degree: '',
                            field_of_study: '',
                            start_date: '',
                            end_date: '',
                            description: '',
                          },
                        ],
                      }))
                    }
                  >
                    Add education
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.educationEntries.map((edu, index) => (
                    <div key={index} className="space-y-3 rounded-lg border p-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              educationEntries: prev.educationEntries.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ['institution', 'Institution'],
                            ['degree', 'Degree'],
                            ['field_of_study', 'Field of study'],
                            ['start_date', 'Start date'],
                            ['end_date', 'End date'],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="space-y-1.5">
                            <Label>{label}</Label>
                            <Input
                              value={edu[key] ?? ''}
                              onChange={(e) => {
                                const next = [...form.educationEntries]
                                next[index] = { ...next[index], [key]: e.target.value }
                                setForm((prev) => ({ ...prev, educationEntries: next }))
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={edu.description ?? ''}
                          onChange={(e) => {
                            const next = [...form.educationEntries]
                            next[index] = { ...next[index], description: e.target.value }
                            setForm((prev) => ({ ...prev, educationEntries: next }))
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-0">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />
                    <CardTitle>Projects</CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        projects: [
                          ...prev.projects,
                          { name: '', description: '', url: '', technologies: [] },
                        ],
                      }))
                    }
                  >
                    Add project
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.projects.map((project, index) => (
                    <div key={index} className="space-y-3 rounded-lg border p-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              projects: prev.projects.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Name</Label>
                          <Input
                            value={project.name}
                            onChange={(e) => {
                              const next = [...form.projects]
                              next[index] = { ...next[index], name: e.target.value }
                              setForm((prev) => ({ ...prev, projects: next }))
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>URL</Label>
                          <Input
                            value={project.url ?? ''}
                            onChange={(e) => {
                              const next = [...form.projects]
                              next[index] = { ...next[index], url: e.target.value }
                              setForm((prev) => ({ ...prev, projects: next }))
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          value={project.description ?? ''}
                          onChange={(e) => {
                            const next = [...form.projects]
                            next[index] = { ...next[index], description: e.target.value }
                            setForm((prev) => ({ ...prev, projects: next }))
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Technologies (comma-separated)</Label>
                        <Input
                          value={project.technologies.join(', ')}
                          onChange={(e) => {
                            const next = [...form.projects]
                            next[index] = {
                              ...next[index],
                              technologies: e.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }
                            setForm((prev) => ({ ...prev, projects: next }))
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications" className="mt-0">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Certificate01Icon} strokeWidth={2} />
                    <CardTitle>Certifications</CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        certifications: [
                          ...prev.certifications,
                          { name: '', issuer: '', issue_date: '', url: '' },
                        ],
                      }))
                    }
                  >
                    Add certification
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.certifications.map((cert, index) => (
                    <div key={index} className="space-y-3 rounded-lg border p-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              certifications: prev.certifications.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ['name', 'Name'],
                            ['issuer', 'Issuer'],
                            ['issue_date', 'Issue date'],
                            ['url', 'URL'],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="space-y-1.5">
                            <Label>{label}</Label>
                            <Input
                              value={cert[key] ?? ''}
                              onChange={(e) => {
                                const next = [...form.certifications]
                                next[index] = { ...next[index], [key]: e.target.value }
                                setForm((prev) => ({ ...prev, certifications: next }))
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="mt-0">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
                    <CardTitle>Other links</CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        profileLinks: [...prev.profileLinks, { label: '', url: '' }],
                      }))
                    }
                  >
                    Add link
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.profileLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => {
                          const next = [...form.profileLinks]
                          next[index] = { ...next[index], label: e.target.value }
                          setForm((prev) => ({ ...prev, profileLinks: next }))
                        }}
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => {
                          const next = [...form.profileLinks]
                          next[index] = { ...next[index], url: e.target.value }
                          setForm((prev) => ({ ...prev, profileLinks: next }))
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            profileLinks: prev.profileLinks.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={isPending} size="lg">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
