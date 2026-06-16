type StudyPageStatusProps = {
  message: string
  variant?: 'default' | 'error'
}

export function StudyPageStatus({
  message,
  variant = 'default',
}: StudyPageStatusProps) {
  const className =
    variant === 'error'
      ? 'study-page__status study-page__status--error'
      : 'study-page__status'

  return (
    <p className={className} role={variant === 'error' ? 'alert' : undefined}>
      {message}
    </p>
  )
}
