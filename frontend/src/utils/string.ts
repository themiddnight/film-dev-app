// utils/string.ts
// Shared string formatting utilities

/** Words that should NOT be capitalized unless they are the first word */
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the',
  'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'is',
  'out', 'off', 'per', 'via',
])

/**
 * Converts a snake_case or plain string to Title Case.
 * - Underscores are replaced with spaces
 * - Each word is capitalized, except conjunctions/prepositions/articles
 * - The first word is always capitalized regardless
 *
 * @example
 * toTitleCase('liquid_concentrate')  // "Liquid Concentrate"
 * toTitleCase('wash_aid')            // "Wash Aid"
 * toTitleCase('ready_to_use')        // "Ready to Use"
 * toTitleCase('diy')                 // "DIY"  ← short all-caps preserved
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return ''

  return str
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase()
      // Always capitalize the first word; lowercase conjunctions elsewhere
      if (index === 0 || !LOWERCASE_WORDS.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1)
      }
      return lower
    })
    .join(' ')
}
