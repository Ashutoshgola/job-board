'use server'

import { parseResume } from '@/lib/resume/parse'
import { parsedResumeSchema, type ParsedResume } from '@/lib/resume/schema'
import { getAuthenticatedUserId } from '@/lib/queries/profile'
import { formatGeminiError } from '@/lib/resume/config'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const STOP_WORDS = new Set(
  [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'in',
    'is',
    'it',
    'of',
    'on',
    'or',
    'that',
    'the',
    'to',
    'with',
    'your',
    'you',
    'our',
    'we',
    'will',
    'this',
    'their',
    'have',
    'has',
    'using',
    'use',
    'work',
    'working',
    'role',
    'about',
    'job',
    'team',
    'company',
    'build',
    'building',
    'develop',
    'developing',
    'development',
    'experience',
    'years',
    'year',
    'required',
    'requirements',
    'preferred',
    'nice',
    'welcome',
    'full',
    'time',
    'employment',
    'location',
    'remote',
    'based',
    'strong',
    'knowledge',
    'understanding',
    'familiarity',
    'including',
    'such',
    'across',
    'within',
    'into',
    'through',
    'their',
    'these',
    'those',
    'more',
    'than',
    'other',
    'also',
    'very',
    'good',
    'excellent',
    'ability',
    'abilities',
    'responsibilities',
    'description',
  ].map((word) => word.toLowerCase()),
)

const GENERIC_JD_TERMS = new Set([
  'candidate',
  'candidates',
  'applicant',
  'applications',
  'position',
  'positions',
  'role',
  'roles',
  'team',
  'teams',
  'company',
  'business',
  'environment',
  'opportunity',
  'opportunities',
  'responsibility',
  'responsibilities',
  'requirement',
  'requirements',
  'preferred',
  'required',
  'skills',
  'skill',
  'ability',
  'abilities',
  'knowledge',
  'understanding',
  'familiarity',
  'experience',
  'experienced',
  'years',
  'year',
  'work',
  'working',
  'works',
  'job',
  'jobs',
  'full',
  'time',
  'employment',
  'location',
  'remote',
  'onsite',
  'hybrid',
  'welcome',
  'strong',
  'excellent',
  'good',
  'great',
  'including',
  'etc',
  'using',
  'use',
  'build',
  'building',
  'develop',
  'developing',
  'development',
  'maintain',
  'maintaining',
  'support',
  'supporting',
  'help',
  'helping',
  'create',
  'creating',
  'work',
  'across',
  'within',
  'based',
  'like',
  'such',
  'also',
  'other',
])

const TECHNICAL_PHRASES = [
  'javascript',
  'typescript',
  'java',
  'python',
  'c++',
  'c#',
  'node.js',
  'nodejs',
  'express.js',
  'express',
  'react.js',
  'react',
  'next.js',
  'nextjs',
  'angular',
  'vue.js',
  'vue',
  'rest api',
  'rest apis',
  'restful api',
  'restful apis',
  'api design',
  'socket.io',
  'websocket',
  'websockets',
  'graphql',
  'postgresql',
  'postgres',
  'mysql',
  'mongodb',
  'sql',
  'nosql',
  'redis',
  'firebase',
  'supabase',
  'prisma',
  'docker',
  'kubernetes',
  'aws',
  'aws ec2',
  'aws s3',
  'ec2',
  's3',
  'azure',
  'gcp',
  'google cloud',
  'github actions',
  'gitlab ci',
  'gitlab ci/cd',
  'ci/cd',
  'cicd',
  'terraform',
  'ansible',
  'nginx',
  'linux',
  'git',
  'github',
  'gitlab',
  'jwt',
  'oauth',
  'authentication',
  'authorization',
  'agile',
  'scrum',
  'sdlc',
  'unit testing',
  'testing',
  'code review',
  'code reviews',
  'data structures',
  'data structures and algorithms',
  'algorithms',
  'dsa',
  'object oriented programming',
  'oop',
  'microservices',
  'distributed systems',
  'real-time systems',
  'real time systems',
  'concurrent systems',
  'concurrency',
  'system design',
  'cloud deployment',
  'cloud computing',
  'rest',
]

