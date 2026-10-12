"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom, getPlayerId } from "@/hooks/useRoom";
import { joinRoom } from "@/lib/room";
import { Lobby } from "@/components/Lobby";
import { GamePhase } from "@/components/GamePhase";
import { PunishmentPhase } from "@/components/PunishmentPhase";
import { Btn, Card } from "@/components/ui";

function RoomContent() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || "").toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  useEffect(() => { setPlayerId(getPlayerId()); }, []);

  const { room, loading, missing } = useRoom(code || null);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const n = localStorage.getItem("tod:name");
    if (n) setName(n);
  }, []);

  async function doJoin() {
    if (!name.trim()) return setErr("Enter a name.");
    setJoining(true); setErr("");
    try {
      await joinRoom(code, playerId, name.trim());
      localStorage.setItem("tod:name", name.trim());
    } catch (e: any) { setErr(e.message); }
    setJoining(false);
  }

  if (loading || !playerId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-soft" />
      </main>
    );
  }

  if (missing) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream px-6">
        <Card className="p-6 text-center">
          <p className="text-4xl">🕳️</p>
          <h1 className="mt-2 text-lg font-black text-slate-900">Room not found</h1>
          <p className="mb-4 text-sm text-slate-500">That code doesn't match any party.</p>
          <Btn onClick={() => router.push("/")}>Back home</Btn>
        </Card>
      </main>
    );
  }

  const me = room!.players?.[playerId];

  /* Not a member yet → join gate */
  if (!me) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream px-5">
        <Card className="w-full max-w-sm p-5">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            Room {code}
          </p>
          <h1 className="mt-1 text-center text-xl font-black text-slate-900">Join the party</h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={16}
            className="mt-4 w-full rounded-2xl border-0 bg-slate-100/80 px-4 py-3.5 text-[15px] outline-none focus:bg-white focus:ring-1 focus:ring-sky-soft"
          />
          {err && <p className="mt-2 text-sm font-medium text-blood">{err}</p>}
          <Btn className="mt-3 w-full" size="lg" onClick={doJoin} disabled={joining}>
            {joining ? "Joining…" : "Enter"}
          </Btn>
        </Card>
      </main>
    );
  }

  if (room!.phase === "lobby") return <Lobby room={room!} playerId={playerId} />;
  if (room!.phase === "playing") return <GamePhase room={room!} playerId={playerId} />;
  if (room!.phase === "punishment") return <PunishmentPhase room={room!} playerId={playerId} />;

  return null;
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-cream">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-soft" />
        </main>
      }
    >
      <RoomContent />
    </Suspense>
  );
}