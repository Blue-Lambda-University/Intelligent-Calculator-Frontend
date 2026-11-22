export type Mode = 'basic' | 'scientific' | 'ai';
export type Calculation = { id: string; mode: Mode; expression: string; result: number; explanation?: string | null; created_at: string; original_input?: string | null };
export type Version = { version: string; commit: string; environment: string; timestamp: string };
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch('/api/proxy/' + path.replace(/^\//,''), {
    ...options, headers: { 'Content-Type':'application/json', ...options.headers }, cache:'no-store'
  });
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const p = payload as { detail?: string | { message?: string } } | null;
    const detail = p?.detail;
    throw new Error(typeof detail === 'string' ? detail : detail?.message || `Request failed (${res.status})`);
  }
  return payload as T;
}
export function prettify(value: number): string {
  return Number.isFinite(value) ? Number(value.toPrecision(12)).toLocaleString('en-US',{maximumFractionDigits:12}) : 'Error';
}
