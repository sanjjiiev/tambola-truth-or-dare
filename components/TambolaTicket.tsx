"use client";

export function TambolaTicket({
  ticket, marked, lastDrawn, onToggle, readOnly,
}: {
  ticket: number[][];
  marked?: Record<string, true>;
  lastDrawn?: number | null;
  onToggle?: (n: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="w-full rounded-3xl bg-white p-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,.55)] ring-1 ring-white/20">
      <div className="grid grid-cols-9 gap-[3px] sm:gap-1">
        {ticket.flatMap((row, r) =>
          row.map((num, c) => {
            if (num === 0)
              return <div key={`${r}-${c}`} className="aspect-square rounded-lg bg-slate-100" />;

            const isMarked = !!marked?.[num];
            const isFresh = !isMarked && lastDrawn === num;

            return (
              <button
                key={`${r}-${c}`}
                disabled={readOnly}
                onClick={() => onToggle?.(num)}
                className={[
                  "flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold leading-none transition-all sm:text-sm",
                  "min-h-[34px] min-w-0", // keeps tap target usable on small phones
                  isMarked
                    ? "scale-[.96] bg-emerald-500 text-white shadow-inner"
                    : "bg-white text-slate-800 ring-1 ring-slate-200 active:scale-90",
                  isFresh ? "animate-pulse-ring ring-2 ring-blood" : "",
                ].join(" ")}
              >
                {num}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}