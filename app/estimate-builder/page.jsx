"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";
import PopcornSection from "@/components/estimate/PopcornSection";
import PaintingSection from "@/components/estimate/PaintingSection";
import AdditionalServicesSection from "@/components/estimate/AdditionalServicesSection";
import SERVICE_COST from "@/components/estimate/ServiceCost";
import PrintLayout from "@/components/estimate/PrintLayout";
const STATE_KEY = "epf.estimateState.v2";
const CRM_STORAGE_KEY = "epf.crm.clients";
const ES_LIST_KEY = "epf.eslist";
const ES_COUNTER_KEY = "epf.es.counter";
const CUSTOM_SERVICE_KEY = "epf.customServices.v1";
const SERVICE_OVERRIDE_KEY = "epf.serviceOverrides.v1";

const BRAND_PROFILES = {
  epf: {
    name: "EPF Pro Services",
    tagline: "Popcorn ceiling & interior finishing specialists",
    contactLine: "info@epfproservices.com • 647-923-6784 • epfproservices.com",
    logoSrc: "/logo/image.png",
    logoAlt: "EPF logo",
    legalLine: "",
    footerLines: [
      "EPF Pro Services • 647-923-6784 • info@epfproservices.com • epfproservices.com",
      "WSIB + Liability Insured • Workmanship warranty against application defects (1 year)",
    ],
    preparedBy: "Alex — EPF Pro Services",
    brandColor: "#e11d48",
  },
  popcornCalgary: {
    name: "Popcorn Ceiling Removal Calgary",
    tagline: "Smooth ceilings & finishing specialists — Calgary & area",
    contactLine: "(825) 365-3770 • info@popcornceilingremoval.com",
    logoSrc: "/logo/popcorn-calgary.jpg",
    logoAlt: "Popcorn Ceiling Removal Calgary logo",
    legalLine: "Operated under legal name Alpha Drywall Finishing",
    footerLines: [
      "Operated under legal name Alpha Drywall Finishing",
      "Popcorn Ceiling Removal Calgary • Serving Calgary, AB",
      "Hours: Mon–Sat 8am–6pm • 220 Southpoint Greenway SW, Airdrie, AB T4B 5P4",
      "CALL (825) 365-3770 • info@popcornceilingremoval.com",
    ],
    preparedBy: "Alex — Popcorn Ceiling Removal Calgary",
    brandColor: "#f97316",
  },
  alphaDrywall: {
    name: "Alpha Drywall Finishing",
    tagline: "Serving Calgary, AB",
    contactLine: "Mon–Sat 8am–6pm • (825) 365-3770",
    logoSrc: "/logo/alpha-drywall.png",
    logoAlt: "Alpha Drywall Finishing logo",
    legalLine: "",
    footerLines: [
      "Alpha Drywall Finishing",
      "Serving Calgary, AB",
      "Hours: Mon–Sat 8am–6pm",
      "220 Southpoint Greenway SW, Airdrie, AB T4B 5P4",
      "CALL (825) 365-3770",
    ],
    preparedBy: "Yehor — Alpha Drywall Finishing",
    brandColor: "#0ea5e9",
  },
};




/** ===== Default short details under each service line ===== */
const SERVICE_DETAILS = {
  "popcorn-unpainted-sf": [
    "Dust-controlled scrape of texture",
    "HEPA sand to smooth + check seams",
    "Prime entire ceiling paint-ready",
    "Floors, fixtures, vents masked tight",
    "Crew hauls debris + vacuums daily",
  ],
  "popcorn-painted-sf": [
    "Remove painted texture with wet scrape",
    "Repair joints & seams to Level 5",
    "HEPA sand, primer + ready for finishing",
    "Containment to protect walls + flooring",
    "Daily cleanup and final vacuuming",
  ],
  "popcorn-stairwell-job": [
    "Scaffold/ladders set safely with tie-offs",
    "Full containment & masking of walls",
    "Texture removal + Level 5 skim + prime",
    "Stair treads protected / slip resistant",
    "Crew handles all cleanup + disposal",
  ],
  "walls-standard-room": [
    "Fill holes, caulk trim + sand smooth",
    "Dust control + wipe before coating",
    "2 finish coats on walls w/ pro sprayer or roll",
    "Minor colour adjustments included",
    "Client walkthrough for touch-ups",
  ],
  "walls-large-room": [
    "Patch drywall seams / nail pops",
    "Cut-in clean lines at ceilings + trim",
    "2–3 coats for full, even coverage",
    "Furniture moved/covered + returned",
    "Final punch with client before demob",
  ],
  "ceiling-room": [
    "Mask fixtures + cover flooring",
    "Prime where needed for adhesion",
    "2 coats ceiling white, rolled smooth",
    "Edges cut clean to walls",
    "Area cleaned + airflow restored",
  ],
  "door-frame": [
    "Degloss / spot sand & clean",
    "Caulk joints + repair dents",
    "2 coats semi-gloss sprayed/rolled",
    "Hardware removed, reinstalled",
  ],
  "trim-baseboards": [
    "Clean + scuff sand for adhesion",
    "Caulk joints + fill nail holes",
    "2 coats durable enamel",
    "Final wipe + floors vacuumed",
  ],
  "drywall-small-patch": [
    "Cut back to solid gypsum",
    "Install backing + fill hole/crack",
    "Sand smooth, feather edges",
    "Spot-prime + ready for paint",
  ],
  "drywall-large-patch": [
    "Cut & re-board area with screws",
    "Tape, 2–3 coats compound, feathered",
    "Sand smooth + HEPA vacuum",
    "Prime and blend to surrounding",
    "Includes minor texture matching",
  ],
  "corner-bead": [
    "Set metal/vinyl bead true & plumb",
    "Fasten securely, mud to straight edge",
    "Sand smooth + check with straightedge",
    "Prime-ready finish, crisp corners",
  ],
  "debris-disposal": [
    "Bag & remove site waste/popcorn",
    "Load-out & haul with dump fees included",
    "Work area swept + damp mopped",
    "Disposal documented for homeowner",
  ],
  "site-protection": [
    "Cover floors (RamBoard / poly)",
    "Mask casings, cabinets, fixtures",
    "Seal returns/vents and isolate dust",
    "Daily tidy + photos of setup",
  ],
};

// Role-based defaults (popcorn bundle rows)
const ROLE_DETAILS = {
  base: [
    "Dust-controlled texture removal",
    "HEPA sand ceilings smooth",
    "Edges kept crisp",
    "Floors & openings sealed off",
  ],
  floor: [
    "RamBoard / poly protection",
    "Tape baseboards & stairs",
    "Remove + reset coverings per day",
  ],
  skim: [
    "2–3 passes joint compound",
    "Feather to edges + inspect with light",
    "Final HEPA sand + dust removal",
  ],
  prime: [
    "Prime repairs/stains for uniformity",
    "Back-roll for even coverage",
    "Check for touch-ups before paint",
  ],
  paint: [
    "2 coats ceiling finish",
    "Clean cut lines + even texture",
    "Low-VOC coatings for occupied homes",
  ],
  cleanup: [
    "HEPA vacuum surfaces & vents",
    "Bag debris + wipe touch points",
    "Daily tidy + final walkthrough",
  ],
};

const WALL_HEIGHT_FT = 8;
const SERVICE_SECTION_ORDER = {
  "sec-paint": 0,
  "sec-popcorn": 1,
  "sec-add": 2,
};

async function persistInvoiceRemote(record) {
  if (typeof window === "undefined" || !record?.id) return;
  try {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record }),
    });
    if (!res.ok) {
      console.warn("Remote invoice save failed", res.status);
    }
  } catch (err) {
    console.warn("Failed to sync invoice to server", err);
  }
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

async function attachEstimateToCrmClient(record) {
  if (typeof window === "undefined" || !record?.crmClientId) return false;

  let clients = parseStoredList(window.localStorage.getItem(CRM_STORAGE_KEY));

  try {
    const res = await fetch("/api/crm", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) clients = data.items;
    }
  } catch (err) {
    console.warn("Failed to fetch latest CRM before estimate attach", err);
  }

  const clientIndex = clients.findIndex((client) => client.id === record.crmClientId);
  if (clientIndex === -1) return false;

  const now = new Date().toISOString();
  const currentClient = clients[clientIndex];
  const estimateIds = [record.id, ...(currentClient.estimateIds || [])].filter(Boolean);
  const total = Number(record.totals?.total || 0);
  const totalLabel = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(total) ? total : 0);
  const estimateLabel = record.quoteId || record.id || "estimate";

  const nextClient = {
    ...currentClient,
    estimateIds: [...new Set(estimateIds)],
    estimateAmount: currentClient.estimateAmount || String(Math.round(Number.isFinite(total) ? total : 0)),
    updatedAt: now,
    communicationLog: [
      {
        id: `estimate-${record.id}-${Date.now()}`,
        date: now,
        type: "estimate",
        direction: "internal",
        content: `Estimate ${estimateLabel} saved for ${totalLabel}.`,
        createdBy: "Estimate Builder",
      },
      ...(currentClient.communicationLog || []),
    ],
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
    console.warn("Failed to attach estimate to CRM client", err);
    return false;
  }
}

// Name-based heuristics (fallback)
function heuristicDetails(desc = "") {
  const s = desc.toLowerCase();
  if (s.includes("walls"))
    return [
      "Fill dents + caulk trim",
      "Light sand & dust control",
      "2 coats finish paint",
      "Furniture carefully reset",
    ];
  if (s.includes("ceiling paint"))
    return [
      "Prime stains / repairs",
      "2 coats ceiling white",
      "Fixtures masked & cleaned",
    ];
  if (s.includes("door"))
    return [
      "Degloss/sand + clean",
      "Caulk joints, fill dents",
      "2 coats semi-gloss",
      "Hardware removed/reinstalled",
    ];
  if (s.includes("window"))
    return [
      "Mask glass & hardware",
      "Prep casing + stool",
      "2 coats enamel finish",
      "Clean glass after painting",
    ];
  if (s.includes("closet"))
    return [
      "Walls + shelf/rod coated",
      "Clean straight cut-ins",
      "2 coats finish colour",
      "Floors protected + vacuumed",
    ];
  if (s.includes("trim") || s.includes("baseboard"))
    return [
      "Clean & sand for adhesion",
      "Caulk + fill nail holes",
      "2 coats enamel finish",
      "Final dust + wipe down",
    ];
  if (s.includes("drywall") && s.includes("patch"))
    return [
      "Repair cut back to solid",
      "Feather compound smooth",
      "Sand + spot-prime",
      "Ready for paint",
    ];
  if (s.includes("debris") || s.includes("disposal"))
    return [
      "Bag & remove waste",
      "Transport + dump fees included",
      "Site swept / vacuumed",
    ];
  return [
    "Crews perform prep + protection",
    "Scope includes labour + materials noted",
    "Daily cleanup + communication",
  ];
}

function detailsFor({ tmplId, role, desc }) {
  if (tmplId && SERVICE_DETAILS[tmplId]) return SERVICE_DETAILS[tmplId];
  if (role && ROLE_DETAILS[role]) return ROLE_DETAILS[role];
  return heuristicDetails(desc);
}

function renderDescWithDetails(name, detailsArr) {
  const lines =
    (detailsArr || [])
      .map((d) => `<div class="small" contenteditable="true">${d}</div>`)
      .join("") ||
    `<div class="small" contenteditable="true">Details / area</div>`;
  return `${name}${lines}`;
}

