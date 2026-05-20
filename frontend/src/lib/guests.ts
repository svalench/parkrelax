/** Склонение для строки гостей «N человек». */
export function formatGuestsLabel(people: number): string {
  let word: string
  if (people % 10 === 1 && people % 100 !== 11) {
    word = 'человек'
  } else if (people % 10 >= 2 && people % 10 <= 4 && (people % 100 < 10 || people % 100 >= 20)) {
    word = 'человека'
  } else {
    word = 'человек'
  }
  return `${people} ${word}`
}
