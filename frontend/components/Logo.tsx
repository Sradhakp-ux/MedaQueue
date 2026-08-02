import Link from "next/link";

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className || ""}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB] text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5C9.514 2.5 7.5 4.514 7.5 7c0 1.27.632 2.415 1.683 3.146L12 13.5l2.817-3.354A4.986 4.986 0 0 0 16.5 7c0-2.486-2.014-4.5-4.5-4.5Z" fill="currentColor" />
          <path d="M12.5 8.5h-1v1.5H10v1h1.5V12H12.5v-1.5H14v-1h-1.5V8.5Z" fill="white" />
        </svg>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-lg text-slate-900">MedaQueue</span>
        <span className="text-xs text-slate-500">Healthcare, On Time</span>
      </div>
    </Link>
  );
}