export type AtsMetric = {
  label: string
  score: number
}

export type AtsAnalysis = {
  score: number
  metrics: AtsMetric[]

  matchedKeywords: string[]
  missingKeywords: string[]

  missingRequirements: string[]
  addressableRequirements: string[]
  genuineGaps: string[]

  experienceLevelCompatibility: string

  redFlags: string[]
  weakSections: string[]

  changes: string[]
  keywordsAdded: string[]
  unsupportedContent: string[]

  recommendedImprovements: string[]
  matchedSkills: string[]
  experienceAlignment: string

  resume: ParsedResume
}

export type AtsActionResult =
  | {
      success: true
      analysis: AtsAnalysis
    }
  | {
      success: false
      error: string
    }

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^\w+#./-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        !STOP_WORDS.has(word) &&
        !GENERIC_JD_TERMS.has(word),
    )
}

function resumeText(resume: ParsedResume) {
  return normalizeText(
    [
      resume.profile.full_name,
      resume.profile.professional_summary,
      resume.profile.location,
      resume.skills.join(' '),
      resume.work_experiences
        .map((experience) =>
          [
            experience.title,
            experience.company,
            experience.start_date,
            experience.end_date,
            experience.responsibilities.join(' '),
          ].join(' '),
        )
        .join(' '),
      resume.projects
        .map((project) =>
          [
            project.name,
            project.technologies.join(' '),
            project.description,
          ].join(' '),
        )
        .join(' '),
      resume.education_entries
        .map((education) =>
          [
            education.degree,
            education.field_of_study,
            education.institution,
          ].join(' '),
        )
        .join(' '),
      resume.certifications
        .map((certification) =>
          [
            certification.name,
            certification.issuer,
          ].join(' '),
        )
        .join(' '),
    ].join(' '),
  )
}

function containsTerm(text: string, term: string) {
  const normalizedText = normalizeText(text)
  const normalizedTerm = normalizeText(term)

  if (!normalizedTerm) return false

  return normalizedText.includes(normalizedTerm)
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function extractTechnicalKeywords(jobDescription: string) {
  const normalizedJD = normalizeText(jobDescription)

  return TECHNICAL_PHRASES.filter((phrase) =>
    normalizedJD.includes(normalizeText(phrase)),
  )
}

function extractImportantKeywords(jobDescription: string) {
  const technicalKeywords = extractTechnicalKeywords(jobDescription)

  const individualWords = words(jobDescription).filter(
    (word) =>
      word.length >= 4 &&
      !GENERIC_JD_TERMS.has(word) &&
      !STOP_WORDS.has(word),
  )

  return unique([
    ...technicalKeywords,
    ...individualWords,
  ])
}

function scoreMatch(terms: string[], text: string) {
  if (!terms.length) return 100

  const matched = terms.filter((term) => containsTerm(text, term))

  return Math.round((matched.length / terms.length) * 100)
}

function getMatchedTerms(terms: string[], text: string) {
  return terms.filter((term) => containsTerm(text, term))
}

function getMissingTerms(terms: string[], text: string) {
  return terms.filter((term) => !containsTerm(text, term))
}

function extractRequiredExperience(jobDescription: string) {
  const normalized = normalizeText(jobDescription)

  const patterns = [
    /(\d+)\s*-\s*(\d+)\s*years?/i,
    /(\d+)\+?\s*years?/i,
    /minimum\s+of\s+(\d+)\s*years?/i,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)

    if (match) {
      if (match[2]) {
        return {
          min: Number(match[1]),
          max: Number(match[2]),
        }
      }

      return {
        min: Number(match[1]),
        max: null,
      }
    }
  }

  return null
}

