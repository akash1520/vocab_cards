import type { EnrichWordResponse } from '../../api/types'
import type { WordFormValues } from './validateWordForm'

export function mapEnrichResponseToFormValues(
  response: EnrichWordResponse,
): WordFormValues {
  return {
    term: response.term,
    part_of_speech: response.part_of_speech,
    definition: response.definition,
    synonyms: response.synonyms.join(', '),
    example_sentence: response.example_sentence,
  }
}
