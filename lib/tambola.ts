/* ---------------- Mathematically correct Tambola ticket ---------------- */

export const COLUMN_RANGES: [number, number][] = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
  [50, 59], [60, 69], [70, 79], [80, 90],
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 rows × 9 cols, 15 numbers, 5 per row, ≥1 per column, column-range correct. */
function buildLayout(): { grid: boolean[][]; colCounts: number[] } | null {
  // 1. column counts: each 1..3, total 15
  const colCounts = Array(9).fill(1);
  let extra = 6;
  let guard = 0;
  while (extra > 0 && guard++ < 2000) {
    const c = Math.floor(Math.random() * 9);
    if (colCounts[c] < 3) { colCounts[c]++; extra--; }
  }
  if (extra !== 0) return null;

  // 2. place marks so every row has exactly 5
  const grid: boolean[][] = Array.from({ length: 3 }, () => Array(9).fill(false));
  for (let c = 0; c < 9; c++) {
    const rows = shuffle([0, 1, 2]).slice(0, colCounts[c]);
    rows.forEach((r) => (grid[r][c] = true));
  }
  if (!grid.every((row) => row.filter(Boolean).length === 5)) return null;
  return { grid, colCounts };
}

export function generateTicket(): number[][] {
  let layout = null;
  for (let i = 0; i < 1000 && !layout; i++) layout = buildLayout();
  if (!layout) throw new Error("Ticket generation failed");

  const { grid, colCounts } = layout;
  const ticket: number[][] = Array.from({ length: 3 }, () => Array(9).fill(0));

  for (let c = 0; c < 9; c++) {
    const [min, max] = COLUMN_RANGES[c];
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    const picked = shuffle(pool).slice(0, colCounts[c]).sort((a, b) => a - b);
    let k = 0;
    for (let r = 0; r < 3; r++) if (grid[r][c]) ticket[r][c] = picked[k++];
  }
  return ticket;
}

export function ticketNumbers(ticket: number[][]): number[] {
  return ticket.flat().filter((n) => n > 0);
}

/** Ground-truth verification — uses the server's called-number list, not client marks. */
export function isFullHouse(ticket: number[][], calledNumbers: number[]): boolean {
  const called = new Set(calledNumbers);
  return ticketNumbers(ticket).every((n) => called.has(n));
}