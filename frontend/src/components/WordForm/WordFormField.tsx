type WordFormFieldProps = {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
}

export function WordFormField({
  id,
  label,
  value,
  error,
  onChange,
  multiline = false,
  placeholder,
}: WordFormFieldProps) {
  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <div className="word-form__field">
      <label htmlFor={id}>{label}</label>
      <InputComponent
        id={id}
        name={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="word-form__error">{error}</p> : null}
    </div>
  )
}
