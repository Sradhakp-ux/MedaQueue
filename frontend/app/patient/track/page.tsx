"use client";

import { Suspense } from "react";
import LiveQueue from "@/components/LiveQueue";
import { useSearchParams } from "next/navigation";

function TrackPageInner() {
  const search = useSearchParams();
  const token = search.get("token") || undefined;
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold mb-4">Track Your Token</h1>
        <LiveQueue tokenProp={token} />
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 bg-slate-50">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold mb-4">Track Your Token</h1>
          <div className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm"></div>
        </div>
      </div>
    }>
      <TrackPageInner />
    </Suspense>
  );
}
