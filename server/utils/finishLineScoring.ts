/**
 * Scoring utility for Finish Line Round
 * Handles normal scoring, star multiplier, and steal penalties
 */

/**
 * Calculate penalty for wrong steal attempt
 * Penalty is half of question points, rounded to nearest 5
 * 
 * @param questionPoints - Original question points (10, 20, or 30)
 * @returns Penalty amount (5, 10, or 15)
 */
export function calculatePenalty(questionPoints: 10 | 20 | 30): number {
  const half = questionPoints / 2;
  // Round to nearest 5
  return Math.round(half / 5) * 5;
}

/**
 * Calculate score for main player's answer
 * 
 * Scoring rules:
 * - Normal correct: +points
 * - Normal wrong: 0
 * - Star correct: +points × 2
 * - Star wrong: -points
 * 
 * @param questionPoints - Question points (10, 20, or 30)
 * @param isCorrect - Whether answer is correct
 * @param starActivated - Whether star was activated
 * @param isSteal - Whether this is a steal attempt (for future use)
 * @returns Points earned (can be negative)
 */
export function calculateScore(
  questionPoints: 10 | 20 | 30,
  isCorrect: boolean,
  starActivated: boolean,
  isSteal: boolean = false
): number {
  if (isSteal) {
    // Steal scoring handled by calculateStealScores
    return 0;
  }

  if (!isCorrect) {
    // Wrong answer
    if (starActivated) {
      return -questionPoints; // Star wrong: -points
    }
    return 0; // Normal wrong: 0
  }

  // Correct answer
  if (starActivated) {
    return questionPoints * 2; // Star correct: x2
  }
  return questionPoints; // Normal correct: +points
}

/**
 * Calculate score changes for steal attempt
 * 
 * Scoring rules:
 * - Steal correct: Stealer +points, Owner -points
 * - Steal wrong: Stealer -penalty (half points), Owner +0
 * 
 * @param questionPoints - Question points (10, 20, or 30)
 * @param isCorrect - Whether steal answer is correct
 * @param starWasActivated - Whether star was activated (affects penalty)
 * @returns Object with score changes for stealer and owner
 */
export function calculateStealScores(
  questionPoints: 10 | 20 | 30,
  isCorrect: boolean,
  _starWasActivated: boolean = false // Prefix with _ to indicate intentionally unused
): {
  stealer: number;
  owner: number;
} {
  if (isCorrect) {
    // Steal success
    return {
      stealer: questionPoints, // Stealer gains points
      owner: -questionPoints, // Owner loses points
    };
  } else {
    // Steal fail
    const penalty = calculatePenalty(questionPoints);
    return {
      stealer: -penalty, // Stealer loses penalty
      owner: 0, // Owner gets nothing
    };
  }
}
