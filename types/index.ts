export interface Player {
    _id: string;
    name: string;
    scores: {
        warmup: number;
        obstacles: number;
        acceleration: number;
        finish: number;
        total: number;
    };
    meta?: unknown;
}

export interface Question {
    id: string;
    content: string;
    description: string;
}
