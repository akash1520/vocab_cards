import { useState } from 'react'
import type { Word } from '../../api/types'
import './FlashCard.css'

type FlashCardProps = {
  word: Word
}

export function FlashCard({ word }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  function toggleFlip() {
    setIsFlipped((flipped) => !flipped)
  }

  return (
    <button
      type="button"
      className={`flash-card${isFlipped ? ' flash-card--flipped' : ''}`}
      aria-label={word.term}
      aria-pressed={isFlipped}
      onClick={toggleFlip}
    >
      <div className="flash-card__inner">
        {!isFlipped ? (
          <div className="flash-card__face flash-card__face--front">
            <span className="flash-card__term">{word.term}</span>
            <span className="flash-card__hint">tap to flip</span>
          </div>
        ) : (
          <div className="flash-card__face flash-card__face--back">
            <p className="flash-card__definition">
              <span className="flash-card__part-of-speech">
                {word.part_of_speech}:
              </span>{' '}
              {word.definition}
            </p>
            {word.synonyms.length > 0 ? (
              <p className="flash-card__synonyms">
                Synonyms: {word.synonyms.join(', ')}
              </p>
            ) : null}
            <p className="flash-card__example">
              <em>{word.example_sentence}</em>
            </p>
          </div>
        )}
      </div>
    </button>
  )
}
