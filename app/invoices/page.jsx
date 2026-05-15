"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";

const COMPANY_FILTERS = [
  { value: "all", label: "All Companies" },
  { value: "epf", label: "EPF Pro" },
  { value: "popcornCalgary", label: "Popcorn Calgary" },
  { value: "alphaDrywall", label: "Alpha Drywall" },
];

function recalcInvoiceTotals(inv) {
  const labour = Array.isArray(inv?.items)
    ? inv.items.reduce(
        (sum, row) => sum + (row?.included ? 0 : Number(row?.amount) || 0),
        0
      )
    : 0;
  const materials =
    Number(inv?.matFixed || 0) + labour * (Number(inv?.matPct || 0) / 100);
  const beforeDiscount = labour + materials;
  const discount = beforeDiscount * (Number(inv?.discPct || 0) / 100);
  const subtotal = beforeDiscount - discount;
  const taxableBeforeDiscount =
    labour + (inv?.materialsTaxMode === "nonTaxable" ? 0 : materials);
  const discountShare =
    beforeDiscount > 0 ? discount * (taxableBeforeDiscount / beforeDiscount) : 0;
  const taxableSubtotal = Math.max(0, taxableBeforeDiscount - discountShare);
  const tax = inv?.taxNow
    ? taxableSubtotal * (Number(inv?.taxRate || 0) / 100)
    : 0;
  const total = subtotal + tax;
  return { labour, materials, discount, subtotal, tax, total };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const parseList = (rawStr) => {
      if (!rawStr) return [];
      try {
        const parsed = JSON.parse(rawStr);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];
      } catch {}
      return [];
    };

    const timestamp = (inv) =>
      new Date(
        inv.updatedAt || inv.savedAt || inv.createdAt || inv.date || 0
      ).getTime();

    async function load() {
      try {
        const mainList = parseList(window.localStorage.getItem("epf.invoices")).map(
          (inv) => ({ ...inv, source: "invoice" })
        );
        const esList = parseList(window.localStorage.getItem("epf.eslist")).map(
          (inv) => ({ ...inv, source: "es" })
        );

        let remoteList = [];
        try {
          const res = await fetch("/api/invoices", { cache: "no-store" });
          if (res.ok) {
            const payload = await res.json();
            const arr = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.items)
              ? payload.items
              : [];
            remoteList = arr.map((inv) => ({
              ...inv,
              source:
                inv.source ||
                (String(inv.id || "").startsWith("ES-") ? "es" : "invoice"),
            }));
          } else {
            console.warn("Remote invoices fetch failed", res.status);
          }
        } catch (err) {
          console.warn("Failed to fetch remote invoices", err);
        }

        const mergedMap = new Map();
        const pushList = (list, priority) => {
          list.forEach((inv) => {
            if (!inv || !inv.id) return;
            const existing = mergedMap.get(inv.id);
            const currentTime = timestamp(inv);
            const existingTime = existing ? timestamp(existing) : 0;
            if (
              !existing ||
              currentTime > existingTime ||
              (currentTime === existingTime && priority >= existing.priority)
            ) {
              mergedMap.set(inv.id, { ...inv, priority });
            }
          });
        };

        pushList(remoteList, 3);
        pushList(esList, 2);
        pushList(mainList, 1);

        const withTotals = Array.from(mergedMap.values()).map((inv) => {
          const { priority, ...rest } = inv;
          return {
            ...rest,
            totals: recalcInvoiceTotals(inv),
          };
        });

        const merged = withTotals.sort((a, b) => timestamp(b) - timestamp(a));

        try {
          window.localStorage.setItem("epf.invoices", JSON.stringify(merged));
        } catch (err) {
          console.warn("Failed to sync merged invoices to storage", err);
        }

        startTransition(() => setInvoices(merged));
      } catch (err) {
        console.error("Failed to load invoices list", err);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6">
        <header className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            Quotes / Invoices
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/invoice-basic?new=1"
              className="text-xs px-3 py-2 rounded-md bg-brand text-white font-semibold hover:opacity-90"
            >
              + New Invoice
            </Link>
            <Link
              href="/estimate-builder"
              className="text-xs px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:border-brand hover:text-brand"
            >
              Back to Estimate Builder
            </Link>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap gap-2 rounded-lg bg-slate-50 p-2">
          {COMPANY_FILTERS.map((company) => (
            <button
              key={company.value}
              type="button"
              onClick={() => setCompanyFilter(company.value)}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${
                companyFilter === company.value
                  ? "bg-brand text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand"
              }`}
            >
              {company.label}
            </button>
          ))}
        </div>

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
                {invoices
                  .filter(
                    (inv) =>
                      companyFilter === "all" ||
                      (inv.brandKey || inv.brand || "epf") === companyFilter
                  )
                  .map((inv) => {
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
                              fetch(
                                `/api/invoices?id=${encodeURIComponent(inv.id)}`,
                                { method: "DELETE" }
                              ).catch((err) =>
                                console.warn("Failed to delete remote invoice", err)
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
            {invoices.filter(
              (inv) =>
                companyFilter === "all" ||
                (inv.brandKey || inv.brand || "epf") === companyFilter
            ).length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No invoices for this company.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
