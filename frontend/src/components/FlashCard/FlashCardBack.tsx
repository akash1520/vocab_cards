import type { Word } from '../../api/types'
import { formatSynonyms } from './formatSynonyms'

type FlashCardBackProps = Pick<
  Word,
  'part_of_speech' | 'definition' | 'synonyms' | 'example_sentence'
>

export function FlashCardBack({
  part_of_speech,
  definition,
  synonyms,
  example_sentence,
}: FlashCardBackProps) {
  const synonymText = formatSynonyms(synonyms)

  return (
    <div className="flash-card__face flash-card__face--back">
      <p className="flash-card__definition">
        <span className="flash-card__part-of-speech">{part_of_speech}:</span>{' '}
        {definition}
      </p>
      {synonymText ? (
        <p className="flash-card__synonyms">Synonyms: {synonymText}</p>
      ) : null}
      <p className="flash-card__example">
        <em>{example_sentence}</em>
      </p>
    </div>
  )
}
