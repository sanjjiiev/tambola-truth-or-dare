"use client";
import { useEffect, useState } from "react";
import { subscribeRoom } from "@/lib/room";
import type { Room } from "@/lib/types";

export function useRoom(code: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    const unsub = subscribeRoom(code, (r) => {
      setRoom(r);
      setMissing(!r);
      setLoading(false);
    });
    return () => unsub();
  }, [code]);

  return { room, loading, missing };
}

/** Stable per-browser player id. */
export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let pid = localStorage.getItem("tod:playerId");
  if (!pid) {
    pid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem("tod:playerId", pid);
  }
  return pid;
}