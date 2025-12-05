"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";

const BRAND_LABELS = {
  epf: "EPF",
  popcornCalgary: "Popcorn Calgary",
  alphaDrywall: "Alpha Drywall",
};
const ES_LIST_KEY = "epf.eslist";

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState([]);
  const [esList, setEsList] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [accessMode, setAccessMode] = useState("full");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedAccess = window.localStorage.getItem("epf.accessMode");
    if (storedAccess === "alphaOnly") setAccessMode("alphaOnly");
    else if (storedAccess === "full") setAccessMode("full");
    else setAccessMode("full");
    try {
      const raw = localStorage.getItem("epf.invoices");
      let list = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
        else if (parsed && typeof parsed === "object") list = [parsed];
      }
      const rawEs = localStorage.getItem(ES_LIST_KEY);
      let esEntries = [];
      if (rawEs) {
        const parsedEs = JSON.parse(rawEs);
        if (Array.isArray(parsedEs)) esEntries = parsedEs;
        else if (parsedEs && typeof parsedEs === "object")
          esEntries = [parsedEs];
      }
      const draftRaw = localStorage.getItem("epf.invoiceDraft");
      const draft = draftRaw ? JSON.parse(draftRaw) : null;
      if (draft && draft.id && !list.find((i) => i.id === draft.id)) {
        list.unshift(draft);
      }
      const normalize = (inv, idx, prefix = "") => {
        if (!inv || typeof inv !== "object") return null;
        const id =
          inv.id ||
          inv.quoteId ||
          `${prefix}inv-` +
            (inv.savedAt || inv.updatedAt || Date.now()) +
            "-" +
            idx;
        const totals =
          inv.totals && typeof inv.totals === "object"
            ? inv.totals
            : {
                labour: Array.isArray(inv.items)
                  ? inv.items.reduce(
                      (s, r) => s + (Number(r?.amount) || 0),
                      0
                    )
                  : 0,
                materials: Number(inv.matFixed || 0),
              };
        if (totals.materials != null && totals.labour != null) {
          const subtotal =
            Number(totals.labour || 0) + Number(totals.materials || 0);
          const taxRate = Number(inv.taxRate || 0);
          totals.subtotal = totals.subtotal ?? subtotal;
          totals.tax =
            totals.tax ??
            (inv.taxNow ? subtotal * (taxRate / 100) : 0);
          totals.total = totals.total ?? totals.subtotal + totals.tax;
        }
        return { ...inv, id, totals };
      };

      const normalizedInvoices = list
        .map(normalize)
        .filter(Boolean)
        .sort((a, b) => {
          const timeA = new Date(a.savedAt || a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.savedAt || b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

      const normalizedEs =
        accessMode === "full"
          ? esEntries
              .map((inv, idx) => normalize(inv, idx, "es-"))
              .filter(Boolean)
              .sort((a, b) => {
                const timeA = new Date(a.savedAt || a.updatedAt || a.createdAt || 0).getTime();
                const timeB = new Date(b.savedAt || b.updatedAt || b.createdAt || 0).getTime();
                return timeB - timeA;
              })
          : [];

      const combined = [...normalizedInvoices, ...normalizedEs]
        .filter((inv, idx, arr) => arr.findIndex((i) => i.id === inv.id) === idx)
        .sort((a, b) => {
          const timeA = new Date(a.savedAt || a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.savedAt || b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

      startTransition(() => {
        setInvoices(combined);
        setEsList(normalizedEs);
        setDebugInfo({
          rawLength: raw ? raw.length : 0,
          rawEsLength: rawEs ? rawEs.length : 0,
          draftPresent: !!draft,
          parsedCount: Array.isArray(combined)
            ? combined.length
            : 0,
          esCount: normalizedEs.length,
          sample: combined.slice(0, 3),
          sampleEs: normalizedEs.slice(0, 3),
          raw: raw || "(empty)",
          rawEs: rawEs || "(empty)",
          draftRaw: draft ? JSON.stringify(draft) : "(none)",
        });
      });
    } catch (e) {
      console.error("Failed to load invoices", e);
      setDebugInfo({ error: String(e) });
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Saved Quotes / Invoices
          </h1>
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
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5">
                    {BRAND_LABELS[inv.brandKey] || "EPF"}
                  </span>
                  {inv.shadowOf ? <span>Shadow of {inv.shadowOf}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        {accessMode === "full" ? (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h2 className="text-xl font-semibold text-slate-900">
              ES List (Alpha saves)
            </h2>
            {esList.length === 0 ? (
              <p className="text-sm text-slate-600">
                No ES records yet. Alpha “Print / Save PDF” or “Keep / Save Estimate” will appear here.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {esList.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3"
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
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5">
                        ES
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5">
                        {BRAND_LABELS[inv.brandKey] || "Alpha Drywall"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {debugInfo ? (
          <details className="mt-4 rounded border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold">
              Debug — stored quotes
            </summary>
            <div className="mt-2 space-y-1">
              <div>Parsed count: {debugInfo.parsedCount ?? 0}</div>
              <div>Raw length: {debugInfo.rawLength ?? 0}</div>
              <div>Raw ES length: {debugInfo.rawEsLength ?? 0}</div>
              <div>ES count: {debugInfo.esCount ?? 0}</div>
              <div>Draft present: {debugInfo.draftPresent ? "yes" : "no"}</div>
              {debugInfo.error ? <div className="text-red-600">Error: {debugInfo.error}</div> : null}
              <div className="overflow-auto rounded bg-slate-50 p-2">
                <div className="font-semibold mb-1">Raw localStorage:</div>
                <pre className="whitespace-pre-wrap break-all">
{debugInfo.raw}
                </pre>
                <div className="font-semibold mb-1 mt-2">Raw ES list:</div>
                <pre className="whitespace-pre-wrap break-all">
{debugInfo.rawEs}
                </pre>
                <div className="font-semibold mb-1 mt-2">Draft entry:</div>
                <pre className="whitespace-pre-wrap break-all">
{debugInfo.draftRaw}
                </pre>
              </div>
              <div className="overflow-auto rounded bg-slate-50 p-2">
                <pre className="whitespace-pre-wrap break-all">
{JSON.stringify(
  {
    invoices: debugInfo.sample,
    esSample: debugInfo.sampleEs,
  },
  null,
  2
)}
                </pre>
              </div>
            </div>
          </details>
        ) : null}
      </div>
    </main>
  );
}
