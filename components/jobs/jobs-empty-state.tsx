import { Briefcase, UserCircle2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type JobsEmptyStateProps = {
  incompleteProfile?: boolean
}

export function JobsEmptyState({ incompleteProfile = false }: JobsEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
          {incompleteProfile ? (
            <UserCircle2 className="size-5 text-muted-foreground" />
          ) : (
            <Briefcase className="size-5 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="text-base">
          {incompleteProfile ? 'Complete your profile for better matches' : 'No jobs found yet'}
        </CardTitle>
        <CardDescription className="max-w-md">
          {incompleteProfile
            ? 'Add skills, experience, and location to your profile so we can build stronger search queries.'
            : 'Try selecting different platforms or refresh to search again with your latest profile data.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        {incompleteProfile ? (
          <Button size="sm" render={<Link href="/dashboard/profile" />}>
            Complete profile
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
