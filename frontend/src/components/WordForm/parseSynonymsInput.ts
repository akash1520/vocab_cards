export function parseSynonymsInput(value: string): string[] | undefined {
  const synonyms = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return synonyms.length > 0 ? synonyms : undefined
}
