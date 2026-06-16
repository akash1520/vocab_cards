import { getDueWords } from '../api/wordsApi'
import type { Word } from '../api/types'

export type LoadDueWordsResult =
  | { ok: true; words: Word[] }
  | { ok: false; error: string }

export async function loadDueWords(): Promise<LoadDueWordsResult> {
  try {
    const words = await getDueWords()
    return { ok: true, words }
  } catch (loadError) {
    return {
      ok: false,
      error:
        loadError instanceof Error
          ? loadError.message
          : 'Request failed with status 0',
    }
  }
}
