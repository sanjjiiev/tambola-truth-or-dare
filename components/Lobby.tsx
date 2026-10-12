"use client";
import { useState } from "react";
import type { Room } from "@/lib/types";
import { submitTasks, startGame, leaveRoom } from "@/lib/room";
import { Btn, Card, CodeChip } from "./ui";
import { useRouter } from "next/navigation";

export function Lobby({ room, playerId }: { room: Room; playerId: string }) {
  const router = useRouter();
  const me = room.players[playerId];
  const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const isHost = room.hostId === playerId;

  const [truths, setTruths] = useState<string[]>(["", ""]);
  const [dares, setDares] = useState<string[]>(["", ""]);
  const [editing, setEditing] = useState(!me?.submitted);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const readyCount = players.filter((p) => p.submitted).length;
  const allReady = readyCount === players.length;

  async function save() {
    const t = truths.filter((x) => x.trim());
    const d = dares.filter((x) => x.trim());
    if (t.length < 2 || d.length < 2) return setErr("Please fill in all 2 Truths and 2 Dares.");
    setBusy(true); setErr("");
    try {
      await submitTasks(room.code, playerId, me.name, truths, dares);
      setEditing(false);
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  async function start() {
    setBusy(true); setErr("");
    try { await startGame(room.code); }
    catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <main className="min-h-dvh bg-cream px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Room</p>
            <CodeChip code={room.code} />
          </div>
          <button
            onClick={async () => { await leaveRoom(room.code, playerId); router.push("/"); }}
            className="text-xs font-semibold text-slate-400 underline underline-offset-4"
          >
            Leave
          </button>
        </header>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Players · {players.length}
            </h2>
            <span className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {readyCount}/{players.length} ready
            </span>
          </div>
          <ul className="space-y-2">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-soft to-mint text-sm font-bold text-slate-800">
                  {p.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 truncate font-semibold text-slate-800">
                  {p.name}
                  {p.id === playerId && <span className="ml-1 text-xs font-normal text-slate-400">(you)</span>}
                </span>
                {p.isHost && <span className="text-xs">👑</span>}
                <span className={`text-lg ${p.submitted ? "" : "opacity-25 grayscale"}`}>
                  {p.submitted ? "✅" : "⏳"}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {editing ? (
          <Card className="p-4">
            <h2 className="mb-1 text-lg font-black text-slate-900">Your dark secrets</h2>
            <p className="mb-4 text-xs text-slate-500">
              Write 2 Truths and 2 Dares. They go into a shared pool — the winner will use them against
              a loser. Be creative, be kind-ish.
            </p>

            {(["Truth", "Dare"] as const).map((kind) => {
              const arr = kind === "Truth" ? truths : dares;
              const setArr = kind === "Truth" ? setTruths : setDares;
              const ph =
                kind === "Truth"
                  ? ["What's the most embarrassing thing you've googled?", "Who in this room would you swap lives with?"]
                  : ["Speak in an accent until your next turn.", "Do 15 push-ups right now."];
              return (
                <div key={kind} className="mb-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {kind}s
                  </p>
                  {arr.map((v, i) => (
                    <textarea
                      key={i}
                      value={v}
                      rows={2}
                      maxLength={180}
                      placeholder={ph[i]}
                      onChange={(e) => {
                        const next = [...arr]; next[i] = e.target.value; setArr(next);
                      }}
                      className="mb-2 w-full resize-none rounded-2xl border-0 bg-slate-100/80 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-sky-soft"
                    />
                  ))}
                </div>
              );
            })}

            {err && <p className="mb-2 text-sm font-medium text-blood">{err}</p>}
            <Btn variant="primary" size="lg" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Submit my 4 tasks"}
            </Btn>
          </Card>
        ) : (
          <Card className="p-4 text-center">
            <p className="text-3xl">🔒</p>
            <p className="mt-1 font-bold text-slate-800">Tasks submitted</p>
            <p className="text-xs text-slate-500">Waiting for the host to start the game…</p>
            <button onClick={() => setEditing(true)} className="mt-3 text-xs font-semibold text-sky-600 underline">
              Edit my tasks
            </button>
          </Card>
        )}

        {isHost && (
          <Card className="p-4">
            {err && !editing && <p className="mb-2 text-sm font-medium text-blood">{err}</p>}
            <Btn variant="mango" size="lg" onClick={start} disabled={busy || !allReady}>
              {allReady ? "🚀 Start Game" : `Waiting for ${players.length - readyCount} player(s)…`}
            </Btn>
            <p className="mt-2 text-center text-xs text-slate-400">
              You are the host. You'll also confirm completed tasks later.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}