type FlashCardFrontProps = {
  term: string
}

export function FlashCardFront({ term }: FlashCardFrontProps) {
  return (
    <div className="flash-card__face flash-card__face--front">
      <span className="flash-card__term">{term}</span>
      <span className="flash-card__hint">tap to flip</span>
    </div>
  )
}
