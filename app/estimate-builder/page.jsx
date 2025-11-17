"use client";

import { useEffect } from "react";
import Script from "next/script";
import PopcornSection from "@/components/estimate/PopcornSection";
import PaintingSection from "@/components/estimate/PaintingSection";
import AdditionalServicesSection from "@/components/estimate/AdditionalServicesSection";

/** ===== Service templates for the 3-dots picker ===== */
const SERVICE_TEMPLATES = [
  // POPCORN / CEILINGS
  {
    id: "popcorn-unpainted-sf",
    section: "sec-popcorn",
    name: "Popcorn removal + Level 5 (unpainted)",
    desc: "Remove texture, Level 5 skim, HEPA sand, prime & paint-ready.",
    unit: "sf",
    rate: 6.5,
    defaultQty: null,
  },
  {
    id: "popcorn-painted-sf",
    section: "sec-popcorn",
    name: "Popcorn removal + Level 5 (painted)",
    desc: "Remove painted texture, repair joints, Level 5 finish.",
    unit: "sf",
    rate: 7.5,
    defaultQty: null,
  },
  {
    id: "popcorn-stairwell-job",
    section: "sec-popcorn",
    name: "Stairwell / high ceiling popcorn removal",
    desc: "Includes scaffold / ladders, full containment & cleanup.",
    unit: "job",
    rate: 2200,
    defaultQty: 1,
  },
  // PAINT
  {
    id: "walls-standard-room",
    section: "sec-paint",
    name: "Interior walls — standard bedroom",
    desc: "2 coats on walls, light prep, low-VOC pro paint.",
    unit: "room",
    rate: 450,
    defaultQty: 1,
  },
  {
    id: "walls-large-room",
    section: "sec-paint",
    name: "Interior walls — large room",
    desc: "Family/Living room, 2 coats, basic repairs.",
    unit: "room",
    rate: 650,
    defaultQty: 1,
  },
  {
    id: "ceiling-room",
    section: "sec-paint",
    name: "Ceiling paint — room",
    desc: "Prime as needed + 2 coats ceiling white.",
    unit: "room",
    rate: 220,
    defaultQty: 1,
  },
  {
    id: "door-frame",
    section: "sec-paint",
    name: "Door & frame (per door)",
    desc: "Spot-sand, caulk, 2 coats semi-gloss.",
    unit: "door",
    rate: 90,
    defaultQty: 1,
  },
  {
    id: "trim-baseboards",
    section: "sec-paint",
    name: "Baseboards / trim",
    desc: "Caulk joints, light sand, 2 coats semi-gloss.",
    unit: "lf",
    rate: 5,
    defaultQty: null,
  },
  // DRYWALL / EXTRA
  {
    id: "drywall-small-patch",
    section: "sec-add",
    name: "Drywall repair — small patch",
    desc: "Fill small hole/crack, sand & prime ready for paint.",
    unit: "ea",
    rate: 120,
    defaultQty: 1,
  },
  {
    id: "drywall-large-patch",
    section: "sec-add",
    name: "Drywall repair — large / multiple patches",
    desc: "Cut out damaged board, re-board, tape, mud & sand.",
    unit: "ea",
    rate: 220,
    defaultQty: 1,
  },
  {
    id: "corner-bead",
    section: "sec-add",
    name: "Corner bead supply & install",
    desc: "Metal/vinyl beads, mud, sand, straighten corners.",
    unit: "lf",
    rate: 12,
    defaultQty: null,
  },
  {
    id: "debris-disposal",
    section: "sec-add",
    name: "Debris disposal",
    desc: "Bag & remove site waste / popcorn debris.",
    unit: "job",
    rate: 120,
    defaultQty: 1,
  },
  // GENERIC
  {
    id: "site-protection",
    section: "any",
    name: "Site protection & masking",
    desc: "Floors, stairs & key furniture protection (poly/RamBoard).",
    unit: "job",
    rate: 180,
    defaultQty: 1,
  },
];

