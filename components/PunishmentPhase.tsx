"use client";
import { useState } from "react";
import type { Room, Task } from "@/lib/types";
import { assignPunishment, completeTaskAndReset } from "@/lib/room";
import { Btn } from "./ui";

export function PunishmentPhase({ room, playerId }: { room: Room; playerId: string }) {
  const winnerId = room.game.winnerId!;
  const winner = room.players[winnerId];
  const isWinner = winnerId === playerId;
  const isHost = room.hostId === playerId;
  const punishment = room.punishment;

  const truths: Task[] = Object.values(room.truths || {});
  const dares: Task[] = Object.values(room.dares || {});

  const [tab, setTab] = useState<"truth" | "dare">("truth");
  const [selected, setSelected] = useState<Task | null>(null);
  const [targetId, setTargetId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const losers = Object.values(room.players).filter((p) => p.id !== winnerId);
  const list = tab === "truth" ? truths : dares;

  async function confirm() {
    if (!selected || !targetId) return;
    setBusy(true);
    const target = room.players[targetId];
    await assignPunishment(room.code, winnerId, targetId, target.name, tab, selected.text);
    setBusy(false);
  }

  /* ---------------- Task assigned ---------------- */
  if (punishment) {
    const isVictim = punishment.assignedTo === playerId;
    return (
      <main className="horror-bg relative min-h-dvh px-4 py-8">
        <div className="relative z-10 mx-auto flex min-h-[85dvh] max-w-md flex-col items-center justify-center text-center">
          <p className="mb-2 font-creep text-xs uppercase tracking-[0.5em] text-red-500/60">
            The verdict
          </p>
          <h1 className="animate-flicker font-creep text-4xl font-black uppercase tracking-widest text-red-600 sm:text-5xl">
            {isVictim ? "You are chosen" : `${punishment.assignedToName} was chosen`}
          </h1>

          <div className="animate-shake-in mt-8 w-full rounded-2xl border border-red-900/60 bg-black/60 p-6 shadow-glow backdrop-blur-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-red-500/70">
              {punishment.type === "truth" ? "Truth" : "Dare"}
            </p>
            <p className="font-creep text-xl leading-relaxed text-red-50 sm:text-2xl">
              “{punishment.text}”
            </p>
          </div>

          {isHost ? (
            <div className="mt-10 w-full">
              <Btn
                variant="danger"
                size="lg"
                className="!rounded-2xl"
                onClick={() => completeTaskAndReset(room.code)}
              >
                ☠︎ Task Completed — Reset Room
              </Btn>
            </div>
          ) : (
            <p className="mt-10 text-xs uppercase tracking-[0.3em] text-red-500/40">
              {isVictim ? "Complete it in real life…" : "Awaiting the host…"}
            </p>
          )}
        </div>
      </main>
    );
  }

  /* ---------------- Winner choosing ---------------- */
  if (!isWinner) {
    return (
      <main className="horror-bg relative flex min-h-dvh items-center justify-center px-6">
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-6 h-16 w-16 animate-pulse rounded-full bg-red-900/40 shadow-glow" />
          <h1 className="animate-flicker font-creep text-2xl font-black uppercase tracking-[0.3em] text-red-600">
            {winner?.name} won
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-red-500/50">
            Choosing someone's fate…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="horror-bg relative min-h-dvh px-4 py-6">
      <div className="relative z-10 mx-auto max-w-md space-y-4 pb-32">
        <header className="text-center">
          <p className="font-creep text-[10px] uppercase tracking-[0.5em] text-red-500/60">
            Full House
          </p>
          <h1 className="animate-flicker font-creep text-3xl font-black uppercase tracking-widest text-red-600">
            You Win
          </h1>
          <p className="mt-1 text-xs text-red-200/50">
            Now choose a task and a victim.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl border border-red-900/50 bg-black/40 p-1">
          {(["truth", "dare"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(null); }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-[0.2em] transition ${
                tab === t ? "bg-red-800 text-red-50 shadow-glow" : "text-red-400/50"
              }`}
            >
              {t}s ({(t === "truth" ? truths : dares).length})
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="max-h-[38dvh] space-y-2 overflow-y-auto pr-1">
          {list.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full rounded-2xl border p-3.5 text-left transition ${
                selected?.id === t.id
                  ? "border-red-600 bg-red-950/60 shadow-glow"
                  : "border-red-900/40 bg-black/40 active:scale-[.99]"
              }`}
            >
              <p className="font-creep text-[15px] leading-snug text-red-50">{t.text}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-red-500/40">
                by {t.authorName}
              </p>
            </button>
          ))}
          {list.length === 0 && (
            <p className="py-6 text-center text-xs uppercase tracking-widest text-red-500/40">
              The pool is empty…
            </p>
          )}
        </div>

        {/* Victim picker */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60">
            Choose your victim
          </p>
          <div className="flex flex-wrap gap-2">
            {losers.map((p) => (
              <button
                key={p.id}
                onClick={() => setTargetId(p.id)}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  targetId === p.id
                    ? "border-red-600 bg-red-900/70 text-red-50 shadow-glow"
                    : "border-red-900/40 bg-black/40 text-red-300/70"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-red-900/50 bg-black/85 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <Btn
            variant="danger"
            size="lg"
            className="!rounded-2xl"
            disabled={!selected || !targetId || busy}
            onClick={confirm}
          >
            {busy ? "Sealing their fate…" : "☠︎ Assign the Task"}
          </Btn>
        </div>
      </div>
    </main>
  );
}