import { useState } from 'react'
import type { FormEvent } from 'react'
import { enrichWord } from '../../api/wordsApi'
import type { CreateWordInput } from '../../api/types'
import { buildCreateWordInput } from './buildCreateWordInput'
import { mapEnrichResponseToFormValues } from './mapEnrichResponseToFormValues'
import { WordFormField } from './WordFormField'
import {
  emptyWordFormValues,
  validateWordForm,
  type WordFormErrors,
  type WordFormValues,
} from './validateWordForm'
import './WordForm.css'

type WordFormProps = {
  onSubmit: (input: CreateWordInput) => Promise<void>
  submitError?: string | null
}

export function WordForm({ onSubmit, submitError = null }: WordFormProps) {
  const [values, setValues] = useState<WordFormValues>(emptyWordFormValues)
  const [fieldErrors, setFieldErrors] = useState<WordFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichError, setEnrichError] = useState<string | null>(null)

  function updateField<K extends keyof WordFormValues>(
    field: K,
    value: WordFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
  }

  function resetForm() {
    setValues(emptyWordFormValues)
    setFieldErrors({})
    setEnrichError(null)
  }

  async function handleEnrich() {
    const term = values.term.trim()
    if (!term) {
      setFieldErrors((current) => ({ ...current, term: 'Term is required' }))
      return
    }

    setIsEnriching(true)
    setEnrichError(null)

    try {
      const response = await enrichWord(term)
      setValues(mapEnrichResponseToFormValues(response))
      setFieldErrors({})
    } catch (error) {
      setEnrichError(
        error instanceof Error ? error.message : 'Failed to fill with AI',
      )
    } finally {
      setIsEnriching(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateWordForm(values)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(buildCreateWordInput(values))
      resetForm()
    } catch {
      // Keep entered values when submission fails.
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isSubmitting || isEnriching

  return (
    <form className="word-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="word-form__term-row">
        <WordFormField
          id="term"
          label="Term"
          value={values.term}
          error={fieldErrors.term}
          onChange={(value) => updateField('term', value)}
        />
        <button
          type="button"
          className="word-form__enrich"
          disabled={isBusy}
          onClick={() => void handleEnrich()}
        >
          {isEnriching ? 'Filling…' : 'Fill with AI'}
        </button>
      </div>
      <WordFormField
        id="part_of_speech"
        label="Part of speech"
        value={values.part_of_speech}
        error={fieldErrors.part_of_speech}
        onChange={(value) => updateField('part_of_speech', value)}
      />
      <WordFormField
        id="definition"
        label="Definition"
        value={values.definition}
        error={fieldErrors.definition}
        onChange={(value) => updateField('definition', value)}
        multiline
      />
      <WordFormField
        id="synonyms"
        label="Synonyms"
        value={values.synonyms}
        onChange={(value) => updateField('synonyms', value)}
        placeholder="comma-separated"
      />
      <WordFormField
        id="example_sentence"
        label="Example sentence"
        value={values.example_sentence}
        error={fieldErrors.example_sentence}
        onChange={(value) => updateField('example_sentence', value)}
        multiline
      />

      {enrichError ? (
        <p className="word-form__error word-form__error--submit" role="alert">
          {enrichError}
        </p>
      ) : null}

      {submitError ? (
        <p className="word-form__error word-form__error--submit" role="alert">
          {submitError}
        </p>
      ) : null}

      <button type="submit" className="word-form__submit" disabled={isBusy}>
        Add word
      </button>
    </form>
  )
}
