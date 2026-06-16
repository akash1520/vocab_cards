export function addMinutes(from: Date, minutes: number): string {
  return new Date(from.getTime() + minutes * 60_000).toISOString()
}

export function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString()
}
