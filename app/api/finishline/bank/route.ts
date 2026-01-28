import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import FinishLineQuestionBank from "@/server/models/FinishLineQuestionBank";
import Match from "@/server/models/Match";

export const dynamic = 'force-dynamic';

/**
 * POST /api/finishline/bank
 * Create or update question bank for Finish Line Round
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { questions10pt, questions20pt, questions30pt, matchId } = body;

    // Validate minimum questions
    if (
      !questions10pt ||
      !questions20pt ||
      !questions30pt ||
      questions10pt.length < 3 ||
      questions20pt.length < 3 ||
      questions30pt.length < 3
    ) {
      return NextResponse.json(
        { error: "Must have at least 3 questions in each category (10pt, 20pt, 30pt)" },
        { status: 400 }
      );
    }

    // Auto-detect active match if not provided
    let targetMatchId = matchId;
    if (!targetMatchId) {
      const activeMatch = await Match.findOne({ isActive: true });
      if (!activeMatch) {
        return NextResponse.json(
          { error: "No active match found" },
          { status: 404 }
        );
      }
      targetMatchId = activeMatch._id.toString();
    }

    // Check if bank already exists for this match
    let bank = await FinishLineQuestionBank.findOne({ matchId: targetMatchId });

    if (bank) {
      // Update existing bank
      bank.questions10pt = questions10pt;
      bank.questions20pt = questions20pt;
      bank.questions30pt = questions30pt;
      await bank.save();
    } else {
      // Create new bank
      bank = new FinishLineQuestionBank({
        matchId: targetMatchId,
        questions10pt,
        questions20pt,
        questions30pt,
      });
      await bank.save();
    }

    const stats = bank.getUsageStats();

    return NextResponse.json({
      success: true,
      bankId: bank._id,
      matchId: targetMatchId,
      stats,
      message: bank ? "Question bank updated" : "Question bank created",
    });
  } catch (error: unknown) {
    console.error("Error creating/updating question bank:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save question bank";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/finishline/bank
 * Get question bank for active match or specified matchId
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    let bank;

    if (matchId) {
      bank = await FinishLineQuestionBank.findOne({ matchId });
    } else {
      // Get bank for active match
      const activeMatch = await Match.findOne({ isActive: true });
      if (!activeMatch) {
        return NextResponse.json(
          { error: "No active match found" },
          { status: 404 }
        );
      }
      bank = await FinishLineQuestionBank.findOne({
        matchId: activeMatch._id,
      });
    }

    if (!bank) {
      return NextResponse.json(
        { bank: null, message: "No question bank found" },
        { status: 200 }
      );
    }

    const stats = bank.getUsageStats();

    return NextResponse.json({
      success: true,
      bank: {
        _id: bank._id,
        matchId: bank.matchId,
        questions10pt: bank.questions10pt,
        questions20pt: bank.questions20pt,
        questions30pt: bank.questions30pt,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
      },
      stats,
    });
  } catch (error: unknown) {
    console.error("Error fetching question bank:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch question bank";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finishline/bank
 * Delete question bank for specified matchId
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required" },
        { status: 400 }
      );
    }

    const result = await FinishLineQuestionBank.deleteOne({ matchId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No question bank found for this match" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Question bank deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting question bank:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete question bank";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
