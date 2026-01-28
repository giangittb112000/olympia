export interface WarmUpState {
    status: 'IDLE' | 'READY' | 'PLAYING' | 'FINISHED';
    
    // Setup
    currentPlayerId: string | null;
    currentPlayerName?: string;
    currentPackId: string | null;
    currentPackName?: string;
    
    // Runtime
    currentQuestion: {
        id: string;
        content: string;
        description: string;
    } | null;
    timer: number;
    totalScoreReceived: number;
    lastAnswer?: {
        result: 'CORRECT' | 'WRONG' | 'PASS';
        timestamp: number;
    };
    
    // Preview (Realtime Selection)
    previewSelectedPlayerId?: string | null;
    previewSelectedPlayerName?: string;
    previewSelectedPackId?: string | null;
    previewSelectedPackName?: string;
}

export interface ObstacleState { // Definition
    status: 'FINISHED' | 'IDLE' | 'SHOW_ROW' | 'THINKING' | 'ROW_GRADING' | 'CNV_GUESSING';
    
    // Resource Info
    resourceId?: string;
    
    // Display State
    currentImage: string; // URL (could be masked in FE)
    imageRevealed: boolean; // Explicitly show full image
    revealedPieces: boolean[]; // [TopLeft, TopRight, BottomLeft, BottomRight, Center]
    finalCNV: string;
    
    // Row Logic
    currentRowIndex: number; // -1 if none
    currentRowQuestion?: string;
    currentRowLength?: number;
    
    rowLengths: number[]; // Length of each row answer
    rowContents: string[]; // Revealed content of each row (empty if hidden)

    rowResults: {
        isSolved: boolean;
        answer: string;
    }[]; // 0-3

    // Timer & Answers
    timer: number;
    answers: Record<string, string>; // playerId -> answer string
    grading: Record<string, 'CORRECT' | 'WRONG' | 'NONE'>; // playerId -> status


    // CNV Logic
    cnvLocked: boolean; // Just a generic lock, or specific?
    buzzerQueue: {
        playerId: string;
        timestamp: number;
        isProcessed: boolean;
    }[];
    eliminatedPlayerIds: string[];
}

export interface AccelerationState {
    // Current Question
    questionNumber: 1 | 2 | 3 | 4 | null;  // null = chưa bắt đầu
    
    // Media Display
    mediaType?: 'VIDEO' | 'IMAGE';
    mediaUrl?: string;
    questionText?: string;
    questionDescription?: string;
    referenceAnswer?: string;              // Đáp án tham khảo (chỉ MC thấy)
    
    // Timer
    isTimerRunning: boolean;
    timeLeft: number;                      // Countdown (30s)
    
    // Answers Collection
    answers: {
        playerId: string;
        playerName: string;
        answer: string;
        submittedAt: number;               // Timestamp submit (để sort)
        responseTime: number;              // Thời gian còn lại khi submit (dùng để ranking)
        isCorrect?: boolean;               // MC CHẤM THỦ CÔNG (không auto-grade)
        score: number;                     // 40/30/20/10 hoặc 0 (MC set khi grade)
    }[];
    
    // Control
    status: 'IDLE' | 'PLAYING' | 'GRADING' | 'FINISHED';
    resourceId?: string;
}

export interface FinishLineState {
    status: "IDLE" | "PACK_SELECTION" | "STAR_SELECTION" | "PLAYING_QUESTION" | "FINISHED";
    selectedPlayerId?: string;
    selectedPlayerName?: string;
    starUsedPlayerIds?: string[]; // Track who used the star
    availablePacks?: Array<{ packType: 40 | 60 | 80; count: number }>;
    currentPack?: {
        packId: string;
        packType: 40 | 60 | 80;
        ownerId: string;
        ownerName: string;
        questions: Array<{
            questionId: string;
            questionText: string;
            questionDescription?: string;
            mediaType?: "VIDEO" | "IMAGE" | "AUDIO";
            mediaUrl?: string;
            referenceAnswer: string;
            points: 10 | 20 | 30;
            answer?: {
                playerId: string;
                playerName: string;
                answerText: string;
                submittedAt: number;
                isCorrect: boolean;
                pointsEarned: number;
            } | null;
            starActivated?: boolean;
            stealAttempts?: Array<{
                playerId: string;
                playerName: string;
                answerText: string;
                isCorrect: boolean;
                pointsEarned: number;
                timestamp: number;
            }>;
        }>;
    };
    currentQuestionIndex: number;
    isTimerRunning: boolean;
    timeLeft: number;
    buzzerEnabled: boolean;
    buzzerQueue: Array<{
        playerId: string;
        playerName: string;
        buzzTime: number;
    }>;
    selectedStealerId?: string;
    finishedPlayerIds?: string[];
    bankId?: string;
}

export const POINTS = {
    WARM_UP: {
        CORRECT: 10,
    },
    OBSTACLE: {
        ROW_CORRECT: 10,
        OBSTACLE_CORRECT_BEFORE_2: 80,
        OBSTACLE_CORRECT_AFTER_2: 60,
        OBSTACLE_CORRECT_AFTER_3: 40,
        OBSTACLE_CORRECT_LAST: 20,
    },
    ACCELERATION: {
        FIRST: 40,
        SECOND: 30,
        THIRD: 20,
        FOURTH: 10,
    },
    FINISH: {
        PACKAGES: [20, 40, 60],
        STAR_MULTIPLIER: 2,
        STEAL_PENALTY_5: 5,
        STEAL_PENALTY_10: 10,
        STEAL_PENALTY_15: 15,
    }
};

export const TIMERS = {
    WARM_UP: 60,
    OBSTACLE: {
        ROW_THINKING: 15,
        CNV_THINKING: 15,
    },
    ACCELERATION: 30,
    FINISH: {
        Q20: 15,
        Q40: 20,
        Q60: 30,
    }
};
