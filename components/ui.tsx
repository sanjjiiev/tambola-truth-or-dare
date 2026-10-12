"use client";
import React from "react";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "mango" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
};

export function Btn({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all " +
    "active:scale-[.97] disabled:opacity-40 disabled:pointer-events-none select-none";
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-[15px]",
    lg: "px-6 py-4 text-base w-full",
  }[size];
  const variants = {
    primary: "bg-sky-soft text-slate-900 shadow-soft hover:brightness-105",
    mango: "bg-mango text-white shadow-soft hover:brightness-105",
    ghost: "bg-white/70 text-slate-700 ring-1 ring-slate-200 hover:bg-white",
    danger: "bg-blood text-white shadow-glow hover:brightness-110",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
  }[variant];
  return <button className={`${base} ${sizes} ${variants} ${className}`} {...rest} />;
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-3xl bg-white/80 backdrop-blur-xl shadow-soft ring-1 ring-slate-900/5 ${className}`}>
      {children}
    </div>
  );
}

export function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 font-mono text-lg tracking-[0.25em] text-white"
    >
      {code}
      <span className="text-[10px] font-sans tracking-normal text-white/50">
        {copied ? "copied!" : "tap to copy"}
      </span>
    </button>
  );
}