import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type JobsErrorStateProps = {
  message: string
  onRetry?: () => void
  isRetrying?: boolean
}

export function JobsErrorState({
  message,
  onRetry,
  isRetrying = false,
}: JobsErrorStateProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-destructive" />
          <CardTitle className="text-base">Unable to load latest jobs</CardTitle>
        </div>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={isRetrying ? 'animate-spin' : ''} />
            Try again
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
