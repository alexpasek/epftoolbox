"use client";

import { useEffect } from "react";
import PopcornSection from "@/components/estimate/PopcornSection";
import PaintingSection from "@/components/estimate/PaintingSection";
import AdditionalServicesSection from "@/components/estimate/AdditionalServicesSection";
// Predefined service templates for the picker
const SERVICE_TEMPLATES = [
  // ==== POPCORN / CEILINGS ====
  {
    id: "popcorn-unpainted-sf",
    section: "sec-popcorn",
    name: "Popcorn removal + Level 5 (unpainted)",
    desc: "Remove texture, Level 5 skim coat, HEPA sand, prime & paint-ready.",
    unit: "sf",
    rate: 6.5,
    defaultQty: null, // you type SF
  },
  {
    id: "popcorn-painted-sf",
    section: "sec-popcorn",
    name: "Popcorn removal + Level 5 (painted)",
    desc: "Remove painted popcorn, repair joints, Level 5 skim, HEPA sand.",
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

  // ==== INTERIOR PAINTING ====
  {
    id: "walls-standard-room",
    section: "sec-paint",
    name: "Interior walls — standard bedroom",
    desc: "2 coats on walls, basic prep & light sanding, low-VOC paint.",
    unit: "room",
    rate: 450,
    defaultQty: 1,
  },
  {
    id: "walls-large-room",
    section: "sec-paint",
    name: "Interior walls — large room",
    desc: "Living / family room, 2 coats, basic repairs included.",
    unit: "room",
    rate: 650,
    defaultQty: 1,
  },
  {
    id: "ceiling-room",
    section: "sec-paint",
    name: "Ceiling paint — room",
    desc: "Prime (if needed) & 2 coats ceiling white.",
    unit: "room",
    rate: 220,
    defaultQty: 1,
  },
  {
    id: "door-frame",
    section: "sec-paint",
    name: "Door & frame (per door)",
    desc: "Spot-sand, caulk gaps, 2 coats semi-gloss.",
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

  // ==== DRYWALL / EXTRA ====
  {
    id: "drywall-small-patch",
    section: "sec-add",
    name: "Drywall repair — small patch",
    desc: "Patch & mud small hole / crack, sand & prime ready for paint.",
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
    desc: "Metal / vinyl beads, mud, sand & straighten corners.",
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

  // ==== GENERIC (available everywhere) ====
  {
    id: "site-protection",
    section: "any",
    name: "Site protection & masking",
    desc: "Cover floors, stairs & key furniture with poly / RamBoard.",
    unit: "job",
    rate: 180,
    defaultQty: 1,
  },
];




export default function EstimateBuilderPage() {
  // ===== Helper: save one invoice record into localStorage list =====
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
    } catch (err) {
      console.error("Failed to read epf.invoices", err);
    }

    // Update or insert by id
    list = list.filter((inv) => inv.id !== record.id);
    list.push(record);

    try {
      window.localStorage.setItem("epf.invoices", JSON.stringify(list));
      window.localStorage.setItem("epf.invoiceDraft", JSON.stringify(record));
    } catch (err) {
      console.error("Failed to save invoices", err);
    }

    return record;
  }

  // === Create Invoice from this estimate (save & go to invoice page) ===
  function saveAsInvoice() {
    if (typeof window === "undefined") return;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const getTxt = (sel) => ($(sel)?.textContent || "").trim();

    const base = {
      client: getTxt("#client"),
      site: getTxt("#site"),
      date: $("#date")?.value || new Date().toISOString().slice(0, 10),
      quoteId: getTxt("#qid") || "EPF-QUOTE",
      taxRate: parseFloat($("#tax_rate")?.value || "13"),
      matFixed: parseFloat($("#mat_fixed")?.value || "0"),
      matPct: parseFloat($("#mat_pct")?.value || "0"),
      items: [],
      notes:
        "Thank you for the opportunity. Please review and let us know if you’d like to proceed.",
    };

    // customer-visible items only
    const secs = $$(".sec[data-enabled='1']");
    secs.forEach((sec) => {
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

    // totals
    const labour = base.items.reduce((s, r) => s + (r.amount || 0), 0);
    const materials = base.matFixed + labour * (base.matPct / 100);
    const subtotal = labour + materials;
    const tax = subtotal * (base.taxRate / 100);
    const total = subtotal + tax;

    const now = new Date().toISOString();
    const id = "inv-" + Date.now().toString(36);

    const invoice = {
      ...base,
      id,
      createdAt: now,
      updatedAt: now,
      totals: { labour, materials, subtotal, tax, total },
    };

    // store in list
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

    list.unshift(invoice); // newest first
    localStorage.setItem("epf.invoices", JSON.stringify(list));

    // also remember as "last invoice draft"
    localStorage.setItem("epf.invoiceDraft", JSON.stringify(invoice));

    // go to invoice page to edit / print
    window.location.href = `/invoice-basic?id=${encodeURIComponent(id)}`;
  }

  // === Keep a copy of this estimate (no redirect) ===
  function saveEstimateForLater() {
    if (typeof window === "undefined") return;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const getTxt = (sel) => ($(sel)?.textContent || "").trim();

    const data = {
      client: getTxt("#client"),
      site: getTxt("#site"),
      date: $("#date")?.value || "",
      quoteId: getTxt("#qid") || "EPF-QUOTE",
      taxRate: parseFloat($("#tax_rate")?.value || "13"),
      matFixed: parseFloat($("#mat_fixed")?.value || "0"),
      matPct: parseFloat($("#mat_pct")?.value || "0"),
      items: [],
      notes:
        "Thank you for the opportunity. Please review and let us know if you’d like to proceed.",
    };

    // customer-visible items only (same logic as saveAsInvoice)
    const secs = $$(".sec[data-enabled='1']");
    secs.forEach((sec) => {
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

        data.items.push({
          description: (descCell?.textContent || "").trim(),
          qty,
          unit: tr.querySelector(".unit")?.value || "",
          rate,
          amount: amt,
        });
      });
    });

    // totals (same formula as saveAsInvoice)
    const labour = data.items.reduce((s, r) => s + (r.amount || 0), 0);
    const materials = data.matFixed + labour * (data.matPct / 100);
    const subtotal = labour + materials;
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;
    data.totals = { labour, materials, subtotal, tax, total };

    const record = saveInvoiceRecord(data);

    window.alert(
      `Estimate saved as invoice "${record.id}".\n\nLater you can open /invoice-basic?id=${record.id} in this browser to view / print it.`
    );
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__EPF_ESTIMATE_INITED__) return;
    window.__EPF_ESTIMATE_INITED__ = true;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    // ===== Service picker (bottom sheet, like Jobber) =====
    let pickerTargetRow = null;
    let pickerSectionId = null;

    // create overlay once
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
            </div>
          `;
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

      if (descCell) {
        descCell.innerHTML = `
              ${tmpl.name}
              <div class="small">${tmpl.desc}</div>
            `;
      }
      if (
        qtyInput &&
        tmpl.defaultQty !== null &&
        tmpl.defaultQty !== undefined
      ) {
        qtyInput.value = String(tmpl.defaultQty);
      }
      if (unitSel && tmpl.unit) {
        unitSel.value = tmpl.unit;
      }
      if (rateInput && tmpl.rate !== null && tmpl.rate !== undefined) {
        rateInput.value = String(tmpl.rate);
      }
    }

    function renderServiceList(query) {
      if (!pickerList) return;
      pickerList.innerHTML = "";

      const q = (query || "").trim().toLowerCase();

      const allowed = SERVICE_TEMPLATES.filter((t) => {
        if (!pickerSectionId || pickerSectionId === "") return true;
        if (t.section === "any") return true;
        return t.section === pickerSectionId;
      }).filter((t) => {
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
        );
      });

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
              <div class="esp-price">$${(tmpl.rate ?? 0).toFixed(2)}</div>
            `;
        btn.addEventListener("click", () => {
          applyServiceTemplate(tmpl);
          recalc();
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

    pickerSearch?.addEventListener("input", (e) => {
      const val = e.target.value;
      renderServiceList(val);
    });

    pickerCloseBtn?.addEventListener("click", () => {
      closeServicePicker();
    });

    pickerBackdrop?.addEventListener("click", () => {
      closeServicePicker();
    });

    // Date default
    const d = $("#date");
    if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);

    // Customer view toggle
    $("#toggleCustomer")?.addEventListener("click", () => {
      document.body.classList.toggle("customer");
    });

    // Keep-sections toggle (print)
    $("#cbKeepSections")?.addEventListener("change", (e) => {
      const target = e.target;
      if (target && "checked" in target) {
        document.body.classList.toggle("keep-sections", target.checked);
      }
    });

    // Service selector (enable / disable whole sections)
    $$(".svc").forEach((chk) => {
      const sel = chk.getAttribute("data-target");
      const sec = sel ? document.querySelector(sel) : null;
      if (!sec) return;

      const setState = (on) => sec.setAttribute("data-enabled", on ? "1" : "0");
      setState(chk.checked);

      chk.addEventListener("change", () => {
        setState(chk.checked);
        recalc();
        if (chk.checked)
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // === CHANGE HANDLERS (hide section + popcorn painted/unpainted) ===
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      // Hide section from customer
      if (t.classList.contains("hideSec")) {
        const sec = t.closest(".sec");
        if (sec) sec.dataset.hideCustomer = t.checked ? "1" : "0";
      }

      // Popcorn room: painted / unpainted selector
      if (t.classList.contains("roomPaintSel")) {
        const row = t.closest("tr"); // header row
        if (!row) return;
        const group = row.dataset.group;
        if (!group) return;

        const value = t.value === "painted" ? "painted" : "unpainted";
        const painted = value === "painted";
        const baseRate = painted ? 2.5 : 2.0;

        // Update base line for this room (rate + description text)
        const baseRow = document.querySelector(
          `#sec-popcorn tbody tr[data-group="${group}"][data-role="base"]`
        );
        if (baseRow) {
          const td = baseRow.querySelector("td");
          const rateInput = baseRow.querySelector(".rate");

          if (rateInput) {
            rateInput.value = String(baseRate);
          }

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

        recalc();
      }
    });

    // Delegated clicks
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t.classList.contains("chooseService")) {
        const row = t.closest("tr");
        if (row) {
          openServicePicker(row);
        }
        return;
      }

      if (!(t instanceof HTMLElement)) return;

      if (t.classList.contains("addLine")) {
        const sec = t.closest(".sec");
        if (sec) addRow(sec, {});
      }

      if (t.classList.contains("clearSection")) {
        const sec = t.closest(".sec");
        if (sec) {
          const tb = sec.querySelector("tbody");
          if (tb) tb.innerHTML = "";
          recalc();
        }
      }

      if (t.classList.contains("del")) {
        const tr = t.closest("tr");
        if (tr) {
          tr.remove();
          recalc();
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
        recalc();
      }

      if (t.classList.contains("addRoom")) {
        const room = window.prompt("Room name (e.g., Primary Bedroom)?");
        if (!room) return;
        addPaintRoom(room);
        recalc();
      }
    });

    // Add Section
    $("#addSection")?.addEventListener("click", () => {
      const idx = document.querySelectorAll(".sec").length + 1;
      const sec = document.createElement("section");
      sec.className = "sec";
      sec.dataset.enabled = "1";
      sec.dataset.hideCustomer = "0";
      sec.innerHTML = `
        <div class="secHead">
          <div class="secTitle" contenteditable="true">Custom Section ${idx}</div>
        </div>
        <div class="secDesc" contenteditable="true">Describe this scope for the client.</div>
        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th style="width:46%;">Description</th>
                <th style="width:10%;" class="num">Qty</th>
                <th style="width:12%;">Unit</th>
                <th style="width:14%;" class="num col-rate">Rate</th>
                <th style="width:14%;" class="num">Amount</th>
                <th style="width:4%;"></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="secTog secTog-bottom">
          <label><input type="checkbox" class="hideSec"> Hide from customer</label>
          <button class="btn ghost addLine">＋ Add line</button>
          <button class="btn ghost clearSection">Clear section</button>
        </div>
      `;
      const before = document.querySelector(".controls");
      if (before && before.parentNode)
        before.parentNode.insertBefore(sec, before);
    });

    // Clear all
    $("#clearAll")?.addEventListener("click", () => {
      if (!window.confirm("Clear all line items in ALL sections?")) return;
      $$("#page table tbody").forEach((tb) => (tb.innerHTML = ""));
      recalc();
    });

    // Popcorn controls
    const popSec = $("#sec-popcorn");
    const heightSel = popSec ? popSec.querySelector(".heightSel") : null;
    const linkSFChk = popSec ? popSec.querySelector(".linkSF") : null;
    const resetPopBtn = popSec ? popSec.querySelector(".resetPop") : null;

    heightSel?.addEventListener("change", (e) => {
      if (!popSec) return;
      const target = e.target;
      if (target && "value" in target) {
        popSec.dataset.height = target.value;
        recalc();
      }
    });

    linkSFChk?.addEventListener("change", (e) => {
      if (!popSec) return;
      const target = e.target;
      if (target && "checked" in target) {
        popSec.dataset.linksf = target.checked ? "1" : "0";
      }
    });

    resetPopBtn?.addEventListener("click", () => {
      const tb = $("#tb-popcorn");
      if (!tb) return;
      tb.innerHTML = "";
      initPopcornDefaults();
      recalc();
    });

    // Inputs
    document.addEventListener("input", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement)) return;

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
        recalc();
      }
    });

    // ===== Helpers inside effect =====
    function addRow(sec, opts) {
      const tb = sec.querySelector("tbody");
      const o = Object.assign(
        {
          desc: "Description…",
          qty: "",
          unit: "sf",
          rate: "",
          privateRow: false,
          group: "",
          role: "",
        },
        opts || {}
      );
      const tr = document.createElement("tr");
      if (o.privateRow) tr.classList.add("private");
      if (o.group) tr.dataset.group = o.group;
      if (o.role) tr.dataset.role = o.role;

      tr.innerHTML = `
        <td contenteditable="true">
          ${o.desc}
          <div class="small" contenteditable="true">Details / area</div>
        </td>
        <td class="num">
          <input class="qty" type="number" step="0.01" value="${
            o.qty !== "" ? o.qty : ""
          }">
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
          <input class="rate" type="number" step="0.01" value="${
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
      if (tb) tb.appendChild(tr);
    }


    function addPopRoom(roomLabel, type) {
      const tb = $("#tb-popcorn");
      const group =
        "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const painted = (type || "unpainted").includes("paint");
      const baseRate = painted ? 2.5 : 2.0;
      if (!tb) return;

      // Header row: editable room name + painted/unpainted selector
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
        </td>
      `;
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
        desc: "Ceiling priming (internal)",
        unit: "sf",
        rate: 1.0,
        privateRow: true,
        group,
        role: "prime",
      });
      addRow(popSecLocal, {
        desc: "Ceiling paint (2 coats, internal)",
        unit: "sf",
        rate: 2.0,
        privateRow: true,
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

      // one-time minimum
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

      // customer-visible
      addRow(sec, {
        desc: "Walls paint",
        unit: "ea",
        rate: 750,
        privateRow: false,
      });
      addRow(sec, {
        desc: "Door frame",
        unit: "door",
        rate: 80,
        privateRow: false,
      });
      addRow(sec, {
        desc: "Window",
        unit: "ea",
        rate: 80,
        privateRow: false,
      });
      addRow(sec, {
        desc: "Closet",
        unit: "ea",
        rate: 120,
        privateRow: false,
      });
    }

    function initPopcornDefaults() {
      addPopRoom("Main areas", "unpainted");
    }

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
      const tax_rate = parseFloat($("#tax_rate")?.value || "13");

      const materials = mat_fixed + labour * (mat_pct / 100);
      const discount = (labour + materials) * (disc_pct / 100);
      const subtotal = labour + materials - discount;
      const tax = subtotal * (tax_rate / 100);
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
      setText("#taxLbl", String(tax_rate));
      setText("#s_tax", "$" + Math.round(tax).toLocaleString());
      setText("#s_total", "$" + Math.round(total).toLocaleString());
      setText("#hdr_total", "$" + Math.round(total).toLocaleString());
    }

    // expose if you ever want from console
    window.__EPF_RECALC__ = recalc;

    // init
    initPopcornDefaults();
    recalc();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 py-4 px-2 md:px-4">
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
            <div className="badge">Estimate</div>
          </div>

          <div className="reviewBar">
            <span className="pill hs">
              HomeStars <span className="stars">★★★★★</span>
            </span>
            <span className="pill g">
              Google Reviews <span className="stars">★★★★★</span>
            </span>
          </div>

          {/* CLIENT / JOB BLOCK */}
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
                <div contentEditable suppressContentEditableWarning>
                  [Phone] • [Email]
                </div>
              </div>
              <div className="kv">
                <label>Address</label>
                <div id="site" contentEditable suppressContentEditableWarning>
                  [Street, City]
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
                <div contentEditable suppressContentEditableWarning>
                  Alex — EPF Pro Services
                </div>
              </div>
              <div className="kv">
                <label>Start window</label>
                <div contentEditable suppressContentEditableWarning>
                  [TBD]
                </div>
              </div>
            </div>
          </div>

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

          {/* SECTIONS AS SEPARATE COMPONENTS */}
          <PopcornSection />
          <PaintingSection />
          <AdditionalServicesSection />

          {/* CONTROLS */}
          <div className="controls">
            <button
              className="btn primary"
              onClick={() => typeof window !== "undefined" && window.print()}
            >
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

            <button className="btn ghost" onClick={saveEstimateForLater}>
              Keep / Save Estimate
            </button>

            <button className="btn primary" onClick={saveAsInvoice}>
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
              ready for paint. Excludes asbestos testing/removal, electrical,
              structural work, and permits unless noted.
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
                  Tax (<span id="taxLbl">13</span>%)
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
            <div>EPF Pro Services • Mississauga • 647-923-6784</div>
          </div>
        </div>
      </div>
    </main>
  );
}
