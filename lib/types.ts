export type Phase = "lobby" | "playing" | "punishment";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  ticket?: number[][];
  marked?: Record<string, true>;
  done?: boolean;
  submitted?: boolean;
  truthsCount?: number;
  daresCount?: number;
}

export interface Task {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
}

export interface GameState {
  turnOrder: string[];
  turnIndex: number;
  calledNumbers: number[];
  lastDrawn: number | null;
  winnerId: string | null;
}

export interface Punishment {
  assignedBy: string;
  assignedTo: string;
  assignedToName: string;
  type: "truth" | "dare";
  text: string;
  completed: boolean;
  assignedAt: number;
}

export interface Room {
  code: string;
  hostId: string;
  phase: Phase;
  createdAt: number;
  players: Record<string, Player>;
  truths?: Record<string, Task>;
  dares?: Record<string, Task>;
  game: GameState;
  punishment?: Punishment | null;
}