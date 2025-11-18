"use client";

import { Suspense, startTransition, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function recalcTotals(inv) {
  const labour = (inv.items || []).reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );
  const materials =
    Number(inv.matFixed || 0) + labour * (Number(inv.matPct || 0) / 100);
  const subtotal = labour + materials;
  const tax = subtotal * (Number(inv.taxRate || 0) / 100);
  const total = subtotal + tax;
  return { labour, materials, subtotal, tax, total };
}

// 🔹 Inner component that actually uses useSearchParams / useRouter
function InvoiceBasicPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = searchParams.get("id");
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState("loading");

  // load invoice (by id or last draft)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      let loaded = null;

      if (invoiceId) {
        const raw = localStorage.getItem("epf.invoices");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            loaded = list.find((inv) => inv.id === invoiceId) || null;
          }
        }
      }

      if (!loaded) {
        const rawDraft = localStorage.getItem("epf.invoiceDraft");
        if (rawDraft) {
          loaded = JSON.parse(rawDraft);
        }
      }

      if (!loaded) {
        loaded = {
          id: null,
          client: "",
          site: "",
          date: new Date().toISOString().slice(0, 10),
          quoteId: "EPF-QUOTE",
          taxRate: 13,
          matFixed: 0,
          matPct: 0,
          items: [],
          notes: "",
        };
      }

      loaded.totals = recalcTotals(loaded);
      startTransition(() => {
        setInvoice(loaded);
        setStatus("ready");
      });
    } catch (e) {
      console.error(e);
      startTransition(() => {
        setStatus("error");
      });
    }
  }, [invoiceId]);

  if (status === "loading" || !invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Loading invoice…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600 text-sm">
          Could not load invoice. Try opening it again.
        </p>
      </main>
    );
  }

  const updateField = (field, value) => {
    const next = { ...invoice, [field]: value };
    if (["taxRate", "matFixed", "matPct"].includes(field)) {
      next[field] = Number(value) || 0;
      next.totals = recalcTotals(next);
    }
    setInvoice(next);
  };

  const updateItem = (index, field, value) => {
    const items = [...(invoice.items || [])];
    const row = { ...items[index] };

    if (field === "qty" || field === "rate") {
      row[field] = Number(value) || 0;
      const qty = Number(row.qty || 0);
      const rate = Number(row.rate || 0);
      row.amount = qty * rate;
    } else if (field === "amount") {
      row.amount = Number(value) || 0;
    } else {
      row[field] = value;
    }

    items[index] = row;
    const next = { ...invoice, items };
    next.totals = recalcTotals(next);
    setInvoice(next);
  };

  const addItem = () => {
    const items = [...(invoice.items || [])];
    items.push({
      description: "New line item",
      qty: 0,
      unit: "ea",
      rate: 0,
      amount: 0,
    });
    const next = { ...invoice, items };
    next.totals = recalcTotals(next);
    setInvoice(next);
  };

  const removeItem = (idx) => {
    const items = (invoice.items || []).filter((_, i) => i !== idx);
    const next = { ...invoice, items };
    next.totals = recalcTotals(next);
    setInvoice(next);
  };

  const handleSave = () => {
    if (typeof window === "undefined") return;

    const now = new Date().toISOString();
    let list = [];
    try {
      const raw = localStorage.getItem("epf.invoices");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch (e) {
      list = [];
    }

    let toSave = { ...invoice, updatedAt: now };
    if (!toSave.totals) {
      toSave.totals = recalcTotals(toSave);
    }

    if (toSave.id) {
      const idx = list.findIndex((inv) => inv.id === toSave.id);
      if (idx !== -1) {
        list[idx] = toSave;
      } else {
        list.unshift(toSave);
      }
    } else {
      const newId = "inv-" + Date.now().toString(36);
      toSave.id = newId;
      toSave.createdAt = now;
      list.unshift(toSave);
      router.replace(`/invoice-basic?id=${encodeURIComponent(newId)}`);
    }

    localStorage.setItem("epf.invoices", JSON.stringify(list));
    localStorage.setItem("epf.invoiceDraft", JSON.stringify(toSave));
    alert("Invoice saved.");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const t = invoice.totals || recalcTotals(invoice);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-brand">
              EPF Pro Services
            </div>
            <div className="text-[11px] text-slate-500">
              info@epfproservices.com • 647-923-6784
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Invoice
            </div>
            <div className="text-lg font-bold text-slate-900">
              {invoice.quoteId || "EPF-QUOTE"}
            </div>
            <div className="text-xs text-slate-500">
              {invoice.id ? `ID: ${invoice.id}` : "Not saved yet"}
            </div>
          </div>
        </header>

        {/* Client / job */}
        <section className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-slate-800">Bill To</div>
            <div>
              <div className="text-xs text-slate-500">Client</div>
              <input
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                value={invoice.client || ""}
                onChange={(e) => updateField("client", e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-500">Site address</div>
              <input
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                value={invoice.site || ""}
                onChange={(e) => updateField("site", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-slate-800">Details</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-slate-500">Date</div>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                  value={invoice.date || ""}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs text-slate-500">Quote / Invoice #</div>
                <input
                  className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                  value={invoice.quoteId || ""}
                  onChange={(e) => updateField("quoteId", e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-800">Line items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:border-brand hover:text-brand"
            >
              + Add line
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-2 py-1 w-[45%]">Description</th>
                  <th className="text-right px-2 py-1 w-[10%]">Qty</th>
                  <th className="text-left px-2 py-1 w-[10%]">Unit</th>
                  <th className="text-right px-2 py-1 w-[15%]">Rate</th>
                  <th className="text-right px-2 py-1 w-[15%]">Amount</th>
                  <th className="px-2 py-1 w-[5%]"></th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-2 py-1 align-top">
                      <textarea
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                        rows={2}
                        value={row.description || ""}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-md px-1 py-1 text-right"
                        value={row.qty ?? ""}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1 align-top">
                      <input
                        className="w-full border border-slate-200 rounded-md px-1 py-1"
                        value={row.unit || ""}
                        onChange={(e) =>
                          updateItem(idx, "unit", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-md px-1 py-1 text-right"
                        value={row.rate ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-md px-1 py-1 text-right"
                        value={row.amount ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "amount", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center align-top">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => removeItem(idx)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {(!invoice.items || invoice.items.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-2 py-4 text-center text-slate-400 text-xs"
                    >
                      No items yet. Click “+ Add line” to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Notes + totals */}
        <section className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-800 mb-1">
              Notes for client
            </div>
            <textarea
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs min-h-[80px]"
              value={invoice.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-[1.5fr,1fr] gap-2 mb-1">
              <label className="flex items-center justify-between gap-2">
                <span>Materials — fixed</span>
                <input
                  type="number"
                  className="w-24 border border-slate-200 rounded-md px-2 py-1 text-right"
                  value={invoice.matFixed ?? 0}
                  onChange={(e) => updateField("matFixed", e.target.value)}
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Materials %</span>
                <input
                  type="number"
                  className="w-20 border border-slate-200 rounded-md px-2 py-1 text-right"
                  value={invoice.matPct ?? 0}
                  onChange={(e) => updateField("matPct", e.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center justify-between gap-2">
              <span>Tax rate (%)</span>
              <input
                type="number"
                className="w-20 border border-slate-200 rounded-md px-2 py-1 text-right"
                value={invoice.taxRate ?? 13}
                onChange={(e) => updateField("taxRate", e.target.value)}
              />
            </label>

            <div className="border-t border-slate-200 mt-2 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Labour</span>
                <span>${Math.round(t.labour).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Materials</span>
                <span>${Math.round(t.materials).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${Math.round(t.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${Math.round(t.tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-slate-200 mt-1">
                <span>Total</span>
                <span>${Math.round(t.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-brand text-white text-sm font-semibold hover:opacity-90"
          >
            Save changes
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="px-3 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// 🔹 Outer wrapper component that satisfies Next.js requirement
export default function InvoiceBasicPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-600 text-sm">Loading invoice…</p>
        </main>
      }
    >
      <InvoiceBasicPageInner />
    </Suspense>
  );
}
