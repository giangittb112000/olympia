import FinishLineQuestionBank, { IQuestion } from "../models/FinishLineQuestionBank";
import crypto from "crypto";

interface IGeneratedQuestion extends IQuestion {
  questionId: string;
}

interface IGeneratePackResult {
  success: boolean;
  packId?: string;
  questions?: IGeneratedQuestion[];
  error?: string;
}

/**
 * Helper to pick random questions from a list
 */
function pickRandomQuestions(questions: IQuestion[], count: number): IQuestion[] {
  if (questions.length < count) {
    throw new Error(`Not enough questions. Need ${count}, found ${questions.length}`);
  }
  
  // Shuffle and pick
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate a pack of questions for a player
 * @param matchId - Match ID
 * @param playerId - Player ID requesting the pack (unused but kept for logging/tracking)
 * @param packType - 40, 60, or 80
 */
export async function generatePack(
  matchId: string,
  playerId: string,
  packType: 40 | 60 | 80
): Promise<IGeneratePackResult> {
  try {
    const bank = await FinishLineQuestionBank.findOne({ matchId });
    if (!bank) {
      return { success: false, error: "Question bank not found" };
    }

    const selectedQuestions: IQuestion[] = [];
    const packId = crypto.randomUUID();

    // Define structure based on pack type
    // 40 points: 1x10, 1x10, 1x20 (Total 40)
    // 60 points: 1x10, 1x20, 1x30 (Total 60)
    // 80 points: 1x20, 1x30, 1x30 (Total 80)
    
    // Check usage and pick
    const q10 = bank.questions10pt.filter((q: IQuestion) => !q.isUsed);
    const q20 = bank.questions20pt.filter((q: IQuestion) => !q.isUsed);
    const q30 = bank.questions30pt.filter((q: IQuestion) => !q.isUsed);

    try {
      if (packType === 40) {
        // Need 2x10, 1x20
        const picked10 = pickRandomQuestions(q10, 2);
        const picked20 = pickRandomQuestions(q20, 1);
        selectedQuestions.push(...picked10, ...picked20);
      } else if (packType === 60) {
        // Need 1x10, 1x20, 1x30
        const picked10 = pickRandomQuestions(q10, 1);
        const picked20 = pickRandomQuestions(q20, 1);
        const picked30 = pickRandomQuestions(q30, 1);
        selectedQuestions.push(...picked10, ...picked20, ...picked30);
      } else if (packType === 80) {
        // Need 1x20, 2x30
        const picked20 = pickRandomQuestions(q20, 1);
        const picked30 = pickRandomQuestions(q30, 2);
        selectedQuestions.push(...picked20, ...picked30);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: errorMessage || "Not enough questions in bank" };
    }

    // Mark questions as used
    selectedQuestions.forEach((q) => {
      q.isUsed = true;
    });

    // Explicitly mark arrays as modified to ensure updates are saved
    bank.markModified('questions10pt');
    bank.markModified('questions20pt');
    bank.markModified('questions30pt');
    
    await bank.save();

    // Transform to IGeneratedQuestion (add questionId)
    const questionsWithId: IGeneratedQuestion[] = selectedQuestions.map((q) => {
        // Safe access to toObject if it exists (for Mongoose Documents)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const questionDoc = q as any;
        const questionObj = (typeof questionDoc.toObject === 'function') 
          ? questionDoc.toObject() 
          : q;
          
        return {
          ...questionObj,
          questionId: crypto.randomUUID(),
          // Ensure properties exist explicitly if needed
          mediaType: q.mediaType,
          mediaUrl: q.mediaUrl,
          questionDescription: q.questionDescription
        };
    });

    return {
      success: true,
      packId,
      questions: questionsWithId
    };

  } catch (error) {
    console.error("Error generating pack:", error);
    return { success: false, error: "Internal server error" };
  }
}
