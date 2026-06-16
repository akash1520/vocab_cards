import '../styles/pageShell.css'

type StudyPageStatusProps = {
  message: string
  variant?: 'default' | 'error'
}

export function StudyPageStatus({
  message,
  variant = 'default',
}: StudyPageStatusProps) {
  const className =
    variant === 'error' ? 'page-status page-status--error' : 'page-status'

  return (
    <p className={className} role={variant === 'error' ? 'alert' : undefined}>
      {message}
    </p>
  )
}
