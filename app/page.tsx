"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom, newId } from "@/lib/room";
import { Btn, Card } from "@/components/ui";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const n = localStorage.getItem("tod:name");
    if (n) setName(n);
  }, []);

  function pid() {
    let p = localStorage.getItem("tod:playerId");
    if (!p) { p = newId(); localStorage.setItem("tod:playerId", p); }
    return p;
  }

  async function host() {
    if (!name.trim()) return setErr("Enter your name first.");
    setBusy(true); setErr("");
    try {
      localStorage.setItem("tod:name", name.trim());
      const c = await createRoom(pid(), name.trim());
      router.push(`/room/${c}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  async function join() {
    if (!name.trim()) return setErr("Enter your name first.");
    if (code.trim().length < 4) return setErr("Enter a valid room code.");
    setBusy(true); setErr("");
    try {
      localStorage.setItem("tod:name", name.trim());
      const c = code.trim().toUpperCase();
      await joinRoom(c, pid(), name.trim());
      router.push(`/room/${c}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-soft to-mint text-3xl shadow-soft">
            🎟️
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Tambola <span className="text-mango">×</span> Truth&nbsp;or&nbsp;Dare
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Call numbers. Strike them out. Lose… and face the consequences.
          </p>
        </div>

        <Card className="p-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aarav"
            maxLength={16}
            className="w-full rounded-2xl border-0 bg-slate-100/80 px-4 py-3.5 text-[15px] outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-sky-soft"
          />

          <div className="mt-4">
            <Btn variant="mango" size="lg" onClick={host} disabled={busy}>
              🎉 Host a Party
            </Btn>
          </div>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={6}
              className="w-full rounded-2xl border-0 bg-slate-100/80 px-4 py-3.5 font-mono text-lg tracking-[0.3em] uppercase outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-sky-soft"
            />
            <Btn onClick={join} disabled={busy} className="shrink-0">Join</Btn>
          </div>

          {err && <p className="mt-3 text-sm font-medium text-blood">{err}</p>}
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          3–12 players · one phone each · no app install
        </p>
      </div>
    </main>
  );
}