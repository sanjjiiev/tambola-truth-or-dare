"use client";
import { useMemo, useState } from "react";
import type { Room } from "@/lib/types";
import { TambolaTicket } from "./TambolaTicket";
import { Btn } from "./ui";
import { drawNumber, markDone, toggleMark, claimFullHouse } from "@/lib/room";

export function GamePhase({ room, playerId }: { room: Room; playerId: string }) {
  const me = room.players[playerId];
  const game = room.game;

  const players = useMemo(
    () => Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt),
    [room.players]
  );
  const order = game.turnOrder || [];
  const currentTurnId = order[game.turnIndex];
  const currentTurnName = room.players[currentTurnId]?.name ?? "—";
  const isMyTurn = currentTurnId === playerId;
  const waiting = game.lastDrawn != null;
  const doneCount = players.filter((p) => p.done).length;
  const calledNumbers = game.calledNumbers || [];

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [claiming, setClaiming] = useState(false);

  async function handleDraw() {
    setMsg(null);
    await drawNumber(room.code, playerId);
  }

  async function handleClaim() {
    setClaiming(true); setMsg(null);
    const res = await claimFullHouse(room.code, playerId);
    if (!res.ok) setMsg({ ok: false, text: res.reason || "Not yet!" });
    setClaiming(false);
  }

  return (
    <main className="eerie-bg relative min-h-dvh px-4 pb-40 pt-5">
      <div className="relative z-10 mx-auto max-w-md space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs tracking-[0.25em] text-white/70">
            {room.code}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Tambola · Round {calledNumbers.length + (waiting ? 0 : 1)}
          </span>
        </div>

        {/* Turn banner */}
        <div
          className={`rounded-3xl px-4 py-3.5 text-center ring-1 backdrop-blur-md transition-all ${
            isMyTurn
              ? "bg-mango/20 ring-mango/50 shadow-[0_0_35px_-8px_rgba(255,154,98,.7)]"
              : "bg-white/5 ring-white/10"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
            {waiting ? "Everyone marking…" : "Now calling"}
          </p>
          <p className="mt-0.5 text-lg font-black text-white">
            {waiting ? `${doneCount}/${players.length} done` : isMyTurn ? "It's YOUR turn" : `${currentTurnName}'s turn`}
          </p>
        </div>

        {/* Last drawn */}
        {waiting && (
          <div className="flex flex-col items-center">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              Number drawn
            </p>
            <div className="animate-pop flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl font-black text-slate-900 shadow-[0_0_50px_-8px_rgba(255,255,255,.6)]">
              {game.lastDrawn}
            </div>
          </div>
        )}

        {/* Called strip */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {calledNumbers.length === 0 && (
            <span className="text-xs italic text-white/30">No numbers called yet…</span>
          )}
          {[...calledNumbers].reverse().map((n, i) => (
            <span
              key={n}
              className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                i === 0 ? "bg-white text-slate-900" : "bg-white/10 text-white/60"
              }`}
            >
              {n}
            </span>
          ))}
        </div>

        {/* Ticket */}
        <TambolaTicket
          ticket={me.ticket || []}
          marked={me.marked}
          lastDrawn={game.lastDrawn}
          onToggle={(n) => toggleMark(room.code, playerId, n, !me.marked?.[n])}
        />

        <p className="text-center text-[11px] text-white/40">
          Tap a number on your ticket to strike it out.
        </p>

        {msg && (
          <p className={`text-center text-sm font-semibold ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>
            {msg.text}
          </p>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming || waiting}
          className="w-full rounded-2xl border border-blood/40 bg-blood/10 py-3 text-sm font-bold uppercase tracking-widest text-red-300 transition active:scale-[.98] disabled:opacity-30"
        >
          {claiming ? "Verifying…" : "Claim Full House"}
        </button>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-dusk/85 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          {!waiting ? (
            <Btn
              variant="mango"
              size="lg"
              disabled={!isMyTurn}
              onClick={handleDraw}
              className="!rounded-2xl"
            >
              {isMyTurn ? "🎲 Draw Number" : `Waiting for ${currentTurnName}…`}
            </Btn>
          ) : (
            <Btn
              variant={me.done ? "ghost" : "primary"}
              size="lg"
              disabled={!!me.done}
              onClick={() => markDone(room.code, playerId)}
              className="!rounded-2xl"
            >
              {me.done ? `✅ Done — waiting (${doneCount}/${players.length})` : "Done / Next →"}
            </Btn>
          )}
        </div>
      </div>
    </main>
  );
}