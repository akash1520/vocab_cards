import { submitReview } from '../api/wordsApi'
import type { Word } from '../api/types'

export async function reviewWord(word: Word, knewIt: boolean): Promise<void> {
  await submitReview(word.id, { knew_it: knewIt })
}
