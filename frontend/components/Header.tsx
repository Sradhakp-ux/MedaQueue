"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import auth from "@/services/auth";

export default function Header() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(auth.getUsername());
    // schedule background token refresh when user is present
    if (auth.getAccess) {
      auth.scheduleRefresh(auth.getAccess());
    } else {
      auth.scheduleRefresh();
    }
  }, []);

  function logout() {
    auth.clearTokens();
    window.location.href = "/";
  }

  const standalonePages = ["/", "/login", "/patient", "/administrator/dashboard", "/doctor/dashboard", "/receptionist/dashboard"];
  if (standalonePages.includes(pathname)) return null;

  return (
    <header className="w-full bg-white border-b shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">MedaQueue</Link>
        </div>
        <div>
          {username ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700">{username}</span>
              <button onClick={logout} className="text-sm text-rose-600">Logout</button>
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Login Portal</Link>
          )}
        </div>
      </div>
    </header>
  );
}
