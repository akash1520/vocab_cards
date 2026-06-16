import type { CreateWordInput } from '../../api/types'
import { parseSynonymsInput } from './parseSynonymsInput'
import type { WordFormValues } from './validateWordForm'

export function buildCreateWordInput(values: WordFormValues): CreateWordInput {
  return {
    term: values.term.trim(),
    part_of_speech: values.part_of_speech.trim(),
    definition: values.definition.trim(),
    example_sentence: values.example_sentence.trim(),
    synonyms: parseSynonymsInput(values.synonyms),
  }
}
