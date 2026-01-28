import { compareTwoStrings } from "string-similarity";

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Remove Vietnamese accents
 * - Remove extra whitespace
 * - Keep alphanumeric and basic punctuation
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  // Lowercase
  let normalized = text.toLowerCase().trim();

  // Remove Vietnamese accents
  normalized = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, " ");

  return normalized;
}

/**
 * Check if player's answer matches the reference answer
 * Uses fuzzy string matching with 80% similarity threshold
 * 
 * @param playerAnswer - Answer submitted by player
 * @param referenceAnswer - Correct answer from question bank
 * @param threshold - Similarity threshold (default: 0.8 = 80%)
 * @returns true if answer is correct (>= threshold)
 */
export function checkAnswer(
  playerAnswer: string,
  referenceAnswer: string,
  threshold: number = 0.8
): boolean {
  const normalizedPlayer = normalizeText(playerAnswer);
  const normalizedReference = normalizeText(referenceAnswer);

  // Exact match after normalization
  if (normalizedPlayer === normalizedReference) {
    return true;
  }

  // Fuzzy match using string-similarity
  const similarity = compareTwoStrings(normalizedPlayer, normalizedReference);

  return similarity >= threshold;
}

/**
 * Get similarity score between two strings
 * @returns Similarity score between 0 and 1
 */
export function getSimilarityScore(
  playerAnswer: string,
  referenceAnswer: string
): number {
  const normalizedPlayer = normalizeText(playerAnswer);
  const normalizedReference = normalizeText(referenceAnswer);

  return compareTwoStrings(normalizedPlayer, normalizedReference);
}
