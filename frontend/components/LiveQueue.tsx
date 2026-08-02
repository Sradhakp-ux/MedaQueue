"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function LiveQueue({ tokenProp }: { tokenProp?: string }) {
  const [token, setToken] = useState(tokenProp || "");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let interval: number | undefined;

    async function fetchStatus() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await api.get("queue/");
        if (!mounted) return;
        const items: any[] = res.data || [];
        const found = items.find((i) => String(i.token) === String(token));
        setStatus(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchStatus();
      interval = window.setInterval(fetchStatus, 5000);
    }

    return () => {
      mounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-2">
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter token (e.g. CAR-021)" className="flex-1 rounded border px-3 py-2" />
        <button onClick={() => {}} className="rounded bg-sky-600 text-white px-3 py-2">Track</button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : status ? (
          <div>
            <div className="text-sm text-slate-500">Current Token</div>
            <div className="text-2xl font-bold">{status.token}</div>
            <div className="mt-1 text-sm">Doctor: {status.doctor}</div>
            <div className="mt-1 text-sm">People before you: {Math.max(0, (status.current_position || 0) - 1)}</div>
            <div className="mt-1 text-sm">Estimated wait: {status.estimated_wait} mins</div>
            <div className="mt-3">
              <div className="w-full bg-slate-200 h-3 rounded-full">
                <div className="bg-emerald-600 h-3 rounded-full" style={{ width: `${Math.min(100, ((status.current_position || 0) / 20) * 100)}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No data for this token yet.</div>
        )}
      </div>
    </div>
  );
}
