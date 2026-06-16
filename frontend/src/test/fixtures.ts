import type { Word } from '../api/types'

export const sampleWord: Word = {
  id: 'word-1',
  term: 'unnerve',
  part_of_speech: 'verb',
  definition: 'to make nervous or upset',
  synonyms: ['enervate', 'faze', 'unsettle'],
  example_sentence:
    'At one time unnerved by math problems, she began avidly studying.',
  ease_factor: 2.5,
  interval_days: 0,
  repetitions: 0,
  next_review_at: null,
  status: 'new',
}
