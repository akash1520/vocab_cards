type StudyActionButtonProps = {
  label: string
  variant: 'learning' | 'know'
  disabled: boolean
  onClick: () => void
}

export function StudyActionButton({
  label,
  variant,
  disabled,
  onClick,
}: StudyActionButtonProps) {
  return (
    <button
      type="button"
      className={`study-controls__button study-controls__button--${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
