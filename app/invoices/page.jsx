"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const parseList = (rawStr) => {
        if (!rawStr) return [];
        try {
          const parsed = JSON.parse(rawStr);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === "object") return [parsed];
        } catch {}
        return [];
      };

      const mainList = parseList(window.localStorage.getItem("epf.invoices")).map(
        (inv) => ({ ...inv, source: "invoice" })
      );
      const esList = parseList(window.localStorage.getItem("epf.eslist")).map(
        (inv) => ({ ...inv, source: "es" })
      );

      const timestamp = (inv) =>
        new Date(
          inv.updatedAt || inv.savedAt || inv.createdAt || inv.date || 0
        ).getTime();

      // Prefer ES record when duplicate ids exist (keeps alpha brand/source)
      const mergedMap = new Map();
      [...esList, ...mainList].forEach((inv) => {
        if (!inv || !inv.id) return;
        const existing = mergedMap.get(inv.id);
        if (!existing || existing.source !== "es") {
          mergedMap.set(inv.id, inv);
        }
      });

      // Ensure totals present
      const withTotals = Array.from(mergedMap.values()).map((inv) => {
        if (inv?.totals && typeof inv.totals.total === "number") return inv;
        const labour = Array.isArray(inv?.items)
          ? inv.items.reduce((s, r) => s + (Number(r?.amount) || 0), 0)
          : 0;
        const materials = Number(inv?.matFixed || 0);
        const total = labour + materials;
        return {
          ...inv,
          totals: {
            labour,
            materials,
            subtotal: total,
            tax: 0,
            total,
          },
        };
      });

      const merged = withTotals.sort((a, b) => timestamp(b) - timestamp(a));

      // Persist the merged list back to epf.invoices so both modes see everything
      try {
        window.localStorage.setItem("epf.invoices", JSON.stringify(merged));
      } catch (err) {
        console.warn("Failed to sync merged invoices to storage", err);
      }

      startTransition(() => setInvoices(merged));
    } catch (err) {
      console.error("Failed to load invoices list", err);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Quotes / Invoices
          </h1>
          <Link
            href="/estimate-builder"
            className="text-xs px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:border-brand hover:text-brand"
          >
            Back to Estimate Builder
          </Link>
        </header>

        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500">
            No saved quotes/invoices yet. Print or save from the estimate
            builder first.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-2 py-1">Date</th>
                  <th className="text-left px-2 py-1">Client</th>
                  <th className="text-left px-2 py-1">Site</th>
                  <th className="text-left px-2 py-1">Brand</th>
                  <th className="text-left px-2 py-1">Source</th>
                  <th className="text-right px-2 py-1">Total</th>
                  <th className="text-right px-2 py-1">Open</th>
                  <th className="text-right px-2 py-1">Delete</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const dateStr =
                    inv.date ||
                    (inv.createdAt || "").slice(0, 10) ||
                    (inv.updatedAt || "").slice(0, 10);
                  const brandKey = inv.brandKey || inv.brand || "epf";
                  const brandLabel =
                    brandKey === "alphaDrywall"
                      ? "Alpha Drywall"
                      : brandKey === "popcornCalgary"
                      ? "Popcorn Calgary"
                      : "EPF Pro";
                  const sourceLabel =
                    inv.source === "es" || (inv.id || "").startsWith("ES-")
                      ? "ES"
                      : "—";

                  const total =
                    inv.totals && typeof inv.totals.total === "number"
                      ? Math.round(inv.totals.total).toLocaleString()
                      : "";

                  return (
                    <tr key={inv.id} className="border-b border-slate-100">
                      <td className="px-2 py-1">{dateStr}</td>
                      <td className="px-2 py-1">{inv.client || "—"}</td>
                      <td className="px-2 py-1">{inv.site || "—"}</td>
                      <td className="px-2 py-1">{brandLabel}</td>
                      <td className="px-2 py-1 text-[10px] text-slate-500">
                        {sourceLabel}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {total ? `$${total}` : "—"}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <Link
                          href={`/invoice-basic?id=${encodeURIComponent(
                            inv.id
                          )}`}
                          className="text-brand hover:underline"
                        >
                          View
                        </Link>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          className="text-red-500 hover:underline"
                          onClick={() => {
                            const ok = window.confirm(
                              `Delete invoice "${inv.id}"? This cannot be undone.`
                            );
                            if (!ok) return;
                            try {
                              const parseList = (rawStr) => {
                                if (!rawStr) return [];
                                try {
                                  const parsed = JSON.parse(rawStr);
                                  if (Array.isArray(parsed)) return parsed;
                                  if (parsed && typeof parsed === "object")
                                    return [parsed];
                                } catch {}
                                return [];
                              };
                              const invoicesRaw =
                                window.localStorage.getItem("epf.invoices");
                              const esRaw =
                                window.localStorage.getItem("epf.eslist");
                              const mainList = parseList(invoicesRaw).filter(
                                (item) => item.id !== inv.id
                              );
                              const esList = parseList(esRaw).filter(
                                (item) => item.id !== inv.id
                              );
                              window.localStorage.setItem(
                                "epf.invoices",
                                JSON.stringify(mainList)
                              );
                              window.localStorage.setItem(
                                "epf.eslist",
                                JSON.stringify(esList)
                              );
                              setInvoices((prev) =>
                                prev.filter((item) => item.id !== inv.id)
                              );
                            } catch (err) {
                              console.error("Failed to delete invoice", err);
                              alert("Delete failed. Check console for details.");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
