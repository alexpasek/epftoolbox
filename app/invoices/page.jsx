"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("epf.invoices");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setInvoices(parsed);
    } catch (e) {
      console.error("Failed to load invoices", e);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Saved Invoices</h1>
          <Link
            href="/"
            className="text-xs font-medium text-brand hover:underline"
          >
            ← Back to tools
          </Link>
        </header>

        {invoices.length === 0 ? (
          <p className="text-sm text-slate-600">
            No invoices saved yet. Use “Create Invoice from this” on an estimate
            to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoice-basic?id=${encodeURIComponent(inv.id)}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-brand hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {inv.client || "No client name"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {inv.site || "No site"} • {inv.quoteId || inv.id}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>
                      {inv.date ||
                        (inv.createdAt || "").slice(0, 10) ||
                        "No date"}
                    </div>
                    {inv.totals?.total != null && (
                      <div className="font-semibold text-slate-900">
                        ${Math.round(inv.totals.total).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