/** ===== Default short details under each service line ===== */
const SERVICE_DETAILS = {
  "popcorn-unpainted-sf": [
    "Dust-controlled scrape of texture",
    "HEPA sand to smooth",
    "Prime & paint-ready",
  ],
  "popcorn-painted-sf": [
    "Remove painted texture",
    "Repair joints & seams",
    "HEPA sand, Level 5 finish",
  ],
  "popcorn-stairwell-job": [
    "Scaffold/ladders set safely",
    "Full containment & masking",
    "Daily cleanup included",
  ],
  "walls-standard-room": [
    "Fill holes & caulk gaps",
    "Light sand & dust off",
    "2 finish coats on walls",
  ],
  "walls-large-room": [
    "Basic repairs & light sand",
    "Cut-in clean lines",
    "2 finish coats",
  ],
  "ceiling-room": [
    "Prime where needed",
    "2 coats ceiling white",
    "Clean cut-lines",
  ],
  "door-frame": ["Degloss / spot sand", "Caulk joints", "2 coats semi-gloss"],
  "trim-baseboards": ["Clean & light sand", "Caulk joints", "2 coats enamel"],
  "drywall-small-patch": ["Fill hole/crack", "Sand smooth", "Spot-prime"],
  "drywall-large-patch": ["Cut & re-board", "Tape + compound", "Sand & prime"],
  "corner-bead": [
    "Set metal/vinyl bead true",
    "Mud & straighten edge",
    "Sand smooth",
  ],
  "debris-disposal": [
    "Bag & remove site waste/popcorn",
    "Load-out & haul",
    "Disposal handled off-site",
  ],
  "site-protection": [
    "Cover floors (RamBoard / poly)",
    "Mask casings & cabinets",
    "Seal returns/vents",
  ],
};

// Role-based defaults (popcorn bundle rows)
const ROLE_DETAILS = {
  base: [
    "Dust-controlled texture removal",
    "HEPA sand ceilings smooth",
    "Edges kept crisp",
  ],
  floor: ["RamBoard / poly protection", "Tape baseboards & stairs"],
  skim: ["2–3 passes joint compound", "Feather to edges", "Final HEPA sand"],
  prime: ["Prime repairs/stains", "Ensure even coverage"],
  paint: ["2 coats ceiling finish", "Clean cut lines"],
  cleanup: ["HEPA vacuum surfaces", "Bag debris", "Daily tidy"],
};