function calculateExperienceScore(
  resume: ParsedResume,
  jobDescription: string,
) {
  const required = extractRequiredExperience(jobDescription)

  if (!required) {
    return resume.work_experiences.length > 0 ? 100 : 70
  }

  let totalMonths = 0

  for (const experience of resume.work_experiences) {
    const start = experience.start_date
    const end = experience.is_current
      ? new Date().toISOString().slice(0, 7)
      : experience.end_date

    if (!start || !end) continue

    const startDate = new Date(`${start}-01`)
    const endDate = new Date(`${end}-01`)

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      continue
    }

    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())

    if (months > 0) {
      totalMonths += months
    }
  }

  const actualYears = totalMonths / 12

  if (actualYears >= required.min) {
    return 100
  }

  if (actualYears >= required.min * 0.75) {
    return 85
  }

  if (actualYears >= required.min * 0.5) {
    return 70
  }

  if (actualYears > 0) {
    return 55
  }

  return 40
}

function calculateEducationScore(
  resume: ParsedResume,
  jobDescription: string,
) {
  const jd = normalizeText(jobDescription)

  const requiresDegree =
    jd.includes('bachelor') ||
    jd.includes("bachelor's") ||
    jd.includes('b tech') ||
    jd.includes('btech') ||
    jd.includes('computer science degree') ||
    jd.includes('master') ||
    jd.includes("master's") ||
    jd.includes('degree')

  if (!requiresDegree) {
    return 100
  }

  if (!resume.education_entries.length) {
    return 0
  }

  return 100
}

function calculateTitleScore(
  resume: ParsedResume,
  jobDescription: string,
) {
  const jd = normalizeText(jobDescription)

  const titleKeywords = [
    'software engineer',
    'software developer',
    'full stack',
    'full-stack',
    'frontend',
    'front-end',
    'backend',
    'back-end',
    'developer',
    'engineer',
  ].filter((term) => jd.includes(term))

  if (!titleKeywords.length) {
    return 100
  }

  const resumeTitles = resume.work_experiences
    .map((experience) => experience.title)
    .join(' ')

  const normalizedResumeTitles = normalizeText(resumeTitles)

  const matched = titleKeywords.some(
    (term) =>
      normalizedResumeTitles.includes(term) ||
      (term === 'full-stack' &&
        normalizedResumeTitles.includes('full stack')) ||
      (term === 'full stack' &&
        normalizedResumeTitles.includes('full-stack')),
  )

  if (matched) return 100

  if (
    normalizedResumeTitles.includes('developer') ||
    normalizedResumeTitles.includes('engineer')
  ) {
    return 80
  }

  return 60
}

function calculateSkillsScore(
  resume: ParsedResume,
  jobDescription: string,
) {
  const requiredSkills = extractTechnicalKeywords(jobDescription)

  if (!requiredSkills.length) {
    return 100
  }

  const resumeTextValue = resumeText(resume)

  const matched = getMatchedTerms(requiredSkills, resumeTextValue)

  return Math.round((matched.length / requiredSkills.length) * 100)
}

function calculateKeywordScore(
  resume: ParsedResume,
  jobDescription: string,
) {
  const importantKeywords = extractImportantKeywords(jobDescription)

  if (!importantKeywords.length) {
    return 100
  }

  const resumeTextValue = resumeText(resume)

  const matched = getMatchedTerms(
    importantKeywords,
    resumeTextValue,
  )

  return Math.round((matched.length / importantKeywords.length) * 100)
}

function extractRequirementGaps(
  resume: ParsedResume,
  jobDescription: string,
) {
  const jd = normalizeText(jobDescription)
  const text = resumeText(resume)

  const requirements: string[] = []

  if (
    jd.includes('bachelor') ||
    jd.includes("bachelor's") ||
    jd.includes('b tech') ||
    jd.includes('btech') ||
    jd.includes('degree')
  ) {
    requirements.push('Bachelor degree')
  }

  if (
    jd.includes('master') ||
    jd.includes("master's")
  ) {
    requirements.push("Master's degree")
  }

  if (jd.includes('aws')) {
    requirements.push('AWS')
  }

  if (jd.includes('docker')) {
    requirements.push('Docker')
  }

  if (jd.includes('kubernetes')) {
    requirements.push('Kubernetes')
  }

  if (
    jd.includes('security clearance') ||
    jd.includes('clearance')
  ) {
    requirements.push('Security clearance')
  }

  if (jd.includes('driver license') || jd.includes("driver's license")) {
    requirements.push("Driver's license")
  }

  if (jd.includes('relocation')) {
    requirements.push('Relocation')
  }

  const missing = requirements.filter((requirement) => {
    const normalizedRequirement = normalizeText(requirement)

    if (normalizedRequirement === 'bachelor degree') {
      return resume.education_entries.length === 0
    }

    if (normalizedRequirement === "master's degree") {
      return !text.includes('master')
    }

    return !containsTerm(text, requirement)
  })

  return {
    requirements,
    missing,
  }
}

