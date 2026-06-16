export type WordFormValues = {
  term: string
  part_of_speech: string
  definition: string
  synonyms: string
  example_sentence: string
}

export type WordFormField = keyof WordFormValues

export type WordFormErrors = Partial<Record<WordFormField | 'form', string>>

export const emptyWordFormValues: WordFormValues = {
  term: '',
  part_of_speech: '',
  definition: '',
  synonyms: '',
  example_sentence: '',
}

export function validateWordForm(values: WordFormValues): WordFormErrors {
  const errors: WordFormErrors = {}

  if (!values.term.trim()) {
    errors.term = 'Term is required'
  }

  if (!values.part_of_speech.trim()) {
    errors.part_of_speech = 'Part of speech is required'
  }

  if (!values.definition.trim()) {
    errors.definition = 'Definition is required'
  }

  if (!values.example_sentence.trim()) {
    errors.example_sentence = 'Example sentence is required'
  }

  return errors
}
