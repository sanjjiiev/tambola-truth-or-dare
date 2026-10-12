
import {
  ref, get, set, update, onValue, runTransaction, Unsubscribe,
} from "firebase/database";
import { db } from "./firebase";
import { generateTicket, ticketNumbers, shuffle } from "./tambola";
import type { Room } from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function randomCode(len = 5): string {
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

/* ----------------------------- LOBBY ----------------------------- */

export async function createRoom(hostId: string, hostName: string): Promise<string> {
  let code = randomCode();
  for (let i = 0; i < 8; i++) {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) break;
    code = randomCode();
  }
  const room: Room = {
    code,
    hostId,
    phase: "lobby",
    createdAt: Date.now(),
    players: {
      [hostId]: {
        id: hostId, name: hostName, isHost: true, joinedAt: Date.now(),
        marked: {}, done: false, submitted: false, truthsCount: 0, daresCount: 0,
      },
    },
    truths: {},
    dares: {},
    game: { turnOrder: [], turnIndex: 0, calledNumbers: [], lastDrawn: null, winnerId: null },
    punishment: null,
  };
  await set(ref(db, `rooms/${code}`), room);
  return code;
}

export async function joinRoom(code: string, playerId: string, name: string): Promise<void> {
  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) throw new Error("Room not found. Check the code.");
  const room = snap.val() as Room;
  if (room.players?.[playerId]) {
    await update(ref(db, `rooms/${code}/players/${playerId}`), { name });
    return;
  }
  if (room.phase !== "lobby") throw new Error("This party has already started.");
  await update(ref(db, `rooms/${code}/players/${playerId}`), {
    id: playerId, name, isHost: false, joinedAt: Date.now(),
    marked: {}, done: false, submitted: false, truthsCount: 0, daresCount: 0,
  });
}

export function subscribeRoom(code: string, cb: (room: Room | null) => void): Unsubscribe {
  return onValue(ref(db, `rooms/${code}`), (snap) => cb(snap.val() as Room | null));
}

/* --------------------------- SETUP PHASE --------------------------- */

export async function submitTasks(
  code: string, playerId: string, name: string, truths: string[], dares: string[]
) {
  const t = truths.map((x) => x.trim()).filter(Boolean);
  const d = dares.map((x) => x.trim()).filter(Boolean);
  const updates: Record<string, unknown> = {};

  t.forEach((text, i) => {
    const id = `${playerId}_t${i}`;
    updates[`rooms/${code}/truths/${id}`] = { id, text, authorId: playerId, authorName: name };
  });
  d.forEach((text, i) => {
    const id = `${playerId}_d${i}`;
    updates[`rooms/${code}/dares/${id}`] = { id, text, authorId: playerId, authorName: name };
  });

  updates[`rooms/${code}/players/${playerId}/submitted`] = true;
  updates[`rooms/${code}/players/${playerId}/truthsCount`] = t.length;
  updates[`rooms/${code}/players/${playerId}/daresCount`] = d.length;

  await update(ref(db), updates);
}

/* --------------------------- START GAME --------------------------- */

export async function startGame(code: string) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val() as Room;
  const ids = Object.keys(room.players || {});
  if (ids.length < 2) throw new Error("Need at least 2 players to start.");
  if (!ids.every((id) => room.players[id].submitted))
    throw new Error("Everyone must submit their Truths & Dares first.");

  const updates: Record<string, unknown> = {};
  ids.forEach((id) => {
    updates[`rooms/${code}/players/${id}/ticket`] = generateTicket();
    updates[`rooms/${code}/players/${id}/marked`] = {};
    updates[`rooms/${code}/players/${id}/done`] = false;
  });
  updates[`rooms/${code}/game`] = {
    turnOrder: shuffle(ids),
    turnIndex: 0,
    calledNumbers: [],
    lastDrawn: null,
    winnerId: null,
  };
  updates[`rooms/${code}/phase`] = "playing";
  updates[`rooms/${code}/punishment`] = null;

  await update(ref(db), updates);
}

/* --------------------------- GAMEPLAY --------------------------- */

