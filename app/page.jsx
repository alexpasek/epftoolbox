"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const tools = [
  {
    href: "/estimate-builder",
    label: "Popcorn Ceiling Estimate Builder",
    badge: "Main tool",
    description:
      "Room-by-room popcorn removal quote with Level 5 finish, materials, tax and customer view.",
    highlight: true,
  },
  {
    href: "/invoice-basic",
    label: "Quick Invoice Generator",
    badge: "Invoice",
    description:
      "Fast invoice from an accepted estimate — client info, line items, tax, and PDF-friendly layout.",
  },
  {
    href: "/invoices",
    label: "Saved Invoices",
    badge: "History",
    description:
      "List of invoices saved on this device. Tap any invoice to open, adjust, and print.",
  },
  {
    href: "/checklists",
    label: "Job Checklists",
    badge: "Workflow",
    description:
      "On-site prep, daily cleanup, and final walkthrough checklists to standardize every project.",
  },
  {
    href: "/templates",
    label: "Email & SMS Templates",
    badge: "Sales",
    description:
      "Follow-ups, booking confirmations, and review requests you can copy-paste from your phone.",
  },
];

export default function HomePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("epf.home.access");
      if (saved === "1") setUnlocked(true);
    } catch {}
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if ((pass || "").trim() === "0320") {
      setUnlocked(true);
      try {
        localStorage.setItem("epf.home.access", "1");
      } catch {}
    } else {
      alert("Incorrect password");
    }
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Enter access code
          </h1>
          <p className="text-sm text-slate-600">
            Access is required to open this page.
          </p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Password"
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-brand text-white px-3 py-2 text-sm font-semibold hover:opacity-90"
            >
              Unlock
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(90%_60%_at_50%_-10%,rgba(225,29,72,0.10),transparent_60%)]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md border border-brand grid place-items-center text-[12px] font-bold text-brand">
              EPF
            </div>
            <span className="text-sm font-semibold">
              Estimate &amp; Invoice Tools
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="text-xs font-medium text-brand hover:underline"
            >
              Invoices
            </Link>
            <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 bg-white text-[11px] text-slate-600">
              v0.1 · Mobile-first
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Run clean, professional quotes —{" "}
          <span className="text-brand">fast</span>
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Tap to add rooms, set rates, and print a friendly PDF. Optimized for
          iPhone and one-hand use.
        </p>
      </section>

      {/* Tool cards */}
      <section className="mx-auto max-w-5xl px-4 pb-12 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const content = (
            <div
              className={[
                "group flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-all",
                tool.highlight
                  ? "border-brand/40 ring-1 ring-brand/10"
                  : "border-slate-200 hover:border-brand",
                "hover:shadow-md",
              ].join(" ")}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-brand">
                    {tool.label}
                  </h2>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      tool.highlight
                        ? "border border-brand/30 text-brand bg-brand/5"
                        : "border border-slate-200 text-slate-600 bg-slate-50",
                    ].join(" ")}
                  >
                    {tool.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  {tool.description}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-slate-500">
                <span>Tap to open</span>
                <span className="inline-flex items-center gap-1 text-brand font-medium">
                  Open <span aria-hidden>↗</span>
                </span>
              </div>
            </div>
          );

          return tool.href ? (
            <Link
              key={tool.href}
              href={tool.href}
              className="focus:outline-none focus:ring-2 focus:ring-brand/40 rounded-2xl"
            >
              {content}
            </Link>
          ) : (
            <div key={tool.label}>{content}</div>
          );
        })}
      </section>

      {/* Footer tip */}
      <footer className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-[12px] text-slate-600">
          <div className="font-semibold text-slate-900 mb-1">
            Add to iPhone Home Screen
          </div>
          Open in Safari → Share → “Add to Home Screen” to launch like an app.
        </div>
      </footer>
    </main>
  );
}