// Name-based heuristics (fallback)
function heuristicDetails(desc = "") {
  const s = desc.toLowerCase();
  if (s.includes("walls"))
    return ["Fill & caulk", "Light sand", "2 coats finish"];
  if (s.includes("ceiling paint"))
    return ["Prime where needed", "2 coats ceiling white"];
  if (s.includes("door"))
    return ["Degloss/sand", "Caulk joints", "2 coats semi-gloss"];
  if (s.includes("window")) return ["Mask glass/trim", "2 coats enamel"];
  if (s.includes("closet")) return ["Walls + shelf/rod", "2 coats"];
  if (s.includes("trim") || s.includes("baseboard"))
    return ["Clean & sand", "2 coats enamel"];
  if (s.includes("drywall") && s.includes("patch"))
    return ["Repair & sand", "Spot-prime"];
  if (s.includes("debris") || s.includes("disposal"))
    return ["Bag & remove waste", "Haul away"];
  return ["Details / area"];
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
function EstimateClientJobBlock() {
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

        {/* Google Place ID (optional) */}
        <div className="kv">
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
          <div id="preparedBy" contentEditable suppressContentEditableWarning>
            Alex — EPF Pro Services
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

export default function EstimateBuilderPage() {
  /** ---------- Save to list helper ---------- */
  function saveInvoiceRecord(data) {
    if (typeof window === "undefined") return data;
    const cleanQuoteId = (data.quoteId || "").toString().trim();
    const record = {
      ...data,
      id: cleanQuoteId || "INV-" + Date.now(),
      savedAt: new Date().toISOString(),
    };
    let list = [];
    try {
      const raw = window.localStorage.getItem("epf.invoices");
      list = raw ? JSON.parse(raw) || [] : [];
    } catch {}
    list = list.filter((inv) => inv.id !== record.id);
    list.push(record);
    try {
      window.localStorage.setItem("epf.invoices", JSON.stringify(list));
      window.localStorage.setItem("epf.invoiceDraft", JSON.stringify(record));
    } catch {}
    return record;
  }

  /** ---------- Scrape current estimate (for invoice / quick-save) ---------- */
  function scrapeEstimateFromDom() {
    if (typeof window === "undefined") return null;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const val = (sel) => {
      const el = $(sel);
      if (!el) return "";
      if ("value" in el && el.value != null) return String(el.value).trim();
      return (el.textContent || "").trim();
    };
    const base = {
      client: val("#client"),
      site: val("#site"),
      gPlaceId: val("#g_place_id"),
      date: $("#date")?.value || new Date().toISOString().slice(0, 10),
      quoteId: val("#qid") || "EPF-QUOTE",
      taxRate: parseFloat($("#tax_rate")?.value || "13"),
      matFixed: parseFloat($("#mat_fixed")?.value || "0"),
      matPct: parseFloat($("#mat_pct")?.value || "0"),
      items: [],
      notes:
        "Thank you for the opportunity. Please review and let us know if you’d like to proceed.",
    };

    $$(".sec[data-enabled='1']").forEach((sec) => {
      if (sec.dataset.hideCustomer === "1") return;
      const rows = $$("tbody tr", sec).filter(
        (tr) =>
          !tr.classList.contains("private") &&
          !tr.classList.contains("roomHeader")
      );
      rows.forEach((tr) => {
        const descCell = tr.querySelector("td");
        const qty = parseFloat(tr.querySelector(".qty")?.value || "0") || 0;
        const rate = parseFloat(tr.querySelector(".rate")?.value || "0") || 0;
        const amt =
          parseFloat(tr.querySelector(".amt")?.value || "0") ||
          (qty && rate ? qty * rate : 0);
        base.items.push({
          description: (descCell?.textContent || "").trim(),
          qty,
          unit: tr.querySelector(".unit")?.value || "",
          rate,
          amount: amt,
        });
      });
    });

    const labour = base.items.reduce((s, r) => s + (r.amount || 0), 0);
    const materials = base.matFixed + labour * (base.matPct / 100);
    const subtotal = labour + materials;
    const taxNow = document.getElementById("cbTaxNow")?.checked ?? false;
    const tax = subtotal * (taxNow ? base.taxRate / 100 : 0);
    const total = subtotal + tax;
    return { ...base, totals: { labour, materials, subtotal, tax, total } };
  }

  /** ---------- Create/Save invoice ---------- */
  function saveAsInvoice() {
    const data = scrapeEstimateFromDom();
    if (!data || typeof window === "undefined") return;
    const now = new Date().toISOString();
    const id = "inv-" + Date.now().toString(36);
    const invoice = { ...data, id, createdAt: now, updatedAt: now };
    let list = [];
    try {
      const raw = localStorage.getItem("epf.invoices");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch {}
    list.unshift(invoice);
    localStorage.setItem("epf.invoices", JSON.stringify(list));
    localStorage.setItem("epf.invoiceDraft", JSON.stringify(invoice));
    window.location.href = `/invoice-basic?id=${encodeURIComponent(id)}`;
  }

  function saveEstimateForLater() {
    const data = scrapeEstimateFromDom();
    if (!data) return;
    const record = saveInvoiceRecord(data);
    if (typeof window !== "undefined") {
      window.alert(
        `Estimate saved as invoice "${record.id}".\n\nLater open /invoice-basic?id=${record.id} to view/print.`
      );
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__EPF_ESTIMATE_INITED__) return;
    window.__EPF_ESTIMATE_INITED__ = true;

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /** ========= STATE SNAPSHOT (JSON) ========= */
    const STATE_KEY = "epf.estimateState.v2";

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
        qid: ($("#qid")?.textContent || "").trim(),
        preparedBy: ($("#preparedBy")?.textContent || "").trim(),
        startWindow: ($("#startWindow")?.textContent || "").trim(),
        mat_fixed: $("#mat_fixed")?.value || "0",
        mat_pct: $("#mat_pct")?.value || "0",
        disc_pct: $("#disc_pct")?.value || "0",
        tax_rate: $("#tax_rate")?.value || "13",
        tax_now: $("#cbTaxNow")?.checked ? 1 : 0,
        g_place_id: $("#g_place_id")?.value || "",
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
        if ("value" in el && el.tagName === "INPUT")
          el.value = value ?? el.value;
        else el.textContent = value ?? el.textContent;
      };
      if (meta.date) setVal("#date", meta.date);
      setVal("#client", meta.client || "[Full name]");
      setVal("#clientContact", meta.contact || "[Phone] • [Email]");
      const siteEl = document.querySelector("#site");
      if (siteEl) {
        if (siteEl.tagName === "INPUT") siteEl.value = meta.site || "";
        else siteEl.textContent = meta.site || "";
      }
      setVal("#qid", meta.qid || "EPF-QUOTE");
      setVal("#preparedBy", meta.preparedBy || "Alex — EPF Pro Services");
      setVal("#startWindow", meta.startWindow || "[TBD]");
      setVal("#mat_fixed", meta.mat_fixed || "0");
      setVal("#mat_pct", meta.mat_pct || "0");
      setVal("#disc_pct", meta.disc_pct || "0");
      setVal("#tax_rate", meta.tax_rate || "13");
      const cb = document.querySelector("#cbTaxNow");
      if (cb) cb.checked = !!meta.tax_now;
      const gpid = document.querySelector("#g_place_id");
      if (gpid && "value" in gpid) gpid.value = meta.g_place_id || "";

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
            });
          }
        });
      });

      updateMapsLink();
      attachSectionControls(); // ensure per-section controls exist (below each section)
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
      // add the per-section controls under the section
      appendControlsForSection(sec);
      return sec;
    }

    // === Per-section controls (appended BELOW each section) ===
    function appendControlsForSection(sec) {
      if (!sec) return;
      if (sec.querySelector(".sectionControls")) return; // already appended
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
        },
        opts || {}
      );
      const tr = document.createElement("tr");
      if (o.privateRow) tr.classList.add("private");
      if (o.group) tr.dataset.group = o.group;
      if (o.role) tr.dataset.role = o.role;

      const detailsArr =
        o.details ??
        detailsFor({ tmplId: o.tmplId, role: o.role, desc: o.desc });
      const descHTML = o.descHTML ?? renderDescWithDetails(o.desc, detailsArr);

      tr.innerHTML = `
        <td contenteditable="true">
          ${descHTML}
        </td>
        <td class="num qtyCell">
          <div class="qtyWrap">
            <input class="qty" type="number" step="0.01" inputmode="decimal" value="${
              o.qty !== "" ? o.qty : ""
            }">
            <button class="btn mini qtyWheel" title="Pick quantity">▦</button>
          </div>
        </td>
        <td>
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
        <td class="num col-rate">
          <input class="rate" type="number" step="0.01" inputmode="decimal" value="${
            o.rate !== "" ? o.rate : ""
          }">
        </td>
        <td class="num">
          <input class="amt" type="number" step="0.01" disabled>
        </td>
        <td class="num">
          <button class="btn ghost chooseService" title="Pick service">⋯</button>
          <button class="btn del" title="Remove">✕</button>
        </td>
      `;
      tb?.appendChild(tr);
    }

    function addPopRoom(roomLabel, type) {
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
    }

    function addPaintRoom(roomLabel) {
      const sec = $("#sec-paint");
      if (!sec) return;
      const tb = sec.querySelector("tbody");
      if (!tb) return;

      const hdr = document.createElement("tr");
      hdr.className = "roomHeader";
      hdr.innerHTML = `<td colspan="6">${roomLabel}</td>`;
      tb.appendChild(hdr);

      addRow(sec, { desc: "Walls paint", unit: "ea", rate: 750 });
      addRow(sec, { desc: "Door frame", unit: "door", rate: 80 });
      addRow(sec, { desc: "Window", unit: "ea", rate: 80 });
      addRow(sec, { desc: "Closet", unit: "ea", rate: 120 });
      scheduleDraftSave();
    }

    function initPopcornDefaults() {
      addPopRoom("Main areas", "unpainted");
    }

    /** ========= Recalc totals ========= */
    function recalc() {
      let labour = 0;
      $$(".sec[data-enabled='1']").forEach((sec) => {
        const isPop = sec.id === "sec-popcorn";
        const heightFactor = isPop ? parseFloat(sec.dataset.height || "1") : 1;
        $$("tbody tr", sec).forEach((tr) => {
          const qtyEl = tr.querySelector(".qty");
          const rateEl = tr.querySelector(".rate");
          const amtEl = tr.querySelector(".amt");
          if (!qtyEl || !rateEl || !amtEl) return;
          let qty = parseFloat(qtyEl.value || "0");
          const rate = parseFloat(rateEl.value || "0");
          const unit = (tr.querySelector(".unit")?.value || "").toLowerCase();
          if (isPop && unit === "sf") qty = qty * (heightFactor || 1);
          const amount = qty * rate;
          amtEl.value = amount ? amount.toFixed(2) : "";
          labour += amount;
        });
      });

      const mat_fixed = parseFloat($("#mat_fixed")?.value || "0");
      const mat_pct = parseFloat($("#mat_pct")?.value || "0");
      const disc_pct = parseFloat($("#disc_pct")?.value || "0");
      const base_tax_rate = parseFloat($("#tax_rate")?.value || "13");
      const calcTax = $("#cbTaxNow")?.checked ?? false;

      const materials = mat_fixed + labour * (mat_pct / 100);
      const discount = (labour + materials) * (disc_pct / 100);
      const subtotal = labour + materials - discount;
      const effectiveTaxRate = calcTax ? base_tax_rate : 0;
      const tax = subtotal * (effectiveTaxRate / 100);
      const total = subtotal + tax;

      const setText = (sel, text) => {
        const el = $(sel);
        if (el) el.textContent = text;
      };
      setText("#s_labour", "$" + Math.round(labour).toLocaleString());
      setText("#s_mat", "$" + Math.round(materials).toLocaleString());
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
            <select class="eqp-wheel" size="8" aria-label="Quantity"></select>
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
    document.addEventListener("focusin", (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.classList.contains("qty")) {
        if (window.innerWidth < 700) {
          t.blur();
          openQtyPicker(t);
        }
      }
    });

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
    });

    // Delegated clicks: rows & tools (per-section controls are below each section)
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      // global core
      if (t.id === "btnPrint") {
        window.print();
        return;
      }
      if (t.id === "btnSaveEstimate") {
        saveEstimateForLater();
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
        addPaintRoom(room);
        window.__EPF_RECALC__?.();
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
          // link SF inside popcorn group
          if (t.classList.contains("qty")) {
            const tr = t.closest("tr");
            const sec = t.closest(".sec");
            if (sec && sec.id === "sec-popcorn") {
              const linkOn = sec.dataset.linksf === "1";
              const role = tr?.dataset.role || "";
              const group = tr?.dataset.group || "";
              if (linkOn && role === "base" && group) {
                $$("#sec-popcorn tbody tr").forEach((row) => {
                  if (row.dataset.group === group) {
                    const rRole = row.dataset.role || "";
                    if (["floor", "skim", "prime", "paint"].includes(rRole)) {
                      const q = row.querySelector(".qty");
                      if (q) q.value = t.value;
                    }
                  }
                });
              }
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
          <div class="esp-list"></div>
        </div>`;
      document.body.appendChild(pickerRoot);
    }
    const pickerList = pickerRoot.querySelector(".esp-list");
    const pickerSearch = pickerRoot.querySelector(".esp-search");
    const pickerCloseBtn = pickerRoot.querySelector(".esp-close-btn");
    const pickerBackdrop = pickerRoot.querySelector(".esp-backdrop");

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

      const detailsArr = detailsFor({
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
    function renderServiceList(query) {
      if (!pickerList) return;
      pickerList.innerHTML = "";
      const q = (query || "").trim().toLowerCase();
      const allowed = SERVICE_TEMPLATES.filter((t) => {
        if (!pickerSectionId) return true;
        if (t.section === "any") return true;
        return t.section === pickerSectionId;
      }).filter(
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
      allowed.forEach((tmpl) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "esp-item";
        btn.innerHTML = `
          <div class="esp-main">
            <div class="esp-name">${tmpl.name}</div>
            <div class="esp-desc">${tmpl.desc}</div>
          </div>
          <div class="esp-price">$${(tmpl.rate ?? 0).toFixed(2)}</div>`;
        btn.addEventListener("click", () => {
          applyServiceTemplate(tmpl);
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
    pickerCloseBtn?.addEventListener("click", closeServicePicker);
    pickerBackdrop?.addEventListener("click", closeServicePicker);

    /** ========= Initial load ========= */
    // set date default
    const d = $("#date");
    if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);

    // try restore JSON
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        restoreEstimate(state);
      } else {
        // first-time defaults
        initPopcornDefaults();
        attachSectionControls(); // add controls under built-in sections
      }
    } catch {
      initPopcornDefaults();
      attachSectionControls();
    }
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
        if (place.formatted_address) {
          input.value = place.formatted_address;
        }
        const pidInput = document.getElementById("g_place_id");
        if (pidInput && place.place_id) {
          pidInput.value = place.place_id;
        }
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
  }, []);

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

      {/* tiny bullet style + customer/print privacy */}
      <style jsx global>{`
        .epf td .small::before {
          content: "• ";
        }
        .sectionControls .card {
          margin-top: 8px;
        }

        /* Hide sections marked as "hide from customer" in customer view + print */
        body.customer .sec[data-hide-customer="1"] {
          display: none !important;
        }
        @media print {
          .sec[data-hide-customer="1"] {
            display: none !important;
          }
        }

        /* Hide private rows in customer view + print */
        body.customer .sec tr.private {
          display: none !important;
        }
        @media print {
          .sec tr.private {
            display: none !important;
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
      `}</style>

      <div className="epf">
        <div className="page" id="page">
          {/* HEADER */}
          <div className="header">
            <div className="brand">
              <div className="logo">
                <img src="/logo/image.png" alt="EPF logo" />
              </div>
              <div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="font-semibold"
                >
                  EPF Pro Services
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-xs text-slate-500"
                >
                  info@epfproservices.com • 647-923-6784 • epfproservices.com
                </div>
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
          <EstimateClientJobBlock />

          {/* SERVICE SELECTOR */}
          <div className="services">
            <div className="card">
              <h3>Select Services</h3>
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
                  data-target="#sec-paint"
                  defaultChecked
                />{" "}
                Interior Painting (optional)
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
          <PopcornSection />
          <PaintingSection />
          <AdditionalServicesSection />

          {/* GLOBAL CONTROLS (below sections) */}
          <div className="controls">
            <button className="btn primary" id="btnPrint">
              Print / Save PDF (Customer)
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
            <div
              className="card"
              contentEditable
              suppressContentEditableWarning
            >
              <strong>Scope notes for the client:</strong> Dust-controlled
              removal, masking, HEPA sanding, and daily cleanup. Smooth finish
              ready for paint.
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
            <div>
              WSIB + Liability Insured • Workmanship warranty against
              application defects (1 year)
            </div>
            <div>EPF Pro Services • Popcorn ceiling removal • 647-923-6784</div>
          </div>
        </div>
      </div>
    </main>
  );
}