/** Draw a number. Atomic — only the current turn holder can, and only when idle. */
export async function drawNumber(code: string, playerId: string): Promise<boolean> {
  const res = await runTransaction(ref(db, `rooms/${code}`), (room: Room | null) => {
    if (!room || room.phase !== "playing") return room;
    const g = room.game;
    if (!g || g.lastDrawn != null) return room;               // already drawn → waiting
    const order = g.turnOrder || [];
    if (order[g.turnIndex] !== playerId) return room;          // not your turn
    const called = new Set(g.calledNumbers || []);
    const remaining: number[] = [];
    for (let n = 1; n <= 90; n++) if (!called.has(n)) remaining.push(n);
    if (!remaining.length) return room;

    const n = remaining[Math.floor(Math.random() * remaining.length)];
    g.calledNumbers = [...(g.calledNumbers || []), n];
    g.lastDrawn = n;
    Object.values(room.players || {}).forEach((p) => { p.done = false; });
    return room;
  });
  return res.committed;
}

/** Mark / unmark a number on your own ticket. */
export async function toggleMark(code: string, playerId: string, num: number, on: boolean) {
  await update(ref(db, `rooms/${code}/players/${playerId}/marked`), { [num]: on ? true : null });
}

/** Click "Done". When the LAST player clicks, the turn auto-advances atomically. */
export async function markDone(code: string, playerId: string) {
  await runTransaction(ref(db, `rooms/${code}`), (room: Room | null) => {
    if (!room || room.phase !== "playing") return room;
    const g = room.game;
    if (!g || g.lastDrawn == null) return room;                // nothing to acknowledge
    if (!room.players?.[playerId]) return room;

    room.players[playerId].done = true;

    const ids = Object.keys(room.players);
    if (ids.every((id) => room.players[id].done)) {
      const len = (g.turnOrder || []).length || 1;
      g.turnIndex = ((g.turnIndex || 0) + 1) % len;
      g.lastDrawn = null;
      ids.forEach((id) => { room.players[id].done = false; });
    }
    return room;
  });
}

/** Verify against server-called numbers, then flip to the punishment phase. */
export async function claimFullHouse(code: string, playerId: string) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val() as Room;
  if (!room || room.phase !== "playing") return { ok: false, reason: "The game isn't running." };

  const me = room.players?.[playerId];
  if (!me?.ticket) return { ok: false, reason: "No ticket found." };

  const nums = ticketNumbers(me.ticket);
  const called = new Set(room.game?.calledNumbers || []);
  const missing = nums.filter((n) => !called.has(n));
  if (missing.length)
    return { ok: false, reason: `${missing.length} of your numbers haven't been called yet.` };

  await update(ref(db), {
    [`rooms/${code}/phase`]: "punishment",
    [`rooms/${code}/game/winnerId`]: playerId,
    [`rooms/${code}/punishment`]: null,
  });
  return { ok: true };
}

/* ------------------------ PUNISHMENT PHASE ------------------------ */

export async function assignPunishment(
  code: string, winnerId: string, targetId: string, targetName: string,
  type: "truth" | "dare", text: string
) {
  await update(ref(db, `rooms/${code}/punishment`), {
    assignedBy: winnerId,
    assignedTo: targetId,
    assignedToName: targetName,
    type,
    text,
    completed: false,
    assignedAt: Date.now(),
  });
}

/** "Task Completed" → wipe the board and return everyone to the lobby. */
export async function completeTaskAndReset(code: string) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val() as Room;

  const updates: Record<string, unknown> = {
    [`rooms/${code}/phase`]: "lobby",
    [`rooms/${code}/truths`]: null,
    [`rooms/${code}/dares`]: null,
    [`rooms/${code}/punishment`]: null,
    [`rooms/${code}/game`]: { turnOrder: [], turnIndex: 0, calledNumbers: [], lastDrawn: null, winnerId: null },
  };
  Object.keys(room.players || {}).forEach((id) => {
    updates[`rooms/${code}/players/${id}/ticket`] = null;
    updates[`rooms/${code}/players/${id}/marked`] = {};
    updates[`rooms/${code}/players/${id}/done`] = false;
    updates[`rooms/${code}/players/${id}/submitted`] = false;
    updates[`rooms/${code}/players/${id}/truthsCount`] = 0;
    updates[`rooms/${code}/players/${id}/daresCount`] = 0;
  });
  await update(ref(db), updates);
}

export async function leaveRoom(code: string, playerId: string) {
  await update(ref(db), { [`rooms/${code}/players/${playerId}`]: null });
}