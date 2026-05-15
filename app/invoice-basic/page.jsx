"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, startTransition, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const CRM_STORAGE_KEY = "epf.crm.clients";

const BRAND_PROFILES = {
  epf: {
    name: "EPF Pro Services",
    tagline: "Popcorn ceiling & interior finishing specialists",
    contactLine: "info@epfproservices.com • 647-923-6784 • epfproservices.com",
    logoSrc: "/logo/image.png",
    logoAlt: "EPF logo",
    brandColor: "#e11d48",
    footerLines: [
      "EPF Pro Services • 647-923-6784 • info@epfproservices.com • epfproservices.com",
    ],
  },
  popcornCalgary: {
    name: "Popcorn Ceiling Removal Calgary",
    tagline: "Calgary popcorn ceiling removal & finishing",
    contactLine: "info@popcornceilingremoval.com • (825) 365-3770",
    logoSrc: "/logo/popcorn-calgary1.svg",
    logoAlt: "Popcorn Ceiling Removal Calgary logo",
    brandColor: "#f97316",
    footerLines: [
      "Popcorn Ceiling Removal Calgary • (825) 365-3770 • info@popcornceilingremoval.com",
    ],
  },
  alphaDrywall: {
    name: "Alpha Drywall Finishing",
    tagline: "Drywall finishing, texture, and repair",
    contactLine: "Mon-Sat 8am-6pm • (825) 365-3770",
    logoSrc: "/logo/alpha-drywall.png",
    logoAlt: "Alpha Drywall Finishing logo",
    brandColor: "#2563eb",
    legalLine: "Operated under legal name Alpha Drywall Finishing",
    footerLines: [
      "Alpha Drywall Finishing • (825) 365-3770 • Mon-Sat 8am-6pm",
      "Operated under legal name Alpha Drywall Finishing",
    ],
  },
};

const APPROX_MATERIALS_NOTE =
  "Materials are estimated only. Final material charges will be adjusted to the actual materials used for the project.";

function blankInvoice(overrides = {}) {
  return {
    id: null,
    crmClientId: "",
    brandKey: "epf",
    client: "",
    contact: "",
    site: "",
    date: new Date().toISOString().slice(0, 10),
    quoteId: "EPF-QUOTE",
    hstNumber: "",
    taxRate: 13,
    taxNow: true,
    matFixed: 0,
    matPct: 0,
    materialsTaxMode: "taxable",
    materialsMode: "exact",
    items: [],
    notes: "",
    ...overrides,
  };
}

function formatCurrency(amount) {
  return `$${Math.round(Number(amount) || 0).toLocaleString()}`;
}

function formatMaterialsAmount(amount, mode = "exact") {
  if (mode === "included") return "Included";
  if (mode === "approx") return `Approx. ${formatCurrency(amount)}`;
  return formatCurrency(amount);
}

function recalcTotals(inv) {
  const labour = (inv.items || []).reduce(
    (s, r) => s + (r.included ? 0 : Number(r.amount) || 0),
    0
  );
  const materials =
    Number(inv.matFixed || 0) + labour * (Number(inv.matPct || 0) / 100);
  const beforeDiscount = labour + materials;
  const discount = beforeDiscount * (Number(inv.discPct || 0) / 100);
  const subtotal = beforeDiscount - discount;
  const effectiveTaxRate = inv.taxNow ? Number(inv.taxRate || 0) : 0;
  const taxableBeforeDiscount =
    labour + (inv.materialsTaxMode === "nonTaxable" ? 0 : materials);
  const discountShare =
    beforeDiscount > 0 ? discount * (taxableBeforeDiscount / beforeDiscount) : 0;
  const taxableSubtotal = Math.max(0, taxableBeforeDiscount - discountShare);
  const tax = taxableSubtotal * (effectiveTaxRate / 100);
  const total = subtotal + tax;
  return { labour, materials, discount, subtotal, tax, total };
}

function normalizeInvoice(inv) {
  const normalized = blankInvoice({
    ...inv,
    items: Array.isArray(inv?.items)
      ? inv.items.map((item) => ({
          description: item?.description || "",
          qty: Number(item?.qty || 0),
          unit: item?.unit || "",
          rate: Number(item?.rate || 0),
          amount: Number(item?.amount || 0),
          included: Boolean(item?.included),
        }))
      : [],
  });
  return {
    ...normalized,
    totals: recalcTotals(normalized),
  };
}

