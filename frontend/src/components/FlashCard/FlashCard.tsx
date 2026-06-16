import { useState } from 'react'
import type { Word } from '../../api/types'
import { FlashCardBack } from './FlashCardBack'
import { FlashCardFront } from './FlashCardFront'
import './FlashCard.css'

type FlashCardProps = {
  word: Word
  onFlipChange?: (isFlipped: boolean) => void
}

export function FlashCard({ word, onFlipChange }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  function toggleFlip() {
    setIsFlipped((flipped) => {
      const nextFlipped = !flipped
      onFlipChange?.(nextFlipped)
      return nextFlipped
    })
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
        {isFlipped ? (
          <FlashCardBack
            part_of_speech={word.part_of_speech}
            definition={word.definition}
            synonyms={word.synonyms}
            example_sentence={word.example_sentence}
          />
        ) : (
          <FlashCardFront term={word.term} />
        )}
      </div>
    </button>
  )
}
