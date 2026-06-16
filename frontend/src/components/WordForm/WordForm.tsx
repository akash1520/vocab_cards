import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CreateWordInput } from '../../api/types'
import { parseSynonymsInput } from './parseSynonymsInput'
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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateWordForm(values)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    const synonyms = parseSynonymsInput(values.synonyms)
    const payload: CreateWordInput = {
      term: values.term.trim(),
      part_of_speech: values.part_of_speech.trim(),
      definition: values.definition.trim(),
      example_sentence: values.example_sentence.trim(),
      synonyms,
    }

    setIsSubmitting(true)

    try {
      await onSubmit(payload)
      resetForm()
    } catch {
      // Keep entered values when submission fails.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="word-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="word-form__field">
        <label htmlFor="term">Term</label>
        <input
          id="term"
          name="term"
          value={values.term}
          onChange={(event) => updateField('term', event.target.value)}
        />
        {fieldErrors.term ? (
          <p className="word-form__error">{fieldErrors.term}</p>
        ) : null}
      </div>

      <div className="word-form__field">
        <label htmlFor="part_of_speech">Part of speech</label>
        <input
          id="part_of_speech"
          name="part_of_speech"
          value={values.part_of_speech}
          onChange={(event) =>
            updateField('part_of_speech', event.target.value)
          }
        />
        {fieldErrors.part_of_speech ? (
          <p className="word-form__error">{fieldErrors.part_of_speech}</p>
        ) : null}
      </div>

      <div className="word-form__field">
        <label htmlFor="definition">Definition</label>
        <textarea
          id="definition"
          name="definition"
          value={values.definition}
          onChange={(event) => updateField('definition', event.target.value)}
        />
        {fieldErrors.definition ? (
          <p className="word-form__error">{fieldErrors.definition}</p>
        ) : null}
      </div>

      <div className="word-form__field">
        <label htmlFor="synonyms">Synonyms</label>
        <input
          id="synonyms"
          name="synonyms"
          value={values.synonyms}
          onChange={(event) => updateField('synonyms', event.target.value)}
          placeholder="comma-separated"
        />
      </div>

      <div className="word-form__field">
        <label htmlFor="example_sentence">Example sentence</label>
        <textarea
          id="example_sentence"
          name="example_sentence"
          value={values.example_sentence}
          onChange={(event) =>
            updateField('example_sentence', event.target.value)
          }
        />
        {fieldErrors.example_sentence ? (
          <p className="word-form__error">{fieldErrors.example_sentence}</p>
        ) : null}
      </div>

      {submitError ? (
        <p className="word-form__error word-form__error--submit" role="alert">
          {submitError}
        </p>
      ) : null}

      <button type="submit" className="word-form__submit" disabled={isSubmitting}>
        Add word
      </button>
    </form>
  )
}