/** ===== Split-out client/job block (IDs kept the same) ===== */
function EstimateClientJobBlock({ defaultPreparedBy }) {
  return (
    <div className="block grid2">
      <div className="card">
        <h3>Estimate To</h3>
        <div className="kv">
          <label>Client</label>
          <div id="client" contentEditable suppressContentEditableWarning>
            [Full name]
          </div>
        </div>
        <div className="kv">
          <label>Phone / Email</label>
          <div
            id="clientContact"
            contentEditable
            suppressContentEditableWarning
          >
            [Phone] • [Email]
          </div>
        </div>
        <div className="kv">
          <label>Address</label>
          <input id="site" type="text" placeholder="[Street, City]" />
        </div>

        {/* Google Place ID (optional) — INTERNAL ONLY */}
        <div className="kv internalOnly">
          <label>Google Place ID (optional)</label>
          <div className="row" style={{ gap: 8 }}>
            <input
              id="g_place_id"
              type="text"
              placeholder="ChIJxxxxxxxxxxxxxxxx"
            />
            <a
              id="gmapsLink"
              className="btn ghost"
              target="_blank"
              rel="noreferrer"
              style={{ display: "none" }}
            >
              Open in Maps
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Job Details</h3>
        <div className="row">
          <div className="kv">
            <label>Date</label>
            <input id="date" type="date" />
          </div>
          <div className="kv">
            <label>Quote #</label>
            <div id="qid" contentEditable suppressContentEditableWarning>
              EPF-QUOTE
            </div>
          </div>
        </div>
        <div className="kv">
          <label>Prepared by</label>
          <div
            id="preparedBy"
            key={defaultPreparedBy}
            contentEditable
            suppressContentEditableWarning
          >
            {defaultPreparedBy || "Alex — EPF Pro Services"}
          </div>
        </div>
        <div className="kv">
          <label>Start window</label>
          <div id="startWindow" contentEditable suppressContentEditableWarning>
            [TBD]
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- Save invoice helpers (DOM + localStorage operations) ---------- */
function saveInvoiceRecord(data) {
  if (typeof window === "undefined") return data;

  const primaryId =
    (data.id || data.quoteId || "").toString().trim() || "INV-" + Date.now();
  const brandKey =
    data.brandKey ||
    data.brand ||
    (typeof window !== "undefined" ? window.__EPF_BRAND__ : null) ||
    "epf";

  const now = new Date().toISOString();

  const record = {
    ...data,
    id: primaryId,
    quoteId: data.quoteId || primaryId,
    brandKey,
    updatedAt: now,
    createdAt: data.createdAt || now,
  };

  let list = [];
  try {
    const raw = window.localStorage.getItem("epf.invoices");
    list = raw ? JSON.parse(raw) || [] : [];
  } catch {
    list = [];
  }

  // overwrite if same id exists
  list = list.filter((inv) => inv.id !== record.id);
  list.unshift(record);

  try {
    window.localStorage.setItem("epf.invoices", JSON.stringify(list));
    window.localStorage.setItem("epf.invoiceDraft", JSON.stringify(record));
    console.debug("Saved invoice record", {
      id: record.id,
      quoteId: record.quoteId,
      brandKey: record.brandKey,
      listSize: list.length,
    });
  } catch (err) {
    console.error("Failed to save invoice record", err);
  }

  void persistInvoiceRemote(record);
  void attachEstimateToCrmClient(record);
  return record;
}

// Separate ES list storage (Alpha audit)
function saveEsRecord(data) {
  if (typeof window === "undefined") return data;

  const brand =
    data.brandKey ||
    data.brand ||
    (typeof window !== "undefined" ? window.__EPF_BRAND__ : null) ||
    "alphaDrywall";

  const nextEsId = (existingId) => {
    if (existingId && String(existingId).startsWith("ES-")) return existingId;
    try {
      const raw = window.localStorage.getItem(ES_COUNTER_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const current = Number(parsed[brand]) || 0;
      const next = current + 1;
      parsed[brand] = next;
      window.localStorage.setItem(ES_COUNTER_KEY, JSON.stringify(parsed));
      return `ES-${brand}-${String(next).padStart(4, "0")}`;
    } catch {
      return `ES-${brand}-${Date.now()}`;
    }
  };

  const primaryId = nextEsId(data.id || data.quoteId);

  const now = new Date().toISOString();

  const record = {
    ...data,
    id: primaryId,
    quoteId: data.quoteId || primaryId,
    brandKey: brand,
    savedAt: now,
  };

  let list = [];
  try {
    const raw = window.localStorage.getItem(ES_LIST_KEY);
    list = raw ? JSON.parse(raw) || [] : [];
  } catch {
    list = [];
  }

  list = list.filter((inv) => inv.id !== record.id);
  list.unshift(record);

  try {
    // 1) Save to ES list (alpha-only audit)
    window.localStorage.setItem(ES_LIST_KEY, JSON.stringify(list));

    console.debug("Saved to ES list", {
      id: record.id,
      quoteId: record.quoteId,
      brandKey: record.brandKey,
      listSize: list.length,
    });

    // 2) ALSO mirror into main invoices list for /invoices page
    saveInvoiceRecord(record);
  } catch (err) {
    console.error("Failed to save ES record", err);
  }

  void persistInvoiceRemote(record);
  return record;
}

function scrapeEstimateFromDom(brandOverride) {
  if (typeof window === "undefined") return null;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const val = (sel) => {
    const el = $(sel);
    if (!el) return "";
    if ("value" in el && el.value != null) return String(el.value).trim();
    return (el.textContent || "").trim();
  };
  const ensureQuoteId = () => {
    const existing = val("#qid");
    if (existing && existing !== "EPF-QUOTE") return existing;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generated = `EPF-${randomSuffix}`;
    const qidEl = document.querySelector("#qid");
    if (qidEl) qidEl.textContent = generated;
    return generated;
  };

  const defaultNotes =
    "Dust-controlled removal, masking, HEPA sanding, and daily cleanup. Smooth finish ready for paint.";
  const brandKey =
    brandOverride ||
    (typeof window !== "undefined" ? window.__EPF_BRAND__ || "epf" : "epf");

  const base = {
    client: val("#client"),
    contact: val("#clientContact"),
    site: val("#site"),
    preparedBy: val("#preparedBy"),
    startWindow: val("#startWindow"),
    gPlaceId: val("#g_place_id"),
    date: $("#date")?.value || new Date().toISOString().slice(0, 10),
    quoteId: ensureQuoteId(),
    taxRate: parseFloat($("#tax_rate")?.value || "13"),
    matFixed: parseFloat($("#mat_fixed")?.value || "0"),
    matPct: parseFloat($("#mat_pct")?.value || "0"),
    depositAmount: parseFloat($("#deposit_amount")?.value || "0"),
    materialsMode: val("#mat_display") || "exact",
    discPct: parseFloat($("#disc_pct")?.value || "0"),
    items: [],
    notes: val("#scope_notes") || defaultNotes,
    brandKey,
    crmClientId:
      window.__EPF_CRM_CLIENT_ID__ ||
      new URLSearchParams(window.location.search || "").get("clientId") ||
      "",
  };

  const sections = [];
  let labourTotal = 0;
  $$(".sec").forEach((sec) => {
    if (sec.dataset.hideCustomer === "1") return;
    if (sec.getAttribute("data-enabled") !== "1") return;
    const secTitle = sec.querySelector(".secTitle")?.textContent?.trim() || "";
    const rows = $$("tbody tr", sec).filter(
      (tr) => !tr.classList.contains("roomHeader")
    );
    const sectionItems = [];
    let sectionTotal = 0;
    rows.forEach((tr) => {
      const descCell = tr.querySelector("td");
      const qty = parseFloat(tr.querySelector(".qty")?.value || "0") || 0;
      const rate = parseFloat(tr.querySelector(".rate")?.value || "0") || 0;
      const amt =
        parseFloat(tr.querySelector(".amt")?.value || "0") ||
        (qty && rate ? qty * rate : 0);
      const isPrivate = tr.classList.contains("private");
      sectionTotal += amt;
      labourTotal += amt;
      if (!isPrivate) {
        const zeroLabel = tr.dataset.zeroLabel || "";
        const item = {
          description: (descCell?.innerText || "").trim(),
          qty,
          unit: tr.querySelector(".unit")?.value || "",
          rate,
          amount: amt,
          zeroLabel,
        };
        base.items.push(item);
        sectionItems.push(item);
      }
    });
    if (sectionItems.length) {
      sections.push({
        title: secTitle,
        items: sectionItems,
        total: sectionTotal,
      });
    }
  });
  base.sections = sections;

  const labour = labourTotal;
  const materials = base.matFixed + labour * (base.matPct / 100);
  const discount = (labour + materials) * (base.discPct / 100);
  const subtotal = labour + materials - discount;
  const taxNow = document.getElementById("cbTaxNow")?.checked ?? false;
  const effectiveTaxRate = taxNow ? base.taxRate : 0;
  const tax = subtotal * (effectiveTaxRate / 100);
  const total = subtotal + tax;
  return {
    ...base,
    taxNow,
    totals: { labour, materials, discount, subtotal, tax, total },
  };
}

function saveAsInvoice() {
  const data = scrapeEstimateFromDom(
    (typeof window !== "undefined" && window.__EPF_BRAND__) || "epf"
  );
  if (!data || typeof window === "undefined") return;
  const { gPlaceId, ...safe } = data; // strip internal-only field

  const saved =
    data.brandKey === "alphaDrywall"
      ? saveEsRecord(safe)
      : saveInvoiceRecord(safe);

  const targetId = saved?.id || data.id;
  if (targetId) {
    window.location.href = `/invoice-basic?id=${encodeURIComponent(targetId)}`;
  }
}

function saveEstimateForLater(currentBrandKey = "epf") {
  const data = scrapeEstimateFromDom(currentBrandKey);
  if (!data) return;
  const record =
    data.brandKey === "alphaDrywall"
      ? saveEsRecord(data)
      : saveInvoiceRecord(data);
  if (record && typeof window !== "undefined") {
    window.alert(
      `Estimate saved as invoice "${record.id}".\n\nLater open /invoice-basic?id=${record.id} to view/print.`
    );
  }
}

export default function EstimateBuilderPage() {
  const [accessMode, setAccessMode] = useState(() => {
    if (typeof window === "undefined") return null;
    if (new URLSearchParams(window.location.search || "").get("brandScope") === "calgary") {
      return "team";
    }
    const storedAccess = window.localStorage.getItem("epf.accessMode");
    return storedAccess === "alphaOnly" || storedAccess === "full"
      ? storedAccess
      : null;
  }); // null | "full" | "alphaOnly" | "team"
  const [passInput, setPassInput] = useState("");
  const [brandKey, setBrandKeyState] = useState(() => {
    if (typeof window === "undefined") return "epf";
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("brandScope") === "calgary") {
      const requestedBrand = params.get("brand");
      return requestedBrand === "alphaDrywall" ? "alphaDrywall" : "popcornCalgary";
    }
    return window.localStorage.getItem("epf.accessMode") === "alphaOnly"
      ? "alphaDrywall"
      : "epf";
  });
  const brandKeyRef = useRef(brandKey);
  const [quotesClickCount, setQuotesClickCount] = useState(0);
  const setBrandKey = useCallback(
    (nextKey) =>
      setBrandKeyState(
        accessMode === "alphaOnly"
          ? "alphaDrywall"
          : accessMode === "team" && nextKey === "epf"
            ? "popcornCalgary"
            : nextKey || (accessMode === "team" ? "popcornCalgary" : "epf")
      ),
    [accessMode]
  );
  const [printSnapshot, setPrintSnapshot] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [crmClientId, setCrmClientId] = useState("");
  const activeBrand = BRAND_PROFILES[brandKey] || BRAND_PROFILES.epf;
  useEffect(() => {
    brandKeyRef.current = brandKey;
  }, [brandKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("brandScope") !== "calgary") return;
    window.__EPF_BRAND__ = brandKey === "alphaDrywall" ? "alphaDrywall" : "popcornCalgary";
    if (accessMode !== "team" || brandKey === "epf") {
      window.setTimeout(() => {
        if (accessMode !== "team") setAccessMode("team");
        if (brandKey === "epf") setBrandKey("popcornCalgary");
      }, 0);
    }
  }, [accessMode, brandKey, setBrandKey]);


  // Prevent navigating away via back button when locked to Alpha-only
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (accessMode !== "alphaOnly") return;
    const handler = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [accessMode, setBrandKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (accessMode === null) return;
    window.__EPF_BRAND__ = brandKey;
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      const state = raw ? JSON.parse(raw) || {} : {};
      if (raw) {
        const next = {
          ...state,
          meta: { ...(state.meta || {}), brand: brandKey },
        };
        window.localStorage.setItem(STATE_KEY, JSON.stringify(next));
      }
    } catch {}
  }, [accessMode, brandKey]);

  // Brand-specific layout toggles (currently none; keep hook for future)
  useEffect(() => {}, [brandKey]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (accessMode === null) {
      window.__EPF_ESTIMATE_INITED__ = false;
      return;
    }
    if (window.__EPF_ESTIMATE_INITED__) return;
    window.__EPF_ESTIMATE_INITED__ = true;

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /** ========= STATE SNAPSHOT (JSON) ========= */
    function snapshotEstimate() {
      const sections = {};
      document.querySelectorAll(".sec").forEach((sec) => {
        const id = sec.id || "";
        const items = [];
        const tb = sec.querySelector("tbody");
        (tb ? Array.from(tb.querySelectorAll("tr")) : []).forEach((tr) => {
          if (tr.classList.contains("roomHeader")) {
            items.push({
              kind: "roomHeader",
              group: tr.dataset.group || "",
              roomName:
                tr.querySelector(".roomName")?.textContent?.trim() ||
                (tr.textContent || "").trim(),
              painted:
                tr.querySelector(".roomPaintSel")?.value === "painted"
                  ? "painted"
                  : "unpainted",
            });
          } else {
            const td = tr.querySelector("td");
            items.push({
              kind: "row",
              descHTML: td ? td.innerHTML : "Description…",
              qty: tr.querySelector(".qty")?.value || "",
              unit: tr.querySelector(".unit")?.value || "sf",
              rate: tr.querySelector(".rate")?.value || "",
              privateRow: tr.classList.contains("private") ? 1 : 0,
              group: tr.dataset.group || "",
              role: tr.dataset.role || "",
              zeroLabel: tr.dataset.zeroLabel || "",
            });
          }
        });
        sections[id] = {
          title: sec.querySelector(".secTitle")?.textContent?.trim() || "",
          enabled: sec.getAttribute("data-enabled") === "1" ? 1 : 0,
          hide: sec.getAttribute("data-hide-customer") === "1" ? 1 : 0,
          height: sec.dataset.height || "1",
          linksf: sec.dataset.linksf || "1",
          items,
        };
      });

      const meta = {
        date: $("#date")?.value || "",
        client: ($("#client")?.textContent || "").trim(),
        contact: ($("#clientContact")?.textContent || "").trim(),
        site: $("#site")?.value || ($("#site")?.textContent || "").trim(),
        brand: typeof window !== "undefined" ? window.__EPF_BRAND__ || "epf" : "epf",
        qid: ($("#qid")?.textContent || "").trim(),
        preparedBy: ($("#preparedBy")?.textContent || "").trim(),
        startWindow: ($("#startWindow")?.textContent || "").trim(),
        mat_fixed: $("#mat_fixed")?.value || "0",
        mat_pct: $("#mat_pct")?.value || "0",
        deposit_amount: $("#deposit_amount")?.value || "0",
        mat_display: $("#mat_display")?.value || "exact",
        disc_pct: $("#disc_pct")?.value || "0",
        tax_rate: $("#tax_rate")?.value || "13",
        tax_now: $("#cbTaxNow")?.checked ? 1 : 0,
        g_place_id: $("#g_place_id")?.value || "",
        paint_dim_width: $("#paint_dim_width")?.value || "",
        paint_dim_depth: $("#paint_dim_depth")?.value || "",
        crmClientId:
          window.__EPF_CRM_CLIENT_ID__ ||
          new URLSearchParams(window.location.search || "").get("clientId") ||
          "",
      };
      return { sections, meta };
    }

    function restoreEstimate(state) {
      if (!state) return;
      const { sections, meta } = state;

      // meta
      const setVal = (sel, value) => {
        const el = document.querySelector(sel);
        if (!el) return;
        if (
          "value" in el &&
          ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)
        )
          el.value = value ?? el.value;
        else el.textContent = value ?? el.textContent;
      };
      const restoredBrand = meta?.brand || "epf";
      if (typeof window !== "undefined")
        window.__EPF_BRAND__ = restoredBrand;
      setBrandKey(restoredBrand);
      const brandProfile =
        BRAND_PROFILES[restoredBrand] || BRAND_PROFILES.epf;
      if (meta.date) setVal("#date", meta.date);
      if (meta.crmClientId) window.__EPF_CRM_CLIENT_ID__ = meta.crmClientId;
      setVal("#client", meta.client || "[Full name]");
      setVal("#clientContact", meta.contact || "[Phone] • [Email]");
      const siteEl = document.querySelector("#site");
      if (siteEl) {
        if (siteEl.tagName === "INPUT") siteEl.value = meta.site || "";
        else siteEl.textContent = meta.site || "";
      }
      setVal("#qid", meta.qid || "EPF-QUOTE");
      setVal(
        "#preparedBy",
        meta.preparedBy || brandProfile.preparedBy || "Alex — EPF Pro Services"
      );
      setVal("#startWindow", meta.startWindow || "[TBD]");
      setVal("#mat_fixed", meta.mat_fixed || "0");
      setVal("#mat_pct", meta.mat_pct || "0");
      setVal("#deposit_amount", meta.deposit_amount || "0");
      setVal("#mat_display", meta.mat_display || "exact");
      setVal("#disc_pct", meta.disc_pct || "0");
      setVal("#tax_rate", meta.tax_rate || "13");
      const cb = document.querySelector("#cbTaxNow");
      if (cb) cb.checked = !!meta.tax_now;
      const gpid = document.querySelector("#g_place_id");
      if (gpid && "value" in gpid) gpid.value = meta.g_place_id || "";
      const dimWidth = document.getElementById("paint_dim_width");
      if (dimWidth && "value" in dimWidth)
        dimWidth.value = meta.paint_dim_width || "";
      const dimDepth = document.getElementById("paint_dim_depth");
      if (dimDepth && "value" in dimDepth)
        dimDepth.value = meta.paint_dim_depth || "";

      // sections
      Object.entries(sections || {}).forEach(([id, spec]) => {
        let sec = document.getElementById(id);
        if (!sec) sec = createCustomSection(spec.title || "Section", id);
        sec.setAttribute("data-enabled", spec.enabled ? "1" : "0");
        sec.setAttribute("data-hide-customer", spec.hide ? "1" : "0");

        const hideCb = sec.querySelector(".hideSec");
        if (hideCb) hideCb.checked = !!spec.hide;

        if (id === "sec-popcorn") {
          sec.dataset.height = spec.height || "1";
          sec.dataset.linksf = spec.linksf || "1";
        }
        const tb = sec.querySelector("tbody");
        if (tb) tb.innerHTML = "";

        spec.items?.forEach((it) => {
          if (it.kind === "roomHeader") {
            const hdr = document.createElement("tr");
            hdr.className = "roomHeader";
            hdr.dataset.group = it.group || "";
            hdr.dataset.roomName = it.roomName || "Room";
            hdr.innerHTML = `
              <td colspan="6">
                <span class="roomName" contenteditable="true">${
                  it.roomName || "Room"
                }</span>
                <span> — </span>
                <select class="roomPaintSel">
                  <option value="unpainted"${
                    it.painted === "painted" ? "" : " selected"
                  }>unpainted</option>
                  <option value="painted"${
                    it.painted === "painted" ? " selected" : ""
                  }>painted</option>
                </select>
              </td>`;
            tb?.appendChild(hdr);
          } else if (it.kind === "row") {
            addRow(sec, {
              descHTML: it.descHTML,
              qty: it.qty,
              unit: it.unit,
              rate: it.rate,
              privateRow: !!it.privateRow,
              group: it.group,
              role: it.role,
              zeroLabel: it.zeroLabel || "",
            });
          }
        });
      });

      updateMapsLink();
      attachSectionControls(); // ensure per-section controls exist + totals
    }

    function applyCrmPrefillFromQuery() {
      const params = new URLSearchParams(window.location.search || "");
      if (params.get("source") !== "crm") return;
      window.__EPF_CRM_CLIENT_ID__ = params.get("clientId") || "";
      setCrmClientId(window.__EPF_CRM_CLIENT_ID__);
      const quoteAmount = Number(String(params.get("amount") || "").replace(/[^0-9.]/g, ""));
      const service = params.get("work") || params.get("service");
      const size = params.get("size");
      const notes = params.get("notes") || "";

      const setText = (sel, value) => {
        const trimmed = String(value || "").trim();
        if (!trimmed) return;
        const el = document.querySelector(sel);
        if (!el) return;
        if ("value" in el && ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) {
          el.value = trimmed;
        } else {
          el.textContent = trimmed;
        }
      };

      setText("#client", params.get("client"));
      setText("#clientContact", params.get("contact"));
      setText("#site", params.get("site"));
      setText("#scope_notes", notes);

      const estimateDate = params.get("estimateDate") || params.get("requestedDate");
      if (estimateDate) setText("#startWindow", estimateDate);
      if (params.get("assignedTo")) {
        const assignedTo = params.get("assignedTo");
        const brand = params.get("brand") || window.__EPF_BRAND__ || "epf";
        const brandProfile = BRAND_PROFILES[brand] || BRAND_PROFILES.epf;
        setText("#preparedBy", `${assignedTo} — ${brandProfile.name}`);
      }
      if (service || size) {
        setText(
          "#startWindow",
          [service, size ? `Size: ${size}` : "", estimateDate ? `Date: ${estimateDate}` : ""]
            .filter(Boolean)
            .join(" | ")
        );
      }

      if (Number.isFinite(quoteAmount) && quoteAmount > 0) {
        buildCrmQuoteSection({
          amount: quoteAmount,
          service,
          size,
          notes,
        });
      }

      if (params.get("autoAttach") === "1" && window.__EPF_CRM_CLIENT_ID__) {
        const key = `epf.crm.autoAttach.${window.__EPF_CRM_CLIENT_ID__}.${Math.round(quoteAmount || 0)}`;
        if (!window.sessionStorage.getItem(key)) {
          window.sessionStorage.setItem(key, "1");
          window.setTimeout(() => {
            try {
              const data = scrapeEstimateFromDom(
                (typeof window !== "undefined" && window.__EPF_BRAND__) || "epf"
              );
              if (!data) return;
              const { gPlaceId, ...safe } = data;
              const record =
                safe.brandKey === "alphaDrywall" ? saveEsRecord(safe) : saveInvoiceRecord(safe);
              if (record?.id) {
                console.debug("CRM estimate auto-attached", {
                  clientId: window.__EPF_CRM_CLIENT_ID__,
                  estimateId: record.id,
                });
              }
            } catch (err) {
              console.warn("Failed to auto-attach CRM estimate", err);
            }
          }, 250);
        }
      }
    }

    function escapeHtml(value = "") {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function buildDetailsHtml(title, details = []) {
      const detailList = details
        .filter(Boolean)
        .map((detail) => `<li>${escapeHtml(detail)}</li>`)
        .join("");
      return `<strong>${escapeHtml(title)}</strong>${detailList ? `<ul>${detailList}</ul>` : ""}`;
    }

    function buildCrmQuoteSection({ amount = 0, service = "", size = "", notes = "" } = {}) {
      const existing = document.getElementById("sec-crm-quote");
      if (existing) existing.remove();

      const sec = createCustomSection("Quote", "sec-crm-quote");
      const lowerService = String(service || "").toLowerCase();
      const isPopcorn = lowerService.includes("popcorn") || lowerService.includes("stucco");
      const mainTitle = service || (isPopcorn ? "Popcorn ceiling removal - unpainted" : "Project work");
      const mainDetails = isPopcorn
        ? [
            "Dust-controlled texture removal",
            "HEPA sand ceilings smooth",
            "Edges kept crisp",
            "Floors & openings sealed off",
          ]
        : [
            "Professional labour and site preparation",
            "Materials and work areas organized",
            "Daily cleanup included",
            "Final walkthrough included",
          ];

      addRow(sec, {
        descHTML: buildDetailsHtml(size ? `${mainTitle} (${size})` : mainTitle, mainDetails),
        qty: 1,
        unit: "job",
        rate: amount,
      });

      const includedRows = isPopcorn
        ? [
            [
              "Floor protection & masking",
              ["RamBoard / poly protection", "Tape baseboards & stairs", "Remove + reset coverings per day"],
            ],
            [
              "Level 5 skim coat",
              ["2-3 passes joint compound", "Feather to edges + inspect with light", "Final HEPA sand + dust removal"],
            ],
            [
              "Ceiling priming",
              ["Prime repairs/stains for uniformity", "Back-roll for even coverage", "Check for touch-ups before paint"],
            ],
            [
              "Ceiling paint (2 coats)",
              ["2 coats ceiling finish", "Clean cut lines + even texture", "Low-VOC coatings for occupied homes"],
            ],
            [
              "Cleanup & disposal",
              ["HEPA vacuum surfaces & vents", "Bag debris + wipe touch points", "Daily tidy + final walkthrough"],
            ],
          ]
        : [
            ["Site protection & masking", ["Floors and adjacent areas protected", "Daily cleanup included"]],
            ["Preparation & finishing", ["Surface prep included", "Ready-for-client walkthrough"]],
          ];

      includedRows.forEach(([title, details]) => {
        addRow(sec, {
          descHTML: buildDetailsHtml(title, details),
          qty: 1,
          unit: "job",
          rate: 0,
          zeroLabel: "included",
        });
      });

      const taxNow = document.getElementById("cbTaxNow");
      if (taxNow) taxNow.checked = false;
      const matDisplay = document.getElementById("mat_display");
      if (matDisplay) matDisplay.value = "included";
      if (notes) setTextValue("#scope_notes", notes);
      window.__EPF_RECALC__?.();
    }

    function setTextValue(sel, value) {
      const trimmed = String(value || "").trim();
      if (!trimmed) return;
      const el = document.querySelector(sel);
      if (!el) return;
      if ("value" in el && ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) {
        el.value = trimmed;
      } else {
        el.textContent = trimmed;
      }
    }

    function resetEstimateToBlankForCrm() {
      const coreIds = new Set(["sec-popcorn", "sec-paint", "sec-add"]);
      document.querySelectorAll(".sec").forEach((sec) => {
        if (!coreIds.has(sec.id)) {
          sec.remove();
          return;
        }
        sec.setAttribute("data-enabled", "0");
        sec.setAttribute("data-hide-customer", "0");
        const tb = sec.querySelector("tbody");
        if (tb) tb.innerHTML = "";
        const hideCb = sec.querySelector(".hideSec");
        if (hideCb) hideCb.checked = false;
      });
      document.querySelectorAll(".svc").forEach((checkbox) => {
        checkbox.checked = false;
      });
      attachSectionControls();
      window.__EPF_RECALC__?.();
    }

    // autosave (JSON snapshot)
    let draftTimer = null;
    function scheduleDraftSave() {
      if (draftTimer) window.clearTimeout(draftTimer);
      draftTimer = window.setTimeout(() => {
        try {
          const snap = snapshotEstimate();
          window.localStorage.setItem(STATE_KEY, JSON.stringify(snap));
        } catch (err) {
          console.warn("Failed to save draft", err);
        }
      }, 300);
    }

    // === Create a brand-new custom section (appears above totals) ===
    function createCustomSection(title = "Custom Section", forcedId) {
      const page = document.getElementById("page");
      const sum = document.querySelector(".sum");
      const id = forcedId || "sec-custom-" + Date.now().toString(36);
      const tbId = "tb-" + id.replace(/^sec-/, "");
      const sec = document.createElement("section");
      sec.id = id;
      sec.className = "sec";
      sec.setAttribute("data-enabled", "1");
      sec.setAttribute("data-hide-customer", "0");
      sec.innerHTML = `
        <div class="card">
          <div class="secHead">
            <h3 class="secTitle" contenteditable="true">${title}</h3>
            <label class="ml-3"><input type="checkbox" class="hideSec"> Hide from customer</label>
          </div>
          <table class="grid">
            <colgroup>
              <col class="col-desc">
              <col class="col-qty">
              <col class="col-unit">
              <col class="col-rate">
              <col class="col-amount">
              <col class="col-actions">
            </colgroup>
            <thead>
              <tr>
                <th>Description</th>
                <th class="num">Qty</th>
                <th>Unit</th>
                <th class="num">Rate</th>
                <th class="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="${tbId}"></tbody>
          </table>
        </div>`;
      page.insertBefore(sec, sum || null);
      // add totals and per-section controls under the section
      appendControlsForSection(sec);
      return sec;
    }

    // === Per-section totals + controls (appended BELOW each section) ===
    function appendControlsForSection(sec) {
      if (!sec) return;

      // 1) Section Total Card (pretty & print-friendly)
      if (!sec.querySelector(".secTotalCard")) {
        const totalCard = document.createElement("div");
        totalCard.className = "secTotalCard card";
        totalCard.innerHTML = `
          <div class="secTotalRow">
            <span class="lbl">Section total</span>
            <span class="val">$0</span>
          </div>
          <small class="hint">Labour only — materials/discount/tax are calculated globally below.</small>
        `;
        sec.appendChild(totalCard);
      }

      // 2) Controls Card (unchanged buttons)
      if (!sec.querySelector(".sectionControls")) {
        const controls = document.createElement("div");
        controls.className = "sectionControls";
        const isPop = sec.id === "sec-popcorn";
        const isPaint = sec.id === "sec-paint";
        const isCore =
          sec.id === "sec-popcorn" ||
          sec.id === "sec-paint" ||
          sec.id === "sec-add";

        controls.innerHTML = `
          <div class="card">
            <div class="right">
              ${
                isPop
                  ? `<button type="button" class="btn ghost addRoomPop">＋ Add Popcorn Room</button>`
                  : ""
              }
              ${
                isPaint
                  ? `<button type="button" class="btn ghost addRoom">＋ Add Paint Room</button>`
                  : ""
              }
              <button type="button" class="btn ghost addLine">＋ Custom line</button>
              <button type="button" class="btn del clearSection">Clear section</button>
              ${
                !isCore
                  ? `<button type="button" class="btn del removeSection">Remove section</button>`
                  : ""
              }
            </div>
          </div>`;
        sec.appendChild(controls);
      }
    }

    function attachSectionControls() {
      document
        .querySelectorAll(".sec")
        .forEach((sec) => appendControlsForSection(sec));
    }

    // === Global top buttons ===
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      if (t.id === "addSection") {
        const title = window.prompt("New section title?", "Custom Section");
        createCustomSection(title || "Custom Section");
        return;
      }
      if (t.id === "clearAll") {
        document
          .querySelectorAll(".sec tbody")
          .forEach((tb) => (tb.innerHTML = ""));
        window.__EPF_RECALC__?.();
        return;
      }
    });

    /** ========= Helpers ========= */
    const PERIMETER_MATCHERS = ["baseboard", "crown", "crown moulding", "crown molding", "casing"];

    function isPerimeterRow(tr) {
      if (!tr) return false;
      if (tr.dataset.linear === "perimeter") return true;
      const unitSel = tr.querySelector(".unit");
      const unitVal = unitSel?.value?.toLowerCase();
      if (unitVal !== "lf") return false;
      const descCell = tr.querySelector("td");
      const descText = (descCell?.textContent || "").toLowerCase();
      return PERIMETER_MATCHERS.some((matcher) => descText.includes(matcher));
    }

    function applyPerimeterValueToRow(tr, perimeter) {
      if (!perimeter || perimeter <= 0 || !isPerimeterRow(tr)) return;
      const qtyInput = tr.querySelector(".qty");
      if (qtyInput) qtyInput.value = String(perimeter);
    }

    function updateAllPerimeterRows(perimeter) {
      if (!perimeter || perimeter <= 0) return;
      document
        .querySelectorAll(".sec tbody tr")
        .forEach((row) => applyPerimeterValueToRow(row, perimeter));
    }

    function findMovableSiblingRow(tr, direction) {
      if (!tr) return null;
      const step =
        direction < 0 ? "previousElementSibling" : "nextElementSibling";
      const group = tr.dataset.group || "";
      let cursor = tr;

      while (cursor) {
        cursor = cursor[step];
        if (!cursor) return null;
        if (cursor.classList?.contains("roomHeader")) {
          if (group) return null;
          continue;
        }
        if (group && (cursor.dataset.group || "") !== group) return null;
        return cursor;
      }

      return null;
    }

    function moveRow(tr, direction) {
      const target = findMovableSiblingRow(tr, direction);
      const parent = tr?.parentElement;
      if (!target || !parent) return;
      if (direction < 0) parent.insertBefore(tr, target);
      else parent.insertBefore(target, tr);
      window.__EPF_RECALC__?.();
      scheduleDraftSave();
    }

    function addRow(sec, opts) {
      const tb = sec.querySelector("tbody");
      const o = Object.assign(
        {
          desc: "Description…",
          descHTML: null,
          qty: "",
          unit: "sf",
          rate: "",
          privateRow: false,
          group: "",
          role: "",
          tmplId: null,
          details: null,
          linear: null,
          zeroLabel: null,
        },
        opts || {}
      );
      const tr = document.createElement("tr");
      if (o.privateRow) tr.classList.add("private");
      if (o.group) tr.dataset.group = o.group;
      if (o.role) tr.dataset.role = o.role;
      if (o.linear) tr.dataset.linear = o.linear;
      const zeroLabel =
        o.zeroLabel ??
        (/\(included\)/i.test(String(o.descHTML ?? o.desc ?? ""))
          ? "included"
          : "");
      tr.dataset.zeroLabel = zeroLabel;

      const detailsArr =
        o.details ??
        detailsFor({ tmplId: o.tmplId, role: o.role, desc: o.desc });
      const descHTML = o.descHTML ?? renderDescWithDetails(o.desc, detailsArr);

      tr.innerHTML = `
        <td class="descCell" data-label="Description" contenteditable="true">${descHTML}</td>
        <td class="num qtyCell" data-label="Qty">
          <div class="qtyWrap">
            <input class="qty" type="number" step="0.01" inputmode="decimal" value="${
              o.qty !== "" ? o.qty : ""
            }">
            <button class="btn mini qtyWheel" title="Pick quantity">▦</button>
          </div>
        </td>
        <td data-label="Unit">
          <select class="unit">
            <option value="sf"${o.unit === "sf" ? " selected" : ""}>sf</option>
            <option value="ea"${o.unit === "ea" ? " selected" : ""}>ea</option>
            <option value="job"${
              o.unit === "job" ? " selected" : ""
            }>job</option>
            <option value="lf"${o.unit === "lf" ? " selected" : ""}>lf</option>
            <option value="door"${
              o.unit === "door" ? " selected" : ""
            }>door</option>
            <option value="room"${
              o.unit === "room" ? " selected" : ""
            }>room</option>
            <option value="allow"${
              o.unit === "allow" ? " selected" : ""
            }>allow</option>
          </select>
        </td>
        <td class="num col-rate" data-label="Rate">
          <input class="rate" type="number" step="0.01" inputmode="decimal" value="${
            o.rate !== "" ? o.rate : ""
          }">
        </td>
        <td class="num amtCell" data-label="Amount">
          <input class="amt" type="number" step="0.01" disabled>
        </td>
        <td class="num rowActionsCell" data-label="Actions">
          <label class="rowFlag">
            <input type="checkbox" class="rowIncludeToggle"${
              zeroLabel === "included" ? " checked" : ""
            }>
            <span>Included</span>
          </label>
          <div class="rowActions">
            <button class="btn ghost mini moveUp" type="button" title="Move up" aria-label="Move row up">↑</button>
            <button class="btn ghost mini moveDown" type="button" title="Move down" aria-label="Move row down">↓</button>
            <button class="btn ghost chooseService" type="button" title="Pick service">⋯</button>
            <button class="btn del" type="button" title="Remove">✕</button>
          </div>
        </td>
      `;
      tb?.appendChild(tr);
      if (typeof window !== "undefined" && window.__EPF_LAST_PERIM__) {
        applyPerimeterValueToRow(tr, window.__EPF_LAST_PERIM__);
      }
      return tr;
    }

    function setPopcornGroupSF(groupId, sf) {
      const numericSF = Number(sf);
      if (!groupId || Number.isNaN(numericSF)) return;
      const baseRow = document.querySelector(
        `#sec-popcorn tbody tr[data-group="${groupId}"][data-role="base"]`
      );
      const qtyInput = baseRow?.querySelector(".qty");
      if (qtyInput) {
        qtyInput.value = String(numericSF);
        qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    function addPopRoom(roomLabel, type, opts = {}) {
      const tb = $("#tb-popcorn");
      const group =
        "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const painted = (type || "unpainted").includes("paint");
      const baseRate = painted ? 2.5 : 2.0;
      if (!tb) return;

      const hdr = document.createElement("tr");
      hdr.className = "roomHeader";
      hdr.dataset.group = group;
      hdr.innerHTML = `
        <td colspan="6">
          <span class="roomName" contenteditable="true">${roomLabel}</span>
          <span> — </span>
          <select class="roomPaintSel">
            <option value="unpainted"${
              painted ? "" : " selected"
            }>unpainted</option>
            <option value="painted"${
              painted ? " selected" : ""
            }>painted</option>
          </select>
        </td>`;
      tb.appendChild(hdr);

      const popSecLocal = $("#sec-popcorn");

      addRow(popSecLocal, {
        desc:
          "Popcorn ceiling removal — " + (painted ? "painted" : "unpainted"),
        unit: "sf",
        rate: baseRate,
        group,
        role: "base",
      });
      addRow(popSecLocal, {
        desc: "Floor protection & masking",
        unit: "sf",
        rate: 0.4,
        group,
        role: "floor",
      });
      addRow(popSecLocal, {
        desc: "Level 5 skim coat",
        unit: "sf",
        rate: 2.25,
        group,
        role: "skim",
      });
      addRow(popSecLocal, {
        desc: "Ceiling priming",
        unit: "sf",
        rate: 1.0,
        group,
        role: "prime",
      });
      addRow(popSecLocal, {
        desc: "Ceiling paint (2 coats)",
        unit: "sf",
        rate: 2.0,
        group,
        role: "paint",
      });
      addRow(popSecLocal, {
        desc: "Cleanup — HEPA vacuum & site cleaning (included)",
        qty: 1,
        unit: "job",
        rate: 0,
        group,
        role: "cleanup",
        zeroLabel: "included",
      });

      if (!tb.querySelector('tr[data-role="min"]')) {
        addRow(popSecLocal, {
          desc: "Minimum job charge (internal)",
          qty: 1,
          unit: "job",
          rate: 1800,
          privateRow: true,
          group,
          role: "min",
        });
      }
      scheduleDraftSave();
      if (opts.initialSF != null) {
        setPopcornGroupSF(group, opts.initialSF);
      }
      return group;
    }

    function addPaintRoom(roomLabel, opts = {}) {
      const sec = $("#sec-paint");
      if (!sec) return;
      const tb = sec.querySelector("tbody");
      if (!tb) return;

      const group =
        opts.group ||
        "paint-" + Date.now().toString(36) + Math.random().toString(36).slice(2);

      const hdr = document.createElement("tr");
      hdr.className = "roomHeader";
      hdr.dataset.group = group;
      hdr.dataset.roomName = roomLabel || "Room";
      hdr.innerHTML = `<td colspan="6"><span class="roomName">${roomLabel}</span></td>`;
      tb.appendChild(hdr);

      const addPaintLine = (lineOpts) =>
        addRow(sec, {
          ...lineOpts,
          group,
        });

      const wallsRow = addPaintLine({
        desc: "Walls paint",
        unit: "ea",
        rate: 750,
        role: "walls",
      });
      addPaintLine({ desc: "Door frame", unit: "door", rate: 80 });
      addPaintLine({ desc: "Window", unit: "ea", rate: 80 });
      addPaintLine({ desc: "Closet", unit: "ea", rate: 120 });
      scheduleDraftSave();

      const width = Number(opts.width) || 0;
      const depth = Number(opts.depth) || 0;
      if (width > 0 && depth > 0 && wallsRow) {
        const wallsSF = Math.round(2 * (width + depth) * WALL_HEIGHT_FT);
        const ceilingSF = Math.round(width * depth);
        const perimeterLF = Math.round(2 * (width + depth));
        const qtyInput = wallsRow.querySelector(".qty");
        const unitSel = wallsRow.querySelector(".unit");
        if (qtyInput) qtyInput.value = String(wallsSF);
        if (unitSel) unitSel.value = "sf";
        if (perimeterLF > 0) {
          if (typeof window !== "undefined")
            window.__EPF_LAST_PERIM__ = perimeterLF;
          updateAllPerimeterRows(perimeterLF);
        }

        if (
          window.confirm(
            "Also add this room to Popcorn removal with these dimensions?"
          )
        ) {
          createPopcornRoomFromDims(roomLabel, ceilingSF);
        }
      }
    }

    function createPopcornRoomFromDims(roomName, ceilingSF) {
      if (!ceilingSF) return;
      let label = roomName?.trim();
      if (!label) {
        label = window.prompt("Popcorn room name?", "New room")?.trim() || "";
      }
      if (!label) return;
      const type = window
        .prompt(
          `Ceiling type for "${label}"? Enter "unpainted" or "painted".`,
          "unpainted"
        )
        ?.toLowerCase();
      const addedGroup = addPopRoom(label, type || "unpainted", {
        initialSF: ceilingSF,
      });
      if (addedGroup) {
        setPopcornGroupSF(addedGroup, ceilingSF);
      }
    }

    function getPaintRoomMetaForRow(row) {
      if (!row) return null;
      const group = row.dataset.group;
      const lookupHeader = (grp) =>
        grp
          ? document.querySelector(
              `#sec-paint .roomHeader[data-group="${grp}"]`
            )
          : null;
      if (group) {
        const header = lookupHeader(group);
        if (header) {
          const name =
            header.dataset.roomName ||
            header.querySelector(".roomName")?.textContent?.trim() ||
            header.textContent?.trim() ||
            "";
          return { group, header, name };
        }
      }
      let cursor = row.previousElementSibling;
      while (cursor) {
        if (cursor.classList?.contains("roomHeader")) {
          const name =
            cursor.dataset?.roomName ||
            cursor.querySelector(".roomName")?.textContent?.trim() ||
            cursor.textContent?.trim() ||
            "";
          return { group: cursor.dataset?.group || "", header: cursor, name };
        }
        cursor = cursor.previousElementSibling;
      }
      return null;
    }

  function applyPaintDimensions(options = {}) {
    const { promptPopcorn = false } = options;
    const widthInput = document.getElementById("paint_dim_width");
    const depthInput = document.getElementById("paint_dim_depth");
    const width = parseFloat(widthInput?.value || "0");
    const depth = parseFloat(depthInput?.value || "0");
    if (!width || !depth) {
      window.alert("Enter both wall width and depth (in feet) before applying.");
      return;
    }
    const wallsSF = Math.max(
      0,
      Math.round(2 * (width + depth) * WALL_HEIGHT_FT)
    );
    const ceilingSF = Math.max(0, Math.round(width * depth));
    const perimeterLF = Math.max(0, Math.round(2 * (width + depth)));

    const paintSec = document.getElementById("sec-paint");
    let roomNameForPrompt = "";
    if (paintSec) {
      let targetRow =
        paintSec.querySelector('tbody tr[data-role="walls"]') || null;
      if (!targetRow) {
        targetRow = addRow(paintSec, {
          desc: "Walls paint (calc)",
          unit: "sf",
          role: "walls",
        });
      }
      const roomMeta = getPaintRoomMetaForRow(targetRow);
      roomNameForPrompt = roomMeta?.name || "";
      const qtyInput = targetRow?.querySelector(".qty");
      if (qtyInput) qtyInput.value = String(wallsSF);
      const unitSel = targetRow?.querySelector(".unit");
      if (unitSel) unitSel.value = "sf";
    }

    const popSec = document.getElementById("sec-popcorn");
    if (popSec) {
      const ceilingRow =
        popSec.querySelector('tbody tr[data-role="base"]') ||
        popSec.querySelector("#tb-popcorn tr");
      const groupId = ceilingRow?.dataset.group;
      if (groupId) {
        setPopcornGroupSF(groupId, ceilingSF);
      } else {
        const qtyInput = ceilingRow?.querySelector(".qty");
        if (qtyInput) {
          qtyInput.value = String(ceilingSF);
          qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }

    if (perimeterLF > 0) {
      if (typeof window !== "undefined") window.__EPF_LAST_PERIM__ = perimeterLF;
      updateAllPerimeterRows(perimeterLF);
    }

    if (promptPopcorn && ceilingSF > 0) {
      const defaultName = roomNameForPrompt || "Room";
      const addPop = window.confirm(
        `Add popcorn/stucco removal for "${defaultName}" using ${ceilingSF} sf ceiling?`
      );
      if (addPop) {
        const customName =
          window.prompt("Popcorn room name?", defaultName)?.trim() ||
          defaultName;
        createPopcornRoomFromDims(customName, ceilingSF);
      }
    }

    scheduleDraftSave();
    window.__EPF_RECALC__?.();
  }

    function initPopcornDefaults() {
      addPopRoom("Main areas", "unpainted");
    }

    /** ========= Recalc totals (now includes per-section totals) ========= */
    function recalc() {
      let grandLabour = 0;
      const materialsMode = $("#mat_display")?.value || "exact";

      $$(".sec").forEach((sec) => {
        // If section disabled, clear its total and skip row math
        if (sec.getAttribute("data-enabled") !== "1") {
          const st = sec.querySelector(".secTotalCard .val");
          if (st) st.textContent = "$0";
          return;
        }

        const isPop = sec.id === "sec-popcorn";
        const heightFactor = isPop ? parseFloat(sec.dataset.height || "1") : 1;
        let sectionLabour = 0;

        $$("tbody tr", sec).forEach((tr) => {
          const qtyEl = tr.querySelector(".qty");
          const rateEl = tr.querySelector(".rate");
          const amtEl = tr.querySelector(".amt");
          if (!qtyEl || !rateEl || !amtEl) return;

          let qty = parseFloat(qtyEl.value || "0");
          const rate = parseFloat(rateEl.value || "0");
          const unit = (tr.querySelector(".unit")?.value || "").toLowerCase();

          // Popcorn height multiplier applies to sf rows
          if (isPop && unit === "sf") qty = qty * (heightFactor || 1);

          const amount = qty * rate;
          amtEl.value = amount ? amount.toFixed(2) : "";
          amtEl.placeholder =
            amount === 0 && tr.dataset.zeroLabel === "included"
              ? "Included"
              : "";
          sectionLabour += amount;
        });

        // Update section total display
        const st = sec.querySelector(".secTotalCard .val");
        if (st)
          st.textContent = "$" + Math.round(sectionLabour).toLocaleString();

        grandLabour += sectionLabour;
      });

      const mat_fixed = parseFloat($("#mat_fixed")?.value || "0");
      const mat_pct = parseFloat($("#mat_pct")?.value || "0");
      const disc_pct = parseFloat($("#disc_pct")?.value || "0");
      const base_tax_rate = parseFloat($("#tax_rate")?.value || "13");
      const calcTax = $("#cbTaxNow")?.checked ?? false;

      const materials = mat_fixed + grandLabour * (mat_pct / 100);
      const discount = (grandLabour + materials) * (disc_pct / 100);
      const subtotal = grandLabour + materials - discount;
      const effectiveTaxRate = calcTax ? base_tax_rate : 0;
      const tax = subtotal * (effectiveTaxRate / 100);
      const total = subtotal + tax;

      const setText = (sel, text) => {
        const el = $(sel);
        if (el) el.textContent = text;
      };
      const materialSummary =
        materialsMode === "included"
          ? "Included"
          : materialsMode === "approx"
            ? `Approx. $${Math.round(materials).toLocaleString()}`
            : "$" + Math.round(materials).toLocaleString();
      setText("#s_labour", "$" + Math.round(grandLabour).toLocaleString());
      setText("#s_mat", materialSummary);
      setText(
        "#s_disc",
        (discount ? "-" : "") + "$" + Math.round(discount).toLocaleString()
      );
      setText("#s_sub", "$" + Math.round(subtotal).toLocaleString());
      setText("#taxLbl", calcTax ? String(base_tax_rate) : "—");
      setText("#s_tax", "$" + Math.round(tax).toLocaleString());
      setText("#s_total", "$" + Math.round(total).toLocaleString());
      setText("#hdr_total", "$" + Math.round(total).toLocaleString());

      const taxNotice = $("#taxNotice");
      if (taxNotice) {
        taxNotice.textContent = calcTax
          ? "HST calculated in totals"
          : "HST will be added at end of project";
      }

      scheduleDraftSave();
    }
    window.__EPF_RECALC__ = recalc;

    /** ========= Qty “wheel” picker (mobile) ========= */
    let qtyPickerRoot = null;
    function ensureQtyPicker() {
      if (qtyPickerRoot) return qtyPickerRoot;
      qtyPickerRoot = document.createElement("div");
      qtyPickerRoot.className = "epf-qty-picker";
      qtyPickerRoot.innerHTML = `
        <div class="eqp-backdrop"></div>
        <div class="eqp-panel">
          <div class="eqp-header">
            <div class="eqp-title">Set Quantity</div>
            <button class="eqp-close">Close</button>
          </div>
          <div class="eqp-body">
            <select class="eqp-wheel" size="6" aria-label="Quantity"></select>
            <div class="eqp-actions">
              <button class="btn ghost eqp-minus">−</button>
              <input class="eqp-direct" type="number" step="0.01" inputmode="decimal" />
              <button class="btn ghost eqp-plus">+</button>
              <button class="btn primary eqp-apply">Apply</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(qtyPickerRoot);
      return qtyPickerRoot;
    }
    function fillWheel(wheel, max = 2000, step = 5) {
      wheel.innerHTML = "";
      for (let v = 0; v <= max; v += step) {
        const opt = document.createElement("option");
        opt.value = String(v);
        opt.textContent = String(v);
        wheel.appendChild(opt);
      }
    }
    let qtyTargetInput = null;
    function openQtyPicker(targetInput) {
      const root = ensureQtyPicker();
      const wheel = root.querySelector(".eqp-wheel");
      const direct = root.querySelector(".eqp-direct");
      fillWheel(wheel);
      qtyTargetInput = targetInput;
      const current = parseFloat(targetInput.value || "0") || 0;
      direct.value = String(current);
      let nearest = Math.round(current / 5) * 5;
      nearest = Math.max(0, Math.min(nearest, 2000));
      Array.from(wheel.options).forEach(
        (o) => (o.selected = Number(o.value) === nearest)
      );
      root.classList.add("open");
      setTimeout(() => wheel.focus(), 0);
    }
    function closeQtyPicker() {
      if (qtyPickerRoot) qtyPickerRoot.classList.remove("open");
      qtyTargetInput = null;
    }
    document.addEventListener("click", (e) => {
      if (e.target.closest(".eqp-close") || e.target.closest(".eqp-backdrop"))
        closeQtyPicker();
      if (e.target.classList?.contains("eqp-apply")) {
        const direct = qtyPickerRoot.querySelector(".eqp-direct");
        if (qtyTargetInput && direct) {
          qtyTargetInput.value = direct.value;
          window.__EPF_RECALC__?.();
        }
        closeQtyPicker();
      }
      if (e.target.classList?.contains("eqp-plus")) {
        const direct = qtyPickerRoot.querySelector(".eqp-direct");
        direct.value = String((parseFloat(direct.value || "0") || 0) + 1);
      }
      if (e.target.classList?.contains("eqp-minus")) {
        const direct = qtyPickerRoot.querySelector(".eqp-direct");
        const v = (parseFloat(direct.value || "0") || 0) - 1;
        direct.value = String(v < 0 ? 0 : v);
      }
    });
    document.addEventListener("change", (e) => {
      if (e.target.classList?.contains("eqp-wheel")) {
        const direct = qtyPickerRoot.querySelector(".eqp-direct");
        direct.value = e.target.value;
      }
    });
    // Allow manual typing on mobile — no auto-open on focus
    document.addEventListener("focusin", () => {});

    /** ========= UI bindings ========= */
    $("#toggleCustomer")?.addEventListener("click", () => {
      document.body.classList.toggle("customer");
    });

    $("#cbKeepSections")?.addEventListener("change", (e) => {
      const target = e.target;
      if (target && "checked" in target) {
        document.body.classList.toggle("keep-sections", target.checked);
      }
    });

    // Section enable/disable toggles
    $$(".svc").forEach((chk) => {
      const sel = chk.getAttribute("data-target");
      const sec = sel ? document.querySelector(sel) : null;
      if (!sec) return;
      const setState = (on) => sec.setAttribute("data-enabled", on ? "1" : "0");
      setState(chk.checked);
      chk.addEventListener("change", () => {
        setState(chk.checked);
        window.__EPF_RECALC__?.();
        scheduleDraftSave();
        if (chk.checked)
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Hide section / painted-unpainted / tax-now
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      if (t.classList.contains("hideSec")) {
        const sec = t.closest(".sec");
        if (sec) sec.dataset.hideCustomer = t.checked ? "1" : "0";
        scheduleDraftSave();
      }

      if (t.id === "cbTaxNow") {
        window.__EPF_RECALC__?.();
        return;
      }

      if (t.id === "mat_display") {
        scheduleDraftSave();
        window.__EPF_RECALC__?.();
        return;
      }

      if (t.classList.contains("roomPaintSel")) {
        const row = t.closest("tr");
        if (!row) return;
        const group = row.dataset.group;
        if (!group) return;
        const painted = t.value === "painted";
        const baseRate = painted ? 2.5 : 2.0;

        const baseRow = document.querySelector(
          `#sec-popcorn tbody tr[data-group="${group}"][data-role="base"]`
        );
        if (baseRow) {
          const td = baseRow.querySelector("td");
          const rateInput = baseRow.querySelector(".rate");
          if (rateInput) rateInput.value = String(baseRate);
          if (td) {
            const firstChild = td.firstChild;
            const label =
              "Popcorn ceiling removal — " +
              (painted ? "painted" : "unpainted");
            if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
              firstChild.textContent = label;
            } else {
              td.insertBefore(document.createTextNode(label), td.firstChild);
            }
          }
        }
        window.__EPF_RECALC__?.();
      }

      if (t.classList.contains("rowIncludeToggle")) {
        const row = t.closest("tr");
        if (row) {
          row.dataset.zeroLabel = t.checked ? "included" : "";
          scheduleDraftSave();
          window.__EPF_RECALC__?.();
        }
      }
    });

    // Delegated clicks: rows & tools (per-section controls are below each section)
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      // global core
      if (t.id === "btnSaveEstimate") {
        console.debug("btnSaveEstimate clicked");
        saveEstimateForLater(brandKeyRef.current || "epf");
        return;
      }
      if (t.id === "btnCreateInvoice") {
        saveAsInvoice();
        return;
      }

      // row actions
      if (t.classList.contains("chooseService")) {
        const row = t.closest("tr");
        if (row) openServicePicker(row);
        return;
      }

      if (t.classList.contains("qtyWheel")) {
        const input = t.closest("td")?.querySelector(".qty");
        if (input) openQtyPicker(input);
        return;
      }

      if (t.closest(".moveUp")) {
        const row = t.closest("tr");
        if (row) moveRow(row, -1);
        return;
      }

      if (t.closest(".moveDown")) {
        const row = t.closest("tr");
        if (row) moveRow(row, 1);
        return;
      }

      if (t.classList.contains("addLine")) {
        const sec = t.closest(".sec");
        if (sec) {
          addRow(sec, {});
          window.__EPF_RECALC__?.();
        }
      }
      if (t.classList.contains("clearSection")) {
        const sec = t.closest(".sec");
        if (sec) {
          const tb = sec.querySelector("tbody");
          if (tb) tb.innerHTML = "";
          window.__EPF_RECALC__?.();
          scheduleDraftSave();
        }
      }
      if (t.classList.contains("removeSection")) {
        const sec = t.closest(".sec");
        if (sec) {
          const id = sec.id || "";
          const coreIds = ["sec-popcorn", "sec-paint", "sec-add"];
          if (coreIds.includes(id)) {
            window.alert(
              "Core sections (Popcorn, Interior Painting, Additional Services) cannot be removed. Use the checkboxes at the top to disable them."
            );
          } else if (
            window.confirm(
              "Remove this entire section (all lines will be deleted)?"
            )
          ) {
            sec.remove();
            window.__EPF_RECALC__?.();
            scheduleDraftSave();
          }
        }
        return;
      }
      if (t.classList.contains("del")) {
        const tr = t.closest("tr");
        if (tr) {
          tr.remove();
          window.__EPF_RECALC__?.();
          scheduleDraftSave();
        }
      }
      if (t.classList.contains("addRoomPop")) {
        const room = window.prompt("Room name (e.g., Hallway / Living Room)?");
        if (!room) return;
        let type = window.prompt(
          'Ceiling type: "unpainted" or "painted"? (default: unpainted)'
        );
        type = (type || "unpainted").toLowerCase();
        addPopRoom(room, type);
        window.__EPF_RECALC__?.();
      }
      if (t.classList.contains("addRoom")) {
        const room = window.prompt("Room name (e.g., Primary Bedroom)?");
        if (!room) return;
        const widthStr = window.prompt(
          "Room width in feet? (optional)",
          document.getElementById("paint_dim_width")?.value || ""
        );
        const depthStr = window.prompt(
          "Room depth in feet? (optional)",
          document.getElementById("paint_dim_depth")?.value || ""
        );
        const widthVal = parseFloat(widthStr || "0") || 0;
        const depthVal = parseFloat(depthStr || "0") || 0;
        addPaintRoom(room, { width: widthVal, depth: depthVal });
        window.__EPF_RECALC__?.();
      }
      if (t.classList.contains("calcWallsFromDims")) {
        applyPaintDimensions();
        return;
      }
      if (t.classList.contains("calcWallsAndPop")) {
        applyPaintDimensions({ promptPopcorn: true });
        return;
      }
    });

    // Popcorn tools (height / linkSF / reset)
    const popSec = $("#sec-popcorn");
    popSec?.querySelector(".heightSel")?.addEventListener("change", (e) => {
      if (!popSec) return;
      const target = e.target;
      if (target && "value" in target) {
        popSec.dataset.height = target.value;
        window.__EPF_RECALC__?.();
      }
    });
    popSec?.querySelector(".linkSF")?.addEventListener("change", (e) => {
      if (!popSec) return;
      const target = e.target;
      if (target && "checked" in target) {
        popSec.dataset.linksf = target.checked ? "1" : "0";
        scheduleDraftSave();
      }
    });
    popSec?.querySelector(".resetPop")?.addEventListener("click", () => {
      const tb = $("#tb-popcorn");
      if (!tb) return;
      tb.innerHTML = "";
      initPopcornDefaults();
      window.__EPF_RECALC__?.();
    });

    // Input changes (qty/rate/materials/etc.)
    document.addEventListener("input", (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement) {
        if (t.matches(".qty,.rate,#mat_fixed,#mat_pct,#disc_pct,#tax_rate")) {
          // Link SF across ENTIRE popcorn section when linkSF is ON
          if (t.classList.contains("qty")) {
            const sec = t.closest(".sec");
            if (sec && sec.id === "sec-popcorn" && sec.dataset.linksf === "1") {
              const newVal = t.value;
              document
                .querySelectorAll("#sec-popcorn tbody tr")
                .forEach((row) => {
                  const unitSel = row.querySelector(".unit");
                  const q = row.querySelector(".qty");
                  if (unitSel && q && unitSel.value.toLowerCase() === "sf")
                    q.value = newVal;
                });
            }
          }
          window.__EPF_RECALC__?.();
          return;
        }
      }
      // any editable text → just save
      scheduleDraftSave();
    });

    /** ========= Service picker (bottom sheet) ========= */
    let pickerTargetRow = null;
    let pickerSectionId = null;
    let customServices = [];
    let serviceOverrides = {};
    let pickerRoot = document.getElementById("epf-service-picker");
    if (!pickerRoot) {
      pickerRoot = document.createElement("div");
      pickerRoot.id = "epf-service-picker";
      pickerRoot.className = "epf-service-picker";
      pickerRoot.innerHTML = `
        <div class="esp-backdrop"></div>
        <div class="esp-panel">
          <div class="esp-header">
            <input class="esp-search" type="text" placeholder="Search service…" />
            <button type="button" class="esp-close-btn">Close</button>
          </div>
          <div class="esp-toolbar">
            <button type="button" class="esp-action-btn esp-add-custom">＋ Custom service</button>
            <button type="button" class="esp-action-btn esp-save-row">Save current row</button>
          </div>
          <div class="esp-list"></div>
        </div>`;
      document.body.appendChild(pickerRoot);
    }
    const pickerList = pickerRoot.querySelector(".esp-list");
    const pickerSearch = pickerRoot.querySelector(".esp-search");
    const pickerCloseBtn = pickerRoot.querySelector(".esp-close-btn");
    const pickerBackdrop = pickerRoot.querySelector(".esp-backdrop");
    const pickerAddCustomBtn = pickerRoot.querySelector(".esp-add-custom");
    const pickerSaveRowBtn = pickerRoot.querySelector(".esp-save-row");

    function serviceStorageKey(tmpl) {
      return (
        tmpl.storageKey ||
        `${tmpl.section || "any"}::${tmpl.id || tmpl.name}::${tmpl.name || ""}`
      );
    }

    function loadCustomServices() {
      if (typeof window === "undefined") return [];
      try {
        const raw = window.localStorage.getItem(CUSTOM_SERVICE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn("Failed to load custom services", err);
        return [];
      }
    }

    function persistCustomServices(next) {
      customServices = Array.isArray(next) ? next : [];
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          CUSTOM_SERVICE_KEY,
          JSON.stringify(customServices)
        );
      } catch (err) {
        console.warn("Failed to save custom services", err);
      }
    }

    function loadServiceOverrides() {
      if (typeof window === "undefined") return {};
      try {
        const raw = window.localStorage.getItem(SERVICE_OVERRIDE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (err) {
        console.warn("Failed to load service overrides", err);
        return {};
      }
    }

    function persistServiceOverrides(next) {
      serviceOverrides = next && typeof next === "object" ? next : {};
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          SERVICE_OVERRIDE_KEY,
          JSON.stringify(serviceOverrides)
        );
      } catch (err) {
        console.warn("Failed to save service overrides", err);
      }
    }

    function normalizeServiceDetails(value) {
      if (Array.isArray(value)) {
        return value
          .map((line) => String(line || "").trim())
          .filter(Boolean);
      }
      return String(value || "")
        .split("|")
        .map((line) => line.trim())
        .filter(Boolean);
    }

    function rowDraftFromTarget(row) {
      if (!row) return null;
      const descText = row.querySelector("td")?.innerText || "";
      const lines = descText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const [name = "", ...details] = lines;
      return {
        name,
        details,
        desc: details.join(" | "),
        unit: row.querySelector(".unit")?.value || "ea",
        rate: parseFloat(row.querySelector(".rate")?.value || "0") || 0,
        defaultQty:
          row.querySelector(".qty")?.value === ""
            ? null
            : parseFloat(row.querySelector(".qty")?.value || "0") || 0,
      };
    }

    function promptForServiceTemplate(initial = {}, forcedSectionId = "") {
      const name = window.prompt("Service name?", initial.name || "")?.trim();
      if (!name) return null;

      const detailsSeed = normalizeServiceDetails(
        initial.details?.length ? initial.details : initial.desc
      ).join(" | ");
      const detailsInput = window.prompt(
        'Details / bullets? Use "|" between points (optional).',
        detailsSeed
      );
      if (detailsInput == null) return null;

      const unit = (
        window.prompt(
          "Unit? Use sf, ea, job, lf, door, room, or allow.",
          initial.unit || "ea"
        ) || ""
      )
        .trim()
        .toLowerCase();
      if (!unit) return null;

      const rateInput = window.prompt(
        "Rate / price?",
        String(initial.rate ?? "0")
      );
      if (rateInput == null) return null;
      const rate = parseFloat(rateInput);
      if (Number.isNaN(rate)) {
        window.alert("Rate must be a number.");
        return null;
      }

      const qtyInput = window.prompt(
        "Default quantity? Leave blank for none.",
        initial.defaultQty == null ? "" : String(initial.defaultQty)
      );
      if (qtyInput == null) return null;
      const trimmedQty = qtyInput.trim();
      const defaultQty =
        trimmedQty === ""
          ? null
          : Number.isNaN(parseFloat(trimmedQty))
            ? null
            : parseFloat(trimmedQty);

      const details = normalizeServiceDetails(detailsInput);
      return {
        id:
          initial.id ||
          "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        section: forcedSectionId || initial.section || "sec-add",
        name,
        desc: details.join(" | "),
        details,
        unit,
        rate,
        defaultQty,
        custom: true,
      };
    }

    function editableTemplateSeed(tmpl) {
      const details =
        Array.isArray(tmpl.details) && tmpl.details.length
          ? tmpl.details
          : detailsFor({
              tmplId: tmpl.id,
              role: "",
              desc: tmpl.name,
            });
      return {
        ...tmpl,
        desc: tmpl.desc || normalizeServiceDetails(details).join(" | "),
        details,
      };
    }

    function customActionButton(label, className, onClick) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = className;
      btn.textContent = label;
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        onClick();
      });
      return btn;
    }

    function closeServicePicker() {
      pickerTargetRow = null;
      pickerSectionId = null;
      pickerRoot.classList.remove("open");
    }
    function applyServiceTemplate(tmpl) {
      if (!pickerTargetRow) return;
      const descCell = pickerTargetRow.querySelector("td");
      const qtyInput = pickerTargetRow.querySelector(".qty");
      const unitSel = pickerTargetRow.querySelector(".unit");
      const rateInput = pickerTargetRow.querySelector(".rate");

      const detailsArr =
        Array.isArray(tmpl.details) && tmpl.details.length
          ? tmpl.details
          : detailsFor({
              tmplId: tmpl.id,
              role: "",
              desc: tmpl.name,
            });
      if (descCell)
        descCell.innerHTML = renderDescWithDetails(tmpl.name, detailsArr);
      if (qtyInput && tmpl.defaultQty != null)
        qtyInput.value = String(tmpl.defaultQty);
      if (unitSel && tmpl.unit) unitSel.value = tmpl.unit;
      if (rateInput && tmpl.rate != null) rateInput.value = String(tmpl.rate);
    }

    function addCustomServiceFromDraft(draft) {
      const tmpl = promptForServiceTemplate(draft || {}, pickerSectionId);
      if (!tmpl) return;
      persistCustomServices([tmpl, ...customServices]);
      renderServiceList(pickerSearch?.value || "");
    }

    function editCustomService(tmpl) {
      const updated = promptForServiceTemplate(tmpl, tmpl.section);
      if (!updated) return;
      persistCustomServices(
        customServices.map((service) => (service.id === tmpl.id ? updated : service))
      );
      renderServiceList(pickerSearch?.value || "");
    }

    function deleteCustomService(tmpl) {
      const confirmed = window.confirm(`Delete custom service "${tmpl.name}"?`);
      if (!confirmed) return;
      persistCustomServices(
        customServices.filter((service) => service.id !== tmpl.id)
      );
      renderServiceList(pickerSearch?.value || "");
    }

    function editBaseService(tmpl) {
      const seed = editableTemplateSeed(tmpl);
      const updated = promptForServiceTemplate(seed, tmpl.section);
      if (!updated) return;
      const key = serviceStorageKey(tmpl);
      persistServiceOverrides({
        ...serviceOverrides,
        [key]: {
          name: updated.name,
          desc: updated.desc,
          details: updated.details,
          unit: updated.unit,
          rate: updated.rate,
          defaultQty: updated.defaultQty,
          hidden: false,
        },
      });
      renderServiceList(pickerSearch?.value || "");
    }

    function deleteBaseService(tmpl) {
      const confirmed = window.confirm(`Hide service "${tmpl.name}" from the list?`);
      if (!confirmed) return;
      const key = serviceStorageKey(tmpl);
      persistServiceOverrides({
        ...serviceOverrides,
        [key]: {
          ...(serviceOverrides[key] || {}),
          hidden: true,
        },
      });
      renderServiceList(pickerSearch?.value || "");
    }

    function renderServiceList(query) {
      if (!pickerList) return;
      pickerList.innerHTML = "";
      const q = (query || "").trim().toLowerCase();
      const activeBrand =
        (typeof window !== "undefined" && window.__EPF_BRAND__) || "epf";
      const baseServices = SERVICE_COST.map((tmpl) => {
        const key = serviceStorageKey(tmpl);
        const override = serviceOverrides[key] || {};
        if (override.hidden) return null;
        return {
          ...tmpl,
          ...override,
          storageKey: key,
          custom: false,
        };
      }).filter(Boolean);
      const allServices = [...customServices, ...baseServices];
      const allowed = allServices.filter((t) => {
        if (!pickerSectionId) return true;
        if (t.section === "any") return true;
        return t.section === pickerSectionId;
      })
        .filter((t) => !t.brand || t.brand === activeBrand)
        .filter(
          (t) =>
            !q ||
            t.name.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q)
        );
      if (!allowed.length) {
        const empty = document.createElement("div");
        empty.className = "esp-empty";
        empty.textContent = "No matching services. Adjust search.";
        pickerList.appendChild(empty);
        return;
      }
      const rankFor = (section) =>
        SERVICE_SECTION_ORDER[section] ?? SERVICE_SECTION_ORDER["sec-add"] ?? 10;
      const sorted = [...allowed].sort((a, b) => {
        if (!!a.custom !== !!b.custom) return a.custom ? -1 : 1;
        const rankDiff = rankFor(a.section) - rankFor(b.section);
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      });
      sorted.forEach((tmpl) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "esp-item";
        btn.innerHTML = `
          <div class="esp-main">
            <div class="esp-name">${tmpl.name}${
              tmpl.custom ? '<span class="esp-tag">Custom</span>' : ""
            }</div>
            <div class="esp-desc">${tmpl.desc}</div>
          </div>
          <div class="esp-side">
            <div class="esp-price">$${(tmpl.rate ?? 0).toFixed(2)}</div>
          </div>`;
        const side = btn.querySelector(".esp-side");
        const actions = document.createElement("div");
        actions.className = "esp-item-actions";
        actions.appendChild(
          customActionButton("Edit", "esp-mini-btn", () =>
            tmpl.custom ? editCustomService(tmpl) : editBaseService(tmpl)
          )
        );
        actions.appendChild(
          customActionButton("Delete", "esp-mini-btn danger", () =>
            tmpl.custom ? deleteCustomService(tmpl) : deleteBaseService(tmpl)
          )
        );
        side?.appendChild(actions);
        btn.addEventListener("click", () => {
          applyServiceTemplate(tmpl);
          scheduleDraftSave();
          window.__EPF_RECALC__?.();
          closeServicePicker();
        });
        pickerList.appendChild(btn);
      });
    }
    function openServicePicker(row) {
      pickerTargetRow = row;
      const sec = row.closest(".sec");
      pickerSectionId = sec?.id || "";
      customServices = loadCustomServices();
      serviceOverrides = loadServiceOverrides();
      pickerRoot.classList.add("open");
      if (pickerSearch) {
        pickerSearch.value = "";
        renderServiceList("");
        setTimeout(() => pickerSearch.focus(), 0);
      } else {
        renderServiceList("");
      }
    }
    pickerSearch?.addEventListener("input", (e) =>
      renderServiceList(e.target.value)
    );
    pickerAddCustomBtn?.addEventListener("click", () =>
      addCustomServiceFromDraft({
        name: "",
        details: [],
        desc: "",
        unit: "ea",
        rate: 0,
        defaultQty: 1,
      })
    );
    pickerSaveRowBtn?.addEventListener("click", () =>
      addCustomServiceFromDraft(rowDraftFromTarget(pickerTargetRow) || {})
    );
    pickerCloseBtn?.addEventListener("click", closeServicePicker);
    pickerBackdrop?.addEventListener("click", closeServicePicker);

    /** ========= Initial load ========= */
    // set date default
    const d = $("#date");
    if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);

    const initialParams = new URLSearchParams(window.location.search || "");
    const isCrmEstimate = initialParams.get("source") === "crm";

    // try restore JSON, except CRM estimate opens must start blank
    if (isCrmEstimate) {
      resetEstimateToBlankForCrm();
    } else {
      try {
        const raw = window.localStorage.getItem(STATE_KEY);
        if (raw) {
          const state = JSON.parse(raw);
          restoreEstimate(state);
        } else {
          // first-time defaults
          initPopcornDefaults();
          attachSectionControls(); // add totals + controls under built-in sections
        }
      } catch {
        initPopcornDefaults();
        attachSectionControls();
      }
    }
    applyCrmPrefillFromQuery();
    window.__EPF_RECALC__?.();

    /** ========= Google Places: Place ID link ========= */
    function updateMapsLink() {
      const idEl = document.getElementById("g_place_id");
      const a = document.getElementById("gmapsLink");
      if (!a) return;
      const pid = (idEl?.value || "").trim();
      if (pid) {
        a.href = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
          pid
        )}`;
        a.style.display = "";
      } else {
        a.removeAttribute("href");
        a.style.display = "none";
      }
      scheduleDraftSave();
    }

    /** ========= Google Places address autocomplete ========= */
    function initAddressAutocomplete() {
      const input = document.getElementById("site");
      if (!input || !window.google || !window.google.maps?.places) return;
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        fields: ["formatted_address", "place_id"],
        componentRestrictions: { country: "ca" },
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place) return;
        if (place.formatted_address) input.value = place.formatted_address;
        const pidInput = document.getElementById("g_place_id");
        if (pidInput && place.place_id) pidInput.value = place.place_id;
        updateMapsLink();
      });
    }

    document.addEventListener("input", (e) => {
      if (e.target?.id === "g_place_id") updateMapsLink();
    });
    updateMapsLink();

    // init Places autocomplete now if API is ready, else let <Script> callback do it
    if (window.google && window.google.maps?.places) {
      initAddressAutocomplete();
    } else {
      window.initEPFPlaces = initAddressAutocomplete;
    }
  }, [accessMode, setBrandKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  const capturePrintSnapshot = useCallback(
    (nextBrandKey = brandKey) => {
      const key = nextBrandKey || brandKey || "epf";
      if (typeof window !== "undefined") window.__EPF_BRAND__ = key;
      if (brandKeyRef.current !== key) setBrandKey(key);
      const snapshot = scrapeEstimateFromDom(key);
      if (snapshot) {
        const withBrand = { ...snapshot, brandKey: key };
        setPrintSnapshot(withBrand);
        return withBrand;
      }
      return snapshot;
    },
    [brandKey, setBrandKey]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!previewVisible) return;

    let refreshTimer = null;
    const refreshPreview = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        capturePrintSnapshot(brandKeyRef.current || brandKey);
      }, 40);
    };

    refreshPreview();
    document.addEventListener("input", refreshPreview, true);
    document.addEventListener("change", refreshPreview, true);

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      document.removeEventListener("input", refreshPreview, true);
      document.removeEventListener("change", refreshPreview, true);
    };
  }, [previewVisible, brandKey, capturePrintSnapshot]);

  function triggerPrint(nextBrandKey, forceEs = false) {
    if (isPrinting) return;
    const snapshot = capturePrintSnapshot(nextBrandKey);
    if (!snapshot) return;
    const saveFn =
      forceEs || snapshot.brandKey === "alphaDrywall"
        ? saveEsRecord
        : saveInvoiceRecord;

    const saved = saveFn(snapshot);
    console.debug("Print save", {
      savedId: saved?.id,
      brand: snapshot.brandKey,
      esList:
        typeof window !== "undefined"
          ? window.localStorage.getItem(ES_LIST_KEY)
          : "n/a",
      invoices:
        typeof window !== "undefined"
          ? window.localStorage.getItem("epf.invoices")
          : "n/a",
    });
    setPreviewVisible(false);
    setIsPrinting(true);
    // Give the print layout a moment to render images (logo) before invoking print
    setTimeout(() => {
      if (typeof window !== "undefined") window.print();
    }, 200);
  }

  function saveCurrentEstimateToCrm() {
    const snapshot = capturePrintSnapshot(brandKeyRef.current || brandKey);
    if (!snapshot) return null;
    const saveFn =
      snapshot.brandKey === "alphaDrywall" ? saveEsRecord : saveInvoiceRecord;
    const saved = saveFn(snapshot);
    if (saved?.id) {
      window.alert(
        `Saved and attached quote "${saved.quoteId || saved.id}" to CRM.\n\nUse Print / Save PDF when you need the PDF file.`
      );
    }
    return saved;
  }

  function resetCrmBuilderQuote() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Reset this builder quote? This clears the builder draft and reloads a blank CRM quote from the CRM client info."
    );
    if (!ok) return;
    try {
      window.localStorage.removeItem(STATE_KEY);
      const clientId = window.__EPF_CRM_CLIENT_ID__ || crmClientId || "crm";
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith(`epf.crm.autoAttach.${clientId}.`))
        .forEach((key) => window.sessionStorage.removeItem(key));
    } catch {}
    window.location.reload();
  }

  const locked = accessMode === null;

  if (locked) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Enter access code
          </h1>
          <p className="text-sm text-slate-600">
            Access is required to open the estimate builder.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = (passInput || "").trim().toLowerCase();
              if (trimmed === "0320") {
                setAccessMode("full");
                if (typeof window !== "undefined")
                  window.localStorage.setItem("epf.accessMode", "full");
              } else if (trimmed === "yehor") {
                setAccessMode("alphaOnly");
                setBrandKey("alphaDrywall");
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("epf.accessMode", "alphaOnly");
                }
              } else {
                alert("Incorrect password");
              }
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
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
    <main className="min-h-screen bg-slate-100 py-4 px-2 md:px-4">
      {/* Google Maps script for address autocomplete */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""
        }&libraries=places`}
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== "undefined" && window.initEPFPlaces) {
            window.initEPFPlaces();
          }
        }}
      />

      {/* tiny bullet style + customer/print privacy + section totals styles */}
      <style jsx global>{`
        .epf td .small::before {
          content: "• ";
        }
        .sectionControls .card {
          margin-top: 8px;
        }

        /* Section Total card styling */
        .secTotalCard.card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
          margin-bottom: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px;
          padding: 10px 14px;
          break-inside: avoid;
        }
        .secTotalCard .secTotalRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .secTotalCard .lbl {
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #64748b; /* slate-500 */
        }
        .secTotalCard .val {
          font-weight: 700;
          font-size: 18px;
        }
        .secTotalCard .hint {
          font-size: 11px;
          color: #94a3b8; /* slate-400 */
        }

        /* Hide sections marked as "hide from customer" in customer view + print */
        body.customer .sec[data-hide-customer="1"] {
          display: none !important;
        }
        @media print {
          .sec[data-hide-customer="1"],
          .sec[data-hide-customer="1"] * {
            display: none !important;
            visibility: hidden !important;
          }
        }

        /* Hide private rows in customer view + print */
        body.customer .sec tr.private {
          display: none !important;
        }
        @media print {
          .sec tr.private,
          .sec tr.private * {
            display: none !important;
            visibility: hidden !important;
          }
        }

        /* Hide Rate column in customer view + print (keep Amount) */
        body.customer .sec .col-rate,
        body.customer .sec thead th:nth-child(4) {
          display: none !important;
        }
        @media print {
          .sec .col-rate,
          .sec thead th:nth-child(4) {
            display: none !important;
          }
        }

        /* INTERNAL ONLY blocks (e.g., Google Place ID) hidden for customers and in print */
        body.customer .internalOnly {
          display: none !important;
        }
        @media print {
          .internalOnly,
          .internalOnly * {
            display: none !important;
          }
        }

        /* Smaller qty picker on mobile */
        .epf-qty-picker .eqp-panel {
          max-width: 320px;
          width: 92vw;
        }
        .epf-qty-picker .eqp-header {
          padding: 8px 12px;
        }
        .epf-qty-picker .eqp-body {
          padding: 8px 12px;
        }
        .epf-qty-picker .eqp-wheel {
          font-size: 14px;
          max-height: 160px;
        }
        .epf-qty-picker .eqp-actions .eqp-direct {
          width: 84px;
          font-size: 14px;
        }

        /* Print: keep section totals, hide control buttons */
        @media print {
          .sectionControls .btn,
          .sectionControls .right {
            display: none !important;
          }
          .secTotalCard.card {
            background: transparent;
            border: none;
            padding: 0;
            margin-top: 4px;
          }
          .secTotalCard .val {
            font-size: 16px;
          }
        }
      `}</style>

      <div
        className="epf interactive-estimate"
        style={{ "--brand": activeBrand.brandColor || "#e11d48" }}
      >
        <div className="page" id="page">
          {/* HEADER */}
          <div className="header">
            <div className="brand">
              <div className="logo">
                <Image
                  src={activeBrand.logoSrc || "/logo/image.png"}
                  alt={activeBrand.logoAlt || "EPF logo"}
                  width={264}
                  height={240}
                  priority
                />
              </div>
              <div key={brandKey}>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="font-semibold"
                >
                  {activeBrand.name}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-xs text-slate-500"
                >
                  {activeBrand.contactLine}
                </div>
                {activeBrand.legalLine ? (
                  <div className="text-xs text-slate-400">
                    {activeBrand.legalLine}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="title">
              <h1>Estimate</h1>
              <small
                contentEditable
                suppressContentEditableWarning
                className="text-slate-500"
              >
                Detailed scope &amp; pricing
              </small>
            </div>
            <div className="badge">
              <span id="hdr_total">$0</span>
            </div>
          </div>

          <div className="reviewBar">
            <span className="pill hs">
              HomeStars <span className="stars">★★★★★</span>
            </span>
            <span className="pill g">
              Google Reviews <span className="stars">★★★★★</span>
            </span>
          </div>

          {/* CLIENT / JOB */}
          <EstimateClientJobBlock defaultPreparedBy={activeBrand.preparedBy} />

          {/* SERVICE SELECTOR */}
          <div className="services">
            <div className="card">
              <h3>Select Services</h3>
              <label>
                <input
                  type="checkbox"
                  className="svc"
                  data-target="#sec-paint"
                  defaultChecked
                />{" "}
                Interior Painting (optional)
              </label>
              <label>
                <input
                  type="checkbox"
                  className="svc"
                  data-target="#sec-popcorn"
                  defaultChecked
                />{" "}
                Popcorn / Stucco Removal
              </label>
              <label>
                <input
                  type="checkbox"
                  className="svc"
                  data-target="#sec-add"
                  defaultChecked
                />{" "}
                Additional Services
              </label>
              <small>
                Toggle services to include in totals. Printing hides rates and
                private items.
              </small>
            </div>
          </div>

          {/* SECTIONS */}
          <PaintingSection />
          <PopcornSection />
          <AdditionalServicesSection />

          {/* GLOBAL CONTROLS (below sections) */}
          <div className="controls">
            <div className="brandSwitch" role="group" aria-label="Brand selection">
              <span className="text-xs text-slate-500">Brand:</span>
              {accessMode === "team" ? (
                <>
                  <button
                    type="button"
                    id="btnBrandCalgary"
                    className={`btn ${brandKey === "popcornCalgary" ? "primary" : "ghost"}`}
                    onClick={() => setBrandKey("popcornCalgary")}
                  >
                    Popcorn Ceiling Removal Calgary
                  </button>
                  <button
                    type="button"
                    id="btnBrandAlpha"
                    className={`btn ${brandKey === "alphaDrywall" ? "primary" : "ghost"}`}
                    onClick={() => setBrandKey("alphaDrywall")}
                  >
                    Alpha Drywall Finishing
                  </button>
                </>
              ) : accessMode !== "alphaOnly" ? (
                <>
                  <button
                    type="button"
                    className={`btn ${brandKey === "epf" ? "primary" : "ghost"}`}
                    onClick={() => setBrandKey("epf")}
                  >
                    EPF Pro Services
                  </button>
                  <button
                    type="button"
                    id="btnBrandCalgary"
                    className={`btn ${brandKey === "popcornCalgary" ? "primary" : "ghost"}`}
                    onClick={() => setBrandKey("popcornCalgary")}
                  >
                    Popcorn Ceiling Removal Calgary
                  </button>
                  <button
                    type="button"
                    id="btnBrandAlpha"
                    className={`btn ${brandKey === "alphaDrywall" ? "primary" : "ghost"}`}
                    onClick={() => setBrandKey("alphaDrywall")}
                  >
                    Alpha Drywall Finishing
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-600">
                  Alpha Drywall (locked)
                </span>
              )}
            </div>
            {accessMode ? (
              <button
                type="button"
                className="btn ghost"
                id="btnQuotes"
                onClick={() => {
                  const next = quotesClickCount + 1;
                  setQuotesClickCount(next);
                  if (next >= 10) {
                    const pwd = window.prompt(
                      'Enter "javascript to implement changes":',
                      ""
                    );
                    if ((pwd || "").trim() === "0320") {
                      window.location.href = "/invoices";
                    } else {
                      alert("Incorrect code.");
                    }
                    setQuotesClickCount(0);
                  }
                }}
              >
                JSFIX
              </button>
            ) : null}
            {crmClientId ? (
              <>
                <Link
                  href={`/crm?client=${encodeURIComponent(crmClientId)}`}
                  className="btn ghost"
                >
                  Back to CRM
                </Link>
                <button
                  type="button"
                  className="btn primary"
                  onClick={saveCurrentEstimateToCrm}
                >
                  Save to CRM
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => triggerPrint(brandKeyRef.current || brandKey)}
                >
                  Save to CRM / PDF
                </button>
                <button
                  type="button"
                  className="btn del"
                  onClick={resetCrmBuilderQuote}
                >
                  Reset Builder
                </button>
              </>
            ) : null}
            {brandKey === "alphaDrywall" ? (
              <button
                type="button"
                className="btn primary"
                id="btnPrintAlpha"
                onClick={() => {
                  console.debug("btnPrintAlpha pressed");
                  triggerPrint("alphaDrywall", true);
                }}
              >
                Print / Save PDF — Alpha Drywall
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn primary"
                  id="btnPrint"
                  onClick={() => {
                    console.debug("btnPrint pressed");
                    triggerPrint();
                  }}
                >
                  Print / Save PDF (Customer)
                </button>
                <button
                  type="button"
                  className="btn"
                  id="btnPrintCalgary"
                  onClick={() => triggerPrint("popcornCalgary")}
                >
                  Print / Save PDF — Calgary brand
                </button>
              </>
            )}
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const snap = capturePrintSnapshot();
                console.debug("Preview print layout clicked", { snap });
                if (snap) setPreviewVisible(true);
              }}
            >
              Preview print layout
            </button>
            <button className="btn" id="toggleCustomer">
              Toggle Customer View
            </button>
            <label className="flex items-center gap-1">
              <input type="checkbox" id="cbKeepSections" />{" "}
              <span>Prevent section splits</span>
            </label>
            <button className="btn ghost" id="addSection">
              ＋ Add Section
            </button>
            <button className="btn ghost" id="clearAll">
              Clear all rows
            </button>
            <button className="btn ghost" id="btnSaveEstimate">
              Keep / Save Estimate
            </button>
            <button className="btn primary" id="btnCreateInvoice">
              Create Invoice from this
            </button>
          </div>

          {/* TOTALS */}
          <div className="sum">
            <div className="card">
              <strong>Scope notes for the client:</strong>
              <div
                id="scope_notes"
                contentEditable
                suppressContentEditableWarning
                className="mt-1"
              >
                Dust-controlled removal, masking, HEPA sanding, and daily cleanup.
                Smooth finish ready for paint.
              </div>
              <br />
              <em id="taxNotice">HST will be added at end of project</em>.
              Excludes asbestos testing/removal, electrical, structural work,
              and permits unless noted.
            </div>
            <div className="sumBox">
              <div className="row">
                <div className="kv">
                  <label>Materials — fixed</label>
                  <input id="mat_fixed" type="number" defaultValue="0" />
                </div>
                <div className="kv">
                  <label>Materials — % of labour</label>
                  <input id="mat_pct" type="number" defaultValue="0" />
                </div>
              </div>
              <div className="row">
                <div className="kv">
                  <label>Materials display</label>
                  <select id="mat_display" defaultValue="exact">
                    <option value="exact">Exact cost</option>
                    <option value="included">Show as Included</option>
                    <option value="approx">Show as Approx.</option>
                  </select>
                  <small className="text-xs text-slate-500">
                    Use <strong>Approx.</strong> when final material charges will
                    be adjusted to actual usage.
                  </small>
                </div>
                <div className="kv">
                  <label>Deposit amount</label>
                  <input id="deposit_amount" type="number" defaultValue="0" />
                </div>
              </div>
              <div className="row">
                <div className="kv">
                  <label>Discount (%)</label>
                  <input id="disc_pct" type="number" defaultValue="0" />
                </div>
                <div className="kv">
                  <label>Tax rate (%)</label>
                  <input id="tax_rate" type="number" defaultValue="13" />
                </div>
              </div>
              <div className="row">
                <div className="kv">
                  <label className="flex items-center gap-2">
                    <input
                      id="cbTaxNow"
                      type="checkbox"
                      defaultChecked={false}
                    />{" "}
                    <span>Calculate HST in this estimate</span>
                  </label>
                  <small className="text-xs text-slate-500">
                    When off, totals show before tax and HST is “added at end of
                    project”.
                  </small>
                </div>
              </div>
              <div className="sumRow">
                <span>Labour</span>
                <span id="s_labour">$0</span>
              </div>
              <div className="sumRow">
                <span>Materials</span>
                <span id="s_mat">$0</span>
              </div>
              <div className="sumRow">
                <span>Discount</span>
                <span id="s_disc">$0</span>
              </div>
              <div className="sumRow">
                <span>Subtotal</span>
                <span id="s_sub">$0</span>
              </div>
              <div className="sumRow">
                <span>
                  Tax (<span id="taxLbl">—</span>%)
                </span>
                <span id="s_tax">$0</span>
              </div>
              <div className="sumRow">
                <strong>Total</strong>
                <strong id="s_total">$0</strong>
              </div>
            </div>
          </div>

          <div className="footer">
            {(activeBrand.footerLines || []).map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        </div>
      </div>
      <PrintLayout
        snapshot={printSnapshot}
        previewVisible={previewVisible}
        onClosePreview={() => setPreviewVisible(false)}
        brandProfile={
          BRAND_PROFILES[printSnapshot?.brandKey || brandKey] ||
          BRAND_PROFILES.epf
        }
      />
    </main>
  );
}