function parseStoredList(rawStr) {
  if (!rawStr) return [];
  try {
    const parsed = JSON.parse(rawStr);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {}
  return [];
}

async function syncInvoiceToClientHistory(savedInvoice, savedAt) {
  if (typeof window === "undefined" || !savedInvoice?.crmClientId) return false;

  let clients = parseStoredList(window.localStorage.getItem(CRM_STORAGE_KEY));

  try {
    const res = await fetch("/api/crm", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) clients = data.items;
    }
  } catch (err) {
    console.warn("Failed to fetch latest CRM before invoice history sync", err);
  }

  const clientIndex = clients.findIndex(
    (client) => client.id === savedInvoice.crmClientId
  );
  if (clientIndex === -1) return false;

  const invoiceLabel = savedInvoice.quoteId || savedInvoice.id || "invoice";
  const totalLabel = formatCurrency(savedInvoice.totals?.total || 0);
  const dateLabel = new Date(savedAt).toLocaleString("en-CA");
  const currentClient = clients[clientIndex];
  const historyItem = {
    id: `invoice-${savedInvoice.id}-${Date.now()}`,
    date: dateLabel,
    field: "invoice",
    from: "—",
    to: `${invoiceLabel} saved for ${totalLabel}`,
  };

  const nextClient = {
    ...currentClient,
    updatedAt: savedAt,
    activity: [
      `${dateLabel}: Invoice ${invoiceLabel} saved for ${totalLabel}.`,
      ...(currentClient.activity || []),
    ],
    editHistory: [historyItem, ...(currentClient.editHistory || [])],
  };
  const nextClients = [...clients];
  nextClients[clientIndex] = nextClient;

  try {
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(nextClients));
  } catch {}

  try {
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clients: nextClients }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to sync invoice history to CRM", err);
    return false;
  }
}