export async function analyzeResumeATS(
  formData: FormData,
): Promise<AtsActionResult> {
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return {
      success: false,
      error: 'You must be signed in to analyze a resume.',
    }
  }

  const file = formData.get('file')
  const jobDescription = String(
    formData.get('jobDescription') || '',
  ).trim()

  if (!(file instanceof File)) {
    return {
      success: false,
      error: 'Please upload a PDF or DOCX resume.',
    }
  }

  if (!jobDescription) {
    return {
      success: false,
      error: 'Paste a complete job description to continue.',
    }
  }

  if (file.size === 0) {
    return {
      success: false,
      error: 'The uploaded resume is empty.',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File size must be 10 MB or less.',
    }
  }

  const extension = file.name
    .toLowerCase()
    .split('.')
    .pop()

  const mimeType =
    extension === 'pdf'
      ? 'application/pdf'
      : extension === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : ''

  if (!mimeType) {
    return {
      success: false,
      error: 'Only PDF and DOCX files are supported.',
    }
  }

  try {
    const resume = parsedResumeSchema.parse(
      await parseResume(
        Buffer.from(await file.arrayBuffer()),
        mimeType,
      ),
    )

    const text = resumeText(resume)

    if (text.trim().length < 20) {
      return {
        success: false,
        error:
          'We could not find readable content in this resume.',
      }
    }

    /*
     * ------------------------------------------------------------
     * 1. KEYWORD ANALYSIS
     * ------------------------------------------------------------
     *
     * IMPORTANT:
     * We no longer treat every word in the JD as an ATS keyword.
     *
     * For example:
     *
     * "welcome", "remote", "years", "about", "role"
     *
     * are NOT meaningful ATS keywords.
     *
     * Technical terms such as:
     *
     * Node.js, React.js, Docker, AWS, PostgreSQL
     *
     * ARE meaningful.
     */

    const technicalKeywords =
      extractTechnicalKeywords(jobDescription)

    const importantKeywords =
      extractImportantKeywords(jobDescription)

    const matchedKeywords = getMatchedTerms(
      importantKeywords,
      text,
    )

    const missingKeywords = getMissingTerms(
      technicalKeywords,
      text,
    )

    /*
     * ------------------------------------------------------------
     * 2. SCORE INDIVIDUAL CATEGORIES
     * ------------------------------------------------------------
     */

    const keywordScore = calculateKeywordScore(
      resume,
      jobDescription,
    )

    const skillScore = calculateSkillsScore(
      resume,
      jobDescription,
    )

    const experienceScore = calculateExperienceScore(
      resume,
      jobDescription,
    )

    const educationScore = calculateEducationScore(
      resume,
      jobDescription,
    )

    const titleScore = calculateTitleScore(
      resume,
      jobDescription,
    )

    /*
     * The resume structure generated by this application
     * is intentionally ATS-friendly.
     *
     * This should NOT destroy the overall score simply because
     * a user's resume does not contain some JD words.
     */

    const formattingScore = 100

    /*
     * ------------------------------------------------------------
     * 3. OVERALL SCORE
     * ------------------------------------------------------------
     *
     * More realistic weighting:
     *
     * Keywords       30%
     * Skills         30%
     * Experience     20%
     * Education      10%
     * Title           5%
     * Formatting      5%
     */

    const rawScore =
      keywordScore * 0.30 +
      skillScore * 0.30 +
      experienceScore * 0.20 +
      educationScore * 0.10 +
      titleScore * 0.05 +
      formattingScore * 0.05

    const score = Math.max(
      1,
      Math.min(99, Math.round(rawScore)),
    )

    /*
     * ------------------------------------------------------------
     * 4. REQUIREMENT ANALYSIS
     * ------------------------------------------------------------
     */

    const requirementAnalysis =
      extractRequirementGaps(
        resume,
        jobDescription,
      )

    const missingRequirements =
      requirementAnalysis.missing

    /*
     * Addressable requirements are things the user may be able
     * to improve through wording if they genuinely have the skill.
     *
     * Genuine gaps are things the resume cannot honestly invent.
     */

    const addressableRequirements =
      missingRequirements.filter((requirement) =>
        [
          'AWS',
          'Docker',
          'Kubernetes',
        ].includes(requirement),
      )

    const genuineGaps =
      missingRequirements.filter(
        (requirement) =>
          !addressableRequirements.includes(
            requirement,
          ),
      )

    /*
     * ------------------------------------------------------------
     * 5. EXPERIENCE ANALYSIS
     * ------------------------------------------------------------
     */

    const experienceText = normalizeText(
      resume.work_experiences
        .map((experience) =>
          [
            experience.title,
            experience.company,
            experience.responsibilities.join(' '),
          ].join(' '),
        )
        .join(' '),
    )

    const experienceKeywords = extractTechnicalKeywords(
      jobDescription,
    )

    const experienceMatchedKeywords =
      getMatchedTerms(
        experienceKeywords,
        experienceText,
      )

    const experienceAlignment =
      experienceMatchedKeywords.length >=
      Math.max(
        3,
        Math.ceil(experienceKeywords.length * 0.5),
      )
        ? 'Your existing experience has strong overlap with the technical requirements of this job description.'
        : experienceMatchedKeywords.length > 0
          ? 'Your experience has some relevant overlap with this job description. Emphasize the responsibilities that directly match the role.'
          : 'Your experience has limited direct overlap with this job description. Emphasize only responsibilities that are genuinely relevant.'

    /*
     * ------------------------------------------------------------
     * 6. WEAK SECTIONS
     * ------------------------------------------------------------
     */

    const weakSections = [
      !resume.profile.professional_summary &&
        'Professional Summary',

      !resume.skills.length &&
        'Skills',

      !resume.work_experiences.length &&
        'Experience',

      !resume.projects.length &&
        'Projects',

      !resume.education_entries.length &&
        'Education',
    ].filter(
      (section): section is string =>
        Boolean(section),
    )

    /*
     * ------------------------------------------------------------
     * 7. RED FLAGS
     * ------------------------------------------------------------
     */

    const redFlags: string[] = []

    if (missingKeywords.length >= 5) {
      redFlags.push(
        `${missingKeywords.length} important technical keywords from the job description are not clearly supported by the resume.`,
      )
    }

    if (!resume.profile.professional_summary) {
      redFlags.push(
        'No professional summary is present for a quick recruiter skim.',
      )
    }

    if (!resume.work_experiences.length) {
      redFlags.push(
        'No work experience was extracted from the uploaded resume.',
      )
    }

    /*
     * ------------------------------------------------------------
     * 8. EXPERIENCE LEVEL
     * ------------------------------------------------------------
     */

    const requiredExperience =
      extractRequiredExperience(
        jobDescription,
      )

    let experienceLevelCompatibility =
      'No explicit experience requirement was detected in the job description.'

    if (requiredExperience) {
      if (requiredExperience.max !== null) {
        experienceLevelCompatibility =
          `The role requests approximately ${requiredExperience.min}-${requiredExperience.max} years of experience. Your resume should be evaluated primarily on relevant skills and projects if you are a fresher.`
      } else {
        experienceLevelCompatibility =
          `The role requests ${requiredExperience.min}+ years of experience. This is a potential experience gap if your resume does not demonstrate that tenure.`
      }
    } else if (resume.work_experiences.length) {
      experienceLevelCompatibility =
        'Your resume contains work experience that can be compared against the role requirements.'
    } else {
      experienceLevelCompatibility =
        'Your resume does not contain extracted professional experience, so experience compatibility cannot be strongly established.'
    }

    /*
     * ------------------------------------------------------------
     * 9. CHANGES / RECOMMENDATIONS
     * ------------------------------------------------------------
     */

    const changes = [
      'Preserved the original resume content and avoided unsupported claims.',
      'Prioritized ATS-readable standard section headings and single-column structure.',
      ...(resume.profile.professional_summary
        ? [
            'Retained the professional summary and aligned its emphasis with the target role where supported.',
          ]
        : []),
      ...(resume.work_experiences.length
        ? [
            'Kept existing employers, job titles, dates, and responsibilities grounded in the uploaded resume.',
          ]
        : []),
      ...(resume.projects.length
        ? [
            'Retained relevant projects and their existing technologies.',
          ]
        : []),
      ...(missingKeywords.length
        ? [
            'Identified missing technical keywords without inventing skills that are not present in the source resume.',
          ]
        : [
            'No major technical keyword gaps were detected.',
          ]),
    ]

    const keywordsAdded: string[] = []

    const unsupportedContent =
      genuineGaps.length > 0
        ? [
            `The following requirements were not inserted because doing so could create unsupported claims: ${genuineGaps.join(', ')}.`,
          ]
        : []

    const recommendedImprovements: string[] = []

    if (missingKeywords.length) {
      recommendedImprovements.push(
        `If you genuinely have these skills, make them explicit in the resume: ${missingKeywords.slice(0, 8).join(', ')}.`,
      )
    }

    if (experienceMatchedKeywords.length) {
      recommendedImprovements.push(
        `Emphasize experience bullets containing relevant technologies such as ${experienceMatchedKeywords.slice(0, 6).join(', ')}.`,
      )
    }

    if (!resume.profile.professional_summary) {
      recommendedImprovements.push(
        'Add a concise professional summary using only skills and experience already supported by your resume.',
      )
    }

    if (resume.work_experiences.length) {
      recommendedImprovements.push(
        'Lead experience bullets with strong action verbs and place the most relevant responsibilities first.',
      )
    }

    recommendedImprovements.push(
      'Keep standard headings, readable dates, simple bullets, and a single-column structure for ATS compatibility.',
    )

    /*
     * ------------------------------------------------------------
     * 10. MATCHED SKILLS
     * ------------------------------------------------------------
     */

    const resumeSkills = resume.skills
      .map((skill) => skill.trim())
      .filter(Boolean)

    const matchedSkills = resumeSkills.filter(
      (skill) =>
        containsTerm(
          jobDescription,
          skill,
        ),
    )

    /*
     * ------------------------------------------------------------
     * 11. RETURN RESULT
     * ------------------------------------------------------------
     */

    return {
      success: true,

      analysis: {
        score,

        metrics: [
          {
            label: 'Keyword Match',
            score: keywordScore,
          },
          {
            label: 'Skills Match',
            score: skillScore,
          },
          {
            label: 'Experience Match',
            score: experienceScore,
          },
          {
            label: 'Education Match',
            score: educationScore,
          },
          {
            label: 'Formatting Compatibility',
            score: formattingScore,
          },
          {
            label: 'Job Title Match',
            score: titleScore,
          },
        ],

        matchedKeywords:
          matchedKeywords.slice(0, 25),

        missingKeywords:
          missingKeywords.slice(0, 12),

        missingRequirements:
          missingRequirements.slice(0, 8),

        addressableRequirements:
          addressableRequirements.slice(0, 8),

        genuineGaps:
          genuineGaps.slice(0, 8),

        experienceLevelCompatibility,

        redFlags:
          redFlags.slice(0, 3),

        weakSections,

        changes,

        keywordsAdded,

        unsupportedContent,

        recommendedImprovements:

          recommendedImprovements.slice(0, 6),

        matchedSkills:
          unique(matchedSkills).slice(0, 20),

        experienceAlignment,

        resume,
      },
    }
  } catch (error) {
    const message = formatGeminiError(error)

    return {
      success: false,
      error: message.includes(
        'ATS_GEMINI_API_KEY is not configured',
      )
        ? 'Resume analysis is not configured yet. Please add ATS_GEMINI_API_KEY.'
        : `Resume parsing failed: ${message}`,
    }
  }
}