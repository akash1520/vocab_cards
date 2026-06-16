export type WordStatus = 'new' | 'learning' | 'review' | 'mastered'

export type Word = {
  id: string
  term: string
  part_of_speech: string
  definition: string
  synonyms: string[]
  example_sentence: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string | null
  status: WordStatus
}

export type CreateWordInput = {
  term: string
  part_of_speech: string
  definition: string
  synonyms?: string[]
  example_sentence: string
}

export type ReviewPayload = {
  knew_it: boolean
}

export type EnrichWordResponse = {
  term: string
  part_of_speech: string
  definition: string
  synonyms: string[]
  example_sentence: string
}