// 🔹 Inner component that actually uses useSearchParams / useRouter
function InvoiceBasicPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = searchParams.get("id");
  const forceNewInvoice = searchParams.get("new") === "1";
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saveStatus, setSaveStatus] = useState("");

  // load invoice (by id or last draft)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function load() {
      try {
        let loaded = null;

        if (invoiceId && !forceNewInvoice) {
          const raw = localStorage.getItem("epf.invoices");
          const rawEs = localStorage.getItem("epf.eslist");
          const list = parseStoredList(raw);
          const esList = parseStoredList(rawEs);
          loaded =
            list.find((inv) => inv.id === invoiceId) ||
            esList.find((inv) => inv.id === invoiceId) ||
            null;

          // Always try API for freshest copy
          try {
            const res = await fetch(
              `/api/invoices?id=${encodeURIComponent(invoiceId)}`,
              { cache: "no-store" }
            );
            if (res.ok) {
              const remote = await res.json();
              if (remote?.id) {
                loaded = remote;
              }
            }
          } catch (err) {
            console.warn("Failed to fetch invoice from API", err);
          }
        }

        if (!loaded && !forceNewInvoice) {
          const rawDraft = localStorage.getItem("epf.invoiceDraft");
          if (rawDraft) {
            loaded = JSON.parse(rawDraft);
          }
        }

        if (!loaded) {
          const queryClient = searchParams.get("client") || "";
          const queryContact = searchParams.get("contact") || "";
          const querySite = searchParams.get("site") || "";
          const queryService = searchParams.get("service") || "";
          const queryAmount = Number(searchParams.get("amount") || 0);
          const queryCrmClientId = searchParams.get("clientId") || "";

          loaded = blankInvoice({
            crmClientId: queryCrmClientId,
            client: queryClient,
            contact: queryContact,
            site: querySite,
            items: queryService
              ? [
                  {
                    description: queryService,
                    qty: 1,
                    unit: "job",
                    rate: queryAmount || 0,
                    amount: queryAmount || 0,
                  },
                ]
              : [],
          });
        }

        loaded = normalizeInvoice(loaded);
        if (!cancelled) {
          startTransition(() => {
            setInvoice(loaded);
            setStatus("ready");
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          startTransition(() => {
            setStatus("error");
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, forceNewInvoice, searchParams]);

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
    if (["taxRate", "taxNow", "matFixed", "matPct", "discPct"].includes(field)) {
      if (field === "taxNow") {
        next[field] = Boolean(value);
      } else {
        next[field] = Number(value) || 0;
      }
      next.totals = recalcTotals(next);
    }
    if (field === "materialsTaxMode") {
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
    } else if (field === "included") {
      row.included = Boolean(value);
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
      included: false,
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

  const moveItem = (idx, direction) => {
    const items = [...(invoice.items || [])];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const [item] = items.splice(idx, 1);
    items.splice(targetIdx, 0, item);
    const next = { ...invoice, items };
    next.totals = recalcTotals(next);
    setInvoice(next);
  };

  const handleSave = async ({ silent = false } = {}) => {
    if (typeof window === "undefined") return;
    setSaveStatus("Saving invoice...");

    const now = new Date().toISOString();
    let list = [];
    try {
      const raw = localStorage.getItem("epf.invoices");
      list = parseStoredList(raw);
    } catch (e) {
      list = [];
    }

    let toSave = normalizeInvoice({ ...invoice, updatedAt: now });

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
    let invoiceSynced = false;
    let crmSynced = false;
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: toSave }),
      });
      invoiceSynced = res.ok;
    } catch (err) {
      console.warn("Failed to persist invoice to API", err);
    }

    crmSynced = await syncInvoiceToClientHistory(toSave, now);
    setInvoice(toSave);
    setSaveStatus(
      invoiceSynced
        ? crmSynced
          ? "Invoice saved and CRM history synced."
          : toSave.crmClientId
          ? "Invoice saved. CRM history saved locally; cloud CRM sync was unavailable."
          : "Invoice saved."
        : "Invoice saved on this device. Cloud invoice sync was unavailable."
    );
    if (!silent) alert("Invoice saved.");
    return toSave;
  };

  const handlePrint = async () => {
    const saved = await handleSave({ silent: true });
    if (!saved || typeof window === "undefined") return;
    window.setTimeout(() => window.print(), 50);
  };

  const t = invoice.totals || recalcTotals(invoice);
  const brand = BRAND_PROFILES[invoice.brandKey] || BRAND_PROFILES.epf;
  const materialsMode = invoice.materialsMode || "exact";
  const materialsNote =
    materialsMode === "approx" ? APPROX_MATERIALS_NOTE : "";
  const crmBackHref = invoice.crmClientId ? `/crm?client=${invoice.crmClientId}` : "/crm";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <nav className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center gap-2 print:hidden">
        <Link
          href="/invoices"
          className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Invoices
        </Link>
        <Link
          href="/invoice-basic?new=1"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
        >
          New Invoice
        </Link>
        <Link
          href={crmBackHref}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
        >
          CRM
        </Link>
        <Link
          href="/estimate-builder"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
        >
          Estimate Builder
        </Link>
        <Link
          href="/"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
        >
          Menu
        </Link>
      </nav>
      <div className="invoice-document mx-auto max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white p-1.5"
              style={brand.brandColor ? { borderColor: brand.brandColor } : undefined}
            >
              <Image
                src={brand.logoSrc || "/logo/image.png"}
                alt={brand.logoAlt || `${brand.name} logo`}
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-brand">
                {brand.name}
              </div>
              {brand.tagline ? (
                <div className="text-[11px] text-slate-600">{brand.tagline}</div>
              ) : null}
              <div className="text-[11px] text-slate-500">
                {brand.contactLine}
              </div>
              {invoice.hstNumber ? (
                <div className="text-[11px] font-medium text-slate-600">
                  HST #: {invoice.hstNumber}
                </div>
              ) : null}
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
              <div className="text-xs text-slate-500">Phone / Email</div>
              <input
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                value={invoice.contact || ""}
                onChange={(e) => updateField("contact", e.target.value)}
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
            <div>
              <div className="text-xs text-slate-500">Company</div>
              <select
                className="w-full border border-slate-200 rounded-md bg-white px-2 py-1 text-sm"
                value={invoice.brandKey || "epf"}
                onChange={(e) => updateField("brandKey", e.target.value)}
              >
                <option value="epf">EPF Pro Services</option>
                <option value="popcornCalgary">Popcorn Ceiling Removal Calgary</option>
                <option value="alphaDrywall">Alpha Drywall Finishing</option>
              </select>
            </div>
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
            <div>
              <div className="text-xs text-slate-500">HST number</div>
              <input
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                value={invoice.hstNumber || ""}
                onChange={(e) => updateField("hstNumber", e.target.value)}
                placeholder="Business HST #"
              />
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
                  <th className="invoice-detail-column text-right px-2 py-1 w-[10%]">Qty</th>
                  <th className="invoice-detail-column text-left px-2 py-1 w-[10%]">Unit</th>
                  <th className="invoice-rate-column text-right px-2 py-1 w-[15%]">Rate</th>
                  <th className="invoice-include-column text-center px-2 py-1 w-[10%]">Include</th>
                  <th className="text-right px-2 py-1 w-[15%]">Amount</th>
                  <th className="invoice-row-actions px-2 py-1 w-[5%]"></th>
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
                    <td className="invoice-detail-column px-2 py-1 text-right align-top">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-md px-1 py-1 text-right"
                        value={row.qty ?? ""}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      />
                    </td>
                    <td className="invoice-detail-column px-2 py-1 align-top">
                      <input
                        className="w-full border border-slate-200 rounded-md px-1 py-1"
                        value={row.unit || ""}
                        onChange={(e) =>
                          updateItem(idx, "unit", e.target.value)
                        }
                      />
                    </td>
                    <td className="invoice-rate-column px-2 py-1 text-right align-top">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-md px-1 py-1 text-right"
                        value={row.rate ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                      />
                    </td>
                    <td className="invoice-include-column px-2 py-1 text-center align-top">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(row.included)}
                        onChange={(e) =>
                          updateItem(idx, "included", e.target.checked)
                        }
                        title="Show as included"
                      />
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      <span className="invoice-amount-print font-semibold text-slate-900">
                        {row.included ? "Included" : formatCurrency(row.amount)}
                      </span>
                      <div className="invoice-amount-edit">
                        {row.included ? (
                          <span className="font-semibold text-slate-700">Included</span>
                        ) : (
                          <input
                            type="number"
                            className="w-full border border-slate-200 rounded-md px-1 py-1 text-right"
                            value={row.amount ?? ""}
                            onChange={(e) =>
                              updateItem(idx, "amount", e.target.value)
                            }
                          />
                        )}
                      </div>
                    </td>
                    <td className="invoice-row-actions px-2 py-1 text-center align-top">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          className="rounded border border-slate-200 px-2 py-1 text-slate-500 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move row up"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="rounded border border-slate-200 px-2 py-1 text-slate-500 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === (invoice.items || []).length - 1}
                          aria-label="Move row down"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => removeItem(idx)}
                          aria-label="Remove row"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!invoice.items || invoice.items.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
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
            <div className="invoice-settings grid grid-cols-[1.5fr,1fr] gap-2 mb-1">
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
            <label className="invoice-settings flex items-center justify-between gap-2">
              <span>Materials display</span>
              <select
                className="w-32 border border-slate-200 rounded-md px-2 py-1 text-right bg-white"
                value={materialsMode}
                onChange={(e) => updateField("materialsMode", e.target.value)}
              >
                <option value="exact">Exact cost</option>
                <option value="included">Included</option>
                <option value="approx">Approx.</option>
              </select>
            </label>
            <label className="invoice-settings flex items-center justify-between gap-2">
              <span>Materials HST</span>
              <select
                className="w-32 border border-slate-200 rounded-md px-2 py-1 text-right bg-white"
                value={invoice.materialsTaxMode || "taxable"}
                onChange={(e) => updateField("materialsTaxMode", e.target.value)}
              >
                <option value="taxable">With HST</option>
                <option value="nonTaxable">Without HST</option>
              </select>
            </label>
            {materialsNote ? (
              <div className="text-[11px] text-slate-500">{materialsNote}</div>
            ) : null}
            <label className="invoice-settings flex items-center justify-between gap-2">
              <span>Discount (%)</span>
              <input
                type="number"
                className="w-20 border border-slate-200 rounded-md px-2 py-1 text-right"
                value={invoice.discPct ?? 0}
                onChange={(e) => updateField("discPct", e.target.value)}
              />
            </label>
            <label className="invoice-settings flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1">
              <span>Charge HST</span>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(invoice.taxNow)}
                onChange={(e) => updateField("taxNow", e.target.checked)}
              />
            </label>
            <label className="invoice-settings flex items-center justify-between gap-2">
              <span>HST rate (%)</span>
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
                <span>{formatCurrency(t.labour)}</span>
              </div>
              <div className="flex justify-between">
                <span>Materials</span>
                <span>{formatMaterialsAmount(t.materials, materialsMode)}</span>
              </div>
              {t.discount ? (
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(t.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(t.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>HST</span>
                <span>{formatCurrency(t.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-slate-200 mt-1">
                <span>Total</span>
                <span>{formatCurrency(t.total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="invoice-actions flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-brand text-white text-sm font-semibold hover:opacity-90"
          >
            Save changes
          </button>
          {saveStatus ? (
            <p className="text-xs font-medium text-slate-500">{saveStatus}</p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
            >
              Save + Print / Send PDF
            </button>
            <button
              type="button"
              onClick={() => router.push(crmBackHref)}
              className="px-3 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand"
            >
              Back to CRM
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
