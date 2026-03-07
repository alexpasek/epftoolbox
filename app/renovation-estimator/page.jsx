"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Card({ className = "", children }) {
  return <div className={cx("bg-white", className)}>{children}</div>;
}
function CardHeader({ className = "", children }) {
  return <div className={cx("p-6", className)}>{children}</div>;
}
function CardTitle({ className = "", children }) {
  return <h2 className={cx("font-bold text-slate-900", className)}>{children}</h2>;
}
function CardContent({ className = "", children }) {
  return <div className={cx("p-6 pt-0", className)}>{children}</div>;
}

function Button({
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  children,
  ...props
}) {
  const variantClass =
    variant === "outline"
      ? "border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-100"
      : variant === "ghost"
        ? "border border-transparent bg-transparent text-slate-900 hover:bg-slate-100"
        : variant === "secondary"
          ? "border border-slate-300 bg-slate-100 text-slate-900"
          : "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800";

  const sizeClass = size === "icon" ? "h-9 w-9 p-0 justify-center" : "px-3 py-2";

  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 text-sm font-semibold transition rounded-lg cursor-pointer disabled:opacity-60",
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={cx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500",
        className
      )}
      {...props}
    />
  );
}

function Label({ className = "", children }) {
  return <label className={cx("text-sm font-semibold text-slate-800", className)}>{children}</label>;
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={cx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500",
        className
      )}
      {...props}
    />
  );
}

function Badge({ className = "", children }) {
  return <span className={cx("inline-flex items-center border border-slate-300 px-2 py-0.5 text-xs", className)}>{children}</span>;
}

function Separator({ className = "" }) {
  return <hr className={cx("border-slate-200", className)} />;
}

function Checkbox({ checked, onCheckedChange, className = "" }) {
  return (
    <input
      type="checkbox"
      className={cx("h-4 w-4 rounded border-slate-300", className)}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  );
}

function textFromNode(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((n) => textFromNode(n)).join("");
  if (React.isValidElement(node)) return textFromNode(node.props?.children);
  return "";
}

function collectSelectMeta(children, acc) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const marker = child.type?.__selectMarker;
    if (marker === "item") {
      acc.items.push({
        value: String(child.props.value ?? ""),
        disabled: !!child.props.disabled,
        label: textFromNode(child.props.children).trim() || String(child.props.value ?? ""),
      });
      return;
    }
    if (marker === "trigger" && !acc.triggerClass) {
      acc.triggerClass = child.props.className || "";
    }
    if (marker === "value" && !acc.placeholder) {
      acc.placeholder = child.props.placeholder || "";
    }
    if (child.props?.children) collectSelectMeta(child.props.children, acc);
  });
}

function Select({ value, onValueChange, children }) {
  const meta = useMemo(() => {
    const acc = { items: [], triggerClass: "", placeholder: "" };
    collectSelectMeta(children, acc);
    return acc;
  }, [children]);

  const currentValue = String(value ?? "");
  const hasValue = meta.items.some((it) => it.value === currentValue);

  return (
    <select
      value={hasValue ? currentValue : ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500",
        meta.triggerClass
      )}
    >
      {!hasValue ? (
        <option value="" disabled>
          {meta.placeholder || "Select"}
        </option>
      ) : null}
      {meta.items.map((it) => (
        <option key={`${it.value}-${it.label}`} value={it.value} disabled={it.disabled}>
          {it.label}
        </option>
      ))}
    </select>
  );
}

function SelectContent({ children }) {
  return <>{children}</>;
}
function SelectItem({ children }) {
  return <>{children}</>;
}
SelectItem.__selectMarker = "item";

function SelectTrigger({ children }) {
  return <>{children}</>;
}
SelectTrigger.__selectMarker = "trigger";

function SelectValue() {
  return null;
}
SelectValue.__selectMarker = "value";

function icon(glyph) {
  return function Icon({ className = "" }) {
    return (
      <span aria-hidden className={cx("inline-flex items-center justify-center leading-none", className)}>
        {glyph}
      </span>
    );
  };
}

const Plus = icon("+");
const Trash2 = icon("x");
const Calculator = icon("=");
const Home = icon("H");
const Printer = icon("P");
const PenLine = icon("/");
const Search = icon("S");
const ChevronDown = icon("v");
const ChevronRight = icon(">");
const LayoutGrid = icon("#");
const Sheet = icon("[]");
const Upload = icon("U");
const Download = icon("D");
const RefreshCw = icon("R");
const Save = icon("S");
const FolderOpen = icon("F");
const Copy = icon("C");
const X = icon("x");
const Lock = icon("L");
const Unlock = icon("O");

// ---------- Storage keys ----------
const LS_PRICE_SHEET_KEY = "epf_reno_price_sheet_v1";
const LS_QUOTE_STATE_KEY = "epf_reno_quote_state_v1";
const LS_SAVED_QUOTES_KEY = "epf_reno_saved_quotes_v1";

// ---------- Status definitions ----------
const STATUS_CONFIG = {
  included: {
    label: "Included",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    countInTotal: true,
    description: "Included in the quoted price",
  },
  allowance: {
    label: "Allowance",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    countInTotal: true,
    description:
      "Budget placeholder (usually supply-only) - final price adjusts after client selections",
  },
  owner: {
    label: "Owner Supplied",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-300",
    countInTotal: false,
    description: "Client supplies the product or material",
  },
  excluded: {
    label: "Excluded",
    badgeClass: "bg-slate-200 text-slate-900 border-slate-300",
    countInTotal: false,
    description: "Not included in this quote",
  },
};

// ---------- Categories ----------
const CATEGORY_OPTIONS = [
  "Site Prep & Demo",
  "Framing & Drywall",
  "Insulation",
  "Plumbing",
  "Electrical",
  "HVAC & Ventilation",
  "Waterproofing",
  "Flooring & Tile",
  "Doors & Trim",
  "Kitchen & Millwork",
  "Painting & Finishing",
  "Permits & Testing",
  "Custom",
];

const PRICING_DEFAULTS = {
  contingencyPercent: 10,
  markupPercent: 18,
  taxPercent: 13,
};

// ---------- Default Price Sheet ----------
const DEFAULT_PRICE_SHEET = [
  // Site Prep & Demo
  {
    libId: "site-protection",
    name: "Site protection / dust barriers",
    category: "Site Prep & Demo",
    defaultQty: 1,
    unit: "ea",
    rate: 350,
    status: "included",
    note: "Floor protection, poly, zipper access, basic dust control",
  },
  {
    libId: "selective-demo-sqft",
    name: "Selective demolition / haul-out",
    category: "Site Prep & Demo",
    defaultQty: 100,
    unit: "sqft",
    rate: 4.5,
    status: "included",
    note: "Use for walls, ceilings, flooring, small selective tear-out",
  },
  {
    libId: "bin-disposal",
    name: "Disposal bin / dump run",
    category: "Site Prep & Demo",
    defaultQty: 1,
    unit: "ea",
    rate: 650,
    status: "allowance",
    note: "Adjust based on debris volume and access",
  },
  {
    libId: "asbestos-testing",
    name: "Asbestos / hazardous material testing",
    category: "Site Prep & Demo",
    defaultQty: 1,
    unit: "ea",
    rate: 350,
    status: "excluded",
    note: "Testing only; abatement is separate",
  },

  // Framing & Drywall
  {
    libId: "framing-wall-lf",
    name: "Non-load-bearing wall framing",
    category: "Framing & Drywall",
    defaultQty: 10,
    unit: "lf",
    rate: 45,
    status: "included",
    note: "Interior partition framing placeholder",
  },
  {
    libId: "drywall-install-sqft",
    name: "Drywall hang / tape / finish",
    category: "Framing & Drywall",
    defaultQty: 100,
    unit: "sqft",
    rate: 4.5,
    status: "included",
    note: "Board, tape, mud, sanding, ready for prime",
  },
  {
    libId: "drywall-patch",
    name: "Drywall patch / repair",
    category: "Framing & Drywall",
    defaultQty: 1,
    unit: "ea",
    rate: 275,
    status: "included",
    note: "Small repair areas / patch after trades",
  },
  {
    libId: "skim-coat-sqft",
    name: "Skim coat (Level 5 / smoothing)",
    category: "Framing & Drywall",
    defaultQty: 100,
    unit: "sqft",
    rate: 5.5,
    status: "included",
    note: "Wall/ceiling smoothing; adjust for access/texture",
  },
  {
    libId: "popcorn-removal-sqft",
    name: "Popcorn ceiling removal (dust controlled)",
    category: "Framing & Drywall",
    defaultQty: 100,
    unit: "sqft",
    rate: 6,
    status: "included",
    note: "Includes prep + removal; refinishing can be separate",
  },

  // Insulation
  {
    libId: "batt-insulation-sqft",
    name: "Batt insulation install",
    category: "Insulation",
    defaultQty: 100,
    unit: "sqft",
    rate: 2.5,
    status: "included",
    note: "Interior wall/ceiling batt insulation placeholder",
  },
  {
    libId: "soundproof-insulation-sqft",
    name: "Soundproof insulation upgrade",
    category: "Insulation",
    defaultQty: 100,
    unit: "sqft",
    rate: 3.75,
    status: "allowance",
    note: "Bedrooms, bathrooms, offices, shared walls",
  },

  // Plumbing
  {
    libId: "plumbing-roughin-fixture",
    name: "Plumbing rough-in",
    category: "Plumbing",
    defaultQty: 1,
    unit: "fixture",
    rate: 1400,
    status: "included",
    note: "Per added/relocated fixture; adjust after site review",
  },
  {
    libId: "plumbing-finish-fixture",
    name: "Plumbing finish / reconnect",
    category: "Plumbing",
    defaultQty: 1,
    unit: "fixture",
    rate: 275,
    status: "included",
    note: "Final trims, hookups, testing",
  },
  {
    libId: "laundry-hookups",
    name: "Laundry hookups",
    category: "Plumbing",
    defaultQty: 1,
    unit: "ea",
    rate: 1200,
    status: "included",
    note: "Washer box, drain, water hookup placeholder",
  },
  {
    libId: "concrete-cut-sqft",
    name: "Concrete cutting",
    category: "Plumbing",
    defaultQty: 20,
    unit: "sqft",
    rate: 8,
    status: "allowance",
    note: "Basement slab opening",
  },
  {
    libId: "trenching-lf",
    name: "Trenching",
    category: "Plumbing",
    defaultQty: 12,
    unit: "lf",
    rate: 9,
    status: "allowance",
    note: "Basement drain runs",
  },
  {
    libId: "ejector-pump",
    name: "Ejector pump (if needed)",
    category: "Plumbing",
    defaultQty: 1,
    unit: "ea",
    rate: 2400,
    status: "excluded",
    note: "Enable if gravity drainage is not possible",
  },

  // Electrical
  {
    libId: "electrical-point",
    name: "Electrical rough-in / point",
    category: "Electrical",
    defaultQty: 4,
    unit: "point",
    rate: 150,
    status: "included",
    note: "Switch/receptacle/lighting point placeholders",
  },
  {
    libId: "device-finish",
    name: "Device install / finish trim",
    category: "Electrical",
    defaultQty: 4,
    unit: "ea",
    rate: 95,
    status: "included",
    note: "Switches, plugs, plates, simple fixtures",
  },
  {
    libId: "potlight-install",
    name: "Pot light install",
    category: "Electrical",
    defaultQty: 4,
    unit: "ea",
    rate: 225,
    status: "allowance",
    note: "New recessed lights",
  },

  // HVAC
  {
    libId: "bath-fan-install",
    name: "Bathroom fan install",
    category: "HVAC & Ventilation",
    defaultQty: 1,
    unit: "ea",
    rate: 575,
    status: "allowance",
    note: "Fan supply + install placeholder",
  },
  {
    libId: "fan-ducting",
    name: "Fan ducting / vent connection",
    category: "HVAC & Ventilation",
    defaultQty: 1,
    unit: "ea",
    rate: 290,
    status: "allowance",
    note: "Additional duct run / vent connection placeholder",
  },

  // Waterproofing
  {
    libId: "waterproofing-sqft",
    name: "Waterproofing membrane",
    category: "Waterproofing",
    defaultQty: 50,
    unit: "sqft",
    rate: 12,
    status: "included",
    note: "Wet-area membrane placeholder per sq ft",
  },
  {
    libId: "backer-board-sqft",
    name: "Cement board / backer board",
    category: "Waterproofing",
    defaultQty: 50,
    unit: "sqft",
    rate: 8,
    status: "included",
    note: "Wet-zone board install placeholder per sq ft",
  },

  // Flooring
  {
    libId: "tile-floor-sqft",
    name: "Tile floor install",
    category: "Flooring & Tile",
    defaultQty: 100,
    unit: "sqft",
    rate: 17,
    status: "included",
    note: "Labour/setting materials placeholder",
  },
  {
    libId: "tile-wall-sqft",
    name: "Tile wall install",
    category: "Flooring & Tile",
    defaultQty: 60,
    unit: "sqft",
    rate: 14,
    status: "included",
    note: "Wall tile labour placeholder",
  },
  {
    libId: "tile-supply-sqft",
    name: "Tile supply allowance",
    category: "Flooring & Tile",
    defaultQty: 100,
    unit: "sqft",
    rate: 12,
    status: "allowance",
    note: "Editable allowance per sq ft",
  },
  {
    libId: "laminate-floor-sqft",
    name: "Laminate floor install",
    category: "Flooring & Tile",
    defaultQty: 100,
    unit: "sqft",
    rate: 5,
    status: "included",
    note: "Laminate install placeholder",
  },

  // Doors & Trim
  {
    libId: "baseboard-lf",
    name: "Baseboard install",
    category: "Doors & Trim",
    defaultQty: 50,
    unit: "lf",
    rate: 8,
    status: "included",
    note: "Install placeholder per linear foot",
  },
  {
    libId: "casing-lf",
    name: "Door/window casing install",
    category: "Doors & Trim",
    defaultQty: 30,
    unit: "lf",
    rate: 10,
    status: "included",
    note: "Casing install placeholder per linear foot",
  },

  // Kitchen
  {
    libId: "cabinet-install-ea",
    name: "Cabinet install",
    category: "Kitchen & Millwork",
    defaultQty: 6,
    unit: "cabinet",
    rate: 300,
    status: "included",
    note: "Install placeholder per cabinet",
  },
  {
    libId: "cabinet-allowance-lf",
    name: "Cabinet allowance",
    category: "Kitchen & Millwork",
    defaultQty: 10,
    unit: "lf",
    rate: 450,
    status: "allowance",
    note: "Editable allowance for stock/semi-custom cabinetry",
  },

  // Painting
  {
    libId: "paint-room-full-sqft",
    name: "Painting - full room (walls/trim/doors)",
    category: "Painting & Finishing",
    defaultQty: 100,
    unit: "sqft",
    rate: 4,
    status: "included",
    note: "Full-room placeholder per floor sq ft of room",
  },
  {
    libId: "final-cleanup",
    name: "Final cleanup",
    category: "Painting & Finishing",
    defaultQty: 1,
    unit: "ea",
    rate: 250,
    status: "included",
    note: "Final wipe-down and debris pickup",
  },

  // Permits
  {
    libId: "permit-plumbing-fixture",
    name: "Plumbing permit fee",
    category: "Permits & Testing",
    defaultQty: 1,
    unit: "fixture",
    rate: 41,
    status: "excluded",
    note: "City review fee placeholder per plumbing fixture",
  },
  {
    libId: "permit-admin",
    name: "Permit handling / administration",
    category: "Permits & Testing",
    defaultQty: 1,
    unit: "ea",
    rate: 250,
    status: "excluded",
    note: "Admin/drawings coordination placeholder",
  },
];

// ---------- Room templates ----------
const ROOM_TEMPLATES = {
  bedroom1: {
    label: "Bedroom 1",
    description: "Typical bedroom refresh",
    build: (add) => [
      add("site-protection"),
      add("drywall-patch"),
      add("laminate-floor-sqft"),
      add("baseboard-lf"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
    ],
  },
  bedroom2: {
    label: "Bedroom 2",
    description: "Typical bedroom refresh",
    build: (add) => ROOM_TEMPLATES.bedroom1.build(add),
  },
  bedroom3: {
    label: "Bedroom 3",
    description: "Typical bedroom refresh",
    build: (add) => ROOM_TEMPLATES.bedroom1.build(add),
  },
  livingRoom: {
    label: "Living Room",
    description: "Living room refresh",
    build: (add) => [
      add("site-protection"),
      add("drywall-patch"),
      add("laminate-floor-sqft"),
      add("baseboard-lf"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
    ],
  },
  diningRoom: {
    label: "Dining Room",
    description: "Dining room refresh",
    build: (add) => [
      add("site-protection"),
      add("drywall-patch"),
      add("laminate-floor-sqft"),
      add("baseboard-lf"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
    ],
  },
  hallway: {
    label: "Hallway",
    description: "Hall / circulation area",
    build: (add) => [
      add("site-protection"),
      add("laminate-floor-sqft"),
      add("baseboard-lf"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
    ],
  },
  kitchen: {
    label: "Kitchen",
    description: "Kitchen renovation template",
    build: (add) => [
      add("site-protection"),
      add("selective-demo-sqft"),
      { ...add("plumbing-roughin-fixture"), qty: 2 },
      { ...add("plumbing-finish-fixture"), qty: 2 },
      { ...add("electrical-point"), qty: 6 },
      { ...add("device-finish"), qty: 6 },
      add("cabinet-install-ea"),
      add("cabinet-allowance-lf"),
      add("tile-supply-sqft"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
    ],
  },
  powderRoom: {
    label: "Powder Room",
    description: "Toilet + vanity",
    build: (add) => [
      add("site-protection"),
      add("selective-demo-sqft"),
      { ...add("plumbing-roughin-fixture"), qty: 2 },
      { ...add("plumbing-finish-fixture"), qty: 2 },
      { ...add("electrical-point"), qty: 2 },
      add("tile-floor-sqft"),
      add("tile-supply-sqft"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
      add("permit-plumbing-fixture"),
      add("permit-admin"),
    ],
  },
  fullBath: {
    label: "Main Bathroom",
    description: "Bathroom template",
    build: (add) => [
      add("site-protection"),
      add("selective-demo-sqft"),
      { ...add("plumbing-roughin-fixture"), qty: 3 },
      { ...add("plumbing-finish-fixture"), qty: 3 },
      add("bath-fan-install"),
      add("fan-ducting"),
      add("waterproofing-sqft"),
      add("backer-board-sqft"),
      add("tile-floor-sqft"),
      add("tile-wall-sqft"),
      add("tile-supply-sqft"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
      { ...add("permit-plumbing-fixture"), qty: 3 },
      add("permit-admin"),
    ],
  },
  ensuite: {
    label: "Ensuite",
    description: "Ensuite bathroom template",
    build: (add) => [
      add("site-protection"),
      add("selective-demo-sqft"),
      { ...add("plumbing-roughin-fixture"), qty: 3 },
      { ...add("plumbing-finish-fixture"), qty: 3 },
      add("bath-fan-install"),
      add("fan-ducting"),
      add("waterproofing-sqft"),
      add("backer-board-sqft"),
      add("tile-floor-sqft"),
      add("tile-wall-sqft"),
      add("tile-supply-sqft"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
      { ...add("permit-plumbing-fixture"), qty: 3 },
      add("permit-admin"),
    ],
  },
  basement: {
    label: "Basement",
    description: "Basement general finishing",
    build: (add) => [
      add("site-protection"),
      add("framing-wall-lf"),
      add("batt-insulation-sqft"),
      add("drywall-install-sqft"),
      add("laminate-floor-sqft"),
      add("baseboard-lf"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
      add("permit-admin"),
    ],
  },
  basementBath: {
    label: "Basement Bathroom",
    description: "Basement bath with slab placeholders",
    build: (add) => [
      add("site-protection"),
      add("selective-demo-sqft"),
      add("concrete-cut-sqft"),
      add("trenching-lf"),
      add("ejector-pump"),
      { ...add("plumbing-roughin-fixture"), qty: 3 },
      { ...add("plumbing-finish-fixture"), qty: 3 },
      add("bath-fan-install"),
      add("fan-ducting"),
      add("waterproofing-sqft"),
      add("backer-board-sqft"),
      add("tile-floor-sqft"),
      add("tile-wall-sqft"),
      add("tile-supply-sqft"),
      add("paint-room-full-sqft"),
      add("final-cleanup"),
      { ...add("permit-plumbing-fixture"), qty: 3 },
      add("permit-admin"),
    ],
  },
  customRoom: {
    label: "Custom Room",
    description: "Blank room",
    build: (add) => [add("site-protection"), add("final-cleanup")],
  },
};

const ROOM_TYPE_BENCHMARKS = {
  bedroom1: { min: 35, max: 90 },
  bedroom2: { min: 35, max: 90 },
  bedroom3: { min: 35, max: 90 },
  livingRoom: { min: 40, max: 100 },
  diningRoom: { min: 40, max: 100 },
  hallway: { min: 30, max: 80 },
  kitchen: { min: 180, max: 420 },
  powderRoom: { min: 220, max: 500 },
  fullBath: { min: 250, max: 600 },
  ensuite: { min: 250, max: 600 },
  basement: { min: 85, max: 190 },
  basementBath: { min: 250, max: 600 },
  customRoom: { min: 60, max: 180 },
};

// ---------- Helpers ----------
function currency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function ratePerSqft(value) {
  if (!Number.isFinite(value)) return "-";
  return `${currency(value)} /sf`;
}

function benchmarkStatusFor(rate, benchmark) {
  if (!Number.isFinite(rate) || !benchmark) return "Add area";
  if (rate < benchmark.min) return "Below average";
  if (rate > benchmark.max) return "Above average";
  return "In average range";
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugify(input) {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "custom"
  );
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadText(filename, text, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

function loadPriceSheet() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_PRICE_SHEET_KEY) : null;
  if (!raw) return DEFAULT_PRICE_SHEET;
  const parsed = safeJsonParse(raw, null);
  if (!Array.isArray(parsed)) return DEFAULT_PRICE_SHEET;
  const cleaned = parsed
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      libId: String(x.libId || uid("lib")),
      name: String(x.name || "Unnamed"),
      category: CATEGORY_OPTIONS.includes(x.category) ? x.category : "Custom",
      defaultQty: Number(x.defaultQty ?? 1) || 1,
      unit: String(x.unit || "ea"),
      rate: Number(x.rate ?? 0) || 0,
      status: STATUS_CONFIG[x.status] ? x.status : "included",
      note: String(x.note || ""),
    }));
  return cleaned.length ? cleaned : DEFAULT_PRICE_SHEET;
}

function loadSavedQuotes() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_SAVED_QUOTES_KEY) : null;
  const parsed = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeRooms(inputRooms) {
  if (!Array.isArray(inputRooms) || inputRooms.length === 0) return [];
  return inputRooms.map((room, index) => {
    const type = ROOM_TEMPLATES[room?.type] ? room.type : "customRoom";
    return {
      id: String(room?.id || uid("room")),
      type,
      name: String(room?.name || ROOM_TEMPLATES[type]?.label || `Room ${index + 1}`),
      notes: String(room?.notes || ""),
      areaSqft: Number(room?.areaSqft ?? 0) || 0,
      items: Array.isArray(room?.items) ? room.items : [],
    };
  });
}

// ---------- Component ----------
export default function RenovationEstimatorPage() {
  const [mode, setMode] = useState("estimate"); // 'estimate' | 'prices'
  const [showQuotes, setShowQuotes] = useState(false);

  const [priceSheet, setPriceSheet] = useState(() => loadPriceSheet());
  const [savedQuotes, setSavedQuotes] = useState(() => loadSavedQuotes());

  const [project, setProject] = useState(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_QUOTE_STATE_KEY) : null;
    const parsed = raw ? safeJsonParse(raw, null) : null;
    return {
      projectName: parsed?.project?.projectName || "EPF Pro Services - Home Renovation Quote",
      customerName: parsed?.project?.customerName || "",
      address: parsed?.project?.address || "",
      quoteDate: parsed?.project?.quoteDate || "",
      estimator: parsed?.project?.estimator || "EPF Pro Services",
      quoteNotes: parsed?.project?.quoteNotes || "",
      exclusionsNotes:
        parsed?.project?.exclusionsNotes ||
        "Final selections above allowance values are extra; selections below allowance receive a credit. Hidden conditions are excluded unless noted.",
      priceMode: parsed?.project?.priceMode === "locked" ? "locked" : "live",
      quoteNumber: parsed?.project?.quoteNumber || "",
      validDays: Number(parsed?.project?.validDays ?? 14) || 14,
      timeline: parsed?.project?.timeline || "",
      paymentSchedule:
        parsed?.project?.paymentSchedule ||
        "Deposit to book + progress payments + balance on completion.",
    };
  });

  const [pricing, setPricing] = useState(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_QUOTE_STATE_KEY) : null;
    const parsed = raw ? safeJsonParse(raw, null) : null;
    return {
      contingencyPercent:
        Number(parsed?.pricing?.contingencyPercent ?? PRICING_DEFAULTS.contingencyPercent) ||
        PRICING_DEFAULTS.contingencyPercent,
      markupPercent:
        Number(parsed?.pricing?.markupPercent ?? PRICING_DEFAULTS.markupPercent) ||
        PRICING_DEFAULTS.markupPercent,
      taxPercent:
        Number(parsed?.pricing?.taxPercent ?? PRICING_DEFAULTS.taxPercent) || PRICING_DEFAULTS.taxPercent,
    };
  });

  const [signature, setSignature] = useState(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_QUOTE_STATE_KEY) : null;
    const parsed = raw ? safeJsonParse(raw, null) : null;
    return {
      approved: !!parsed?.signature?.approved,
      signerName: parsed?.signature?.signerName || "",
      signerEmail: parsed?.signature?.signerEmail || "",
      signerDate: parsed?.signature?.signerDate || "",
      signatureDataUrl: parsed?.signature?.signatureDataUrl || "",
    };
  });

  const [rooms, setRooms] = useState(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_QUOTE_STATE_KEY) : null;
    const parsed = raw ? safeJsonParse(raw, null) : null;
    const normalized = normalizeRooms(parsed?.rooms);
    if (normalized.length) return normalized;
    return [
      {
        id: uid("room"),
        type: "bedroom1",
        name: "Bedroom 1",
        notes: "",
        areaSqft: 0,
        items: [],
      },
    ];
  });

  const [activeRoomId, setActiveRoomId] = useState(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_QUOTE_STATE_KEY) : null;
    const parsed = raw ? safeJsonParse(raw, null) : null;
    return parsed?.activeRoomId || rooms[0]?.id || "";
  });

  const [expandedCategories, setExpandedCategories] = useState(() => {
    const map = {};
    CATEGORY_OPTIONS.forEach((cat) => {
      map[cat] = true;
    });
    return map;
  });

  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [libraryPick, setLibraryPick] = useState({});
  const [showRoomScopePreview, setShowRoomScopePreview] = useState(true);
  const hasHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const fileInputRef = useRef(null);

  // ---------- Price Sheet mapping ----------
  const priceSheetById = useMemo(() => {
    const map = {};
    priceSheet.forEach((row) => {
      map[row.libId] = row;
    });
    return map;
  }, [priceSheet]);

  const makeItemFromPriceSheet = (libId) => {
    const row = priceSheetById[libId];
    if (!row) {
      return {
        id: uid("item"),
        sourceLibId: "",
        name: `Missing item: ${libId}`,
        category: "Custom",
        qty: 1,
        unit: "ea",
        rate: 0,
        status: "excluded",
        active: true,
        note: "Add manually",
      };
    }
    return {
      id: uid("item"),
      sourceLibId: row.libId,
      name: row.name,
      category: row.category,
      qty: Number(row.defaultQty ?? 1) || 1,
      unit: row.unit,
      rate: Number(row.rate ?? 0) || 0,
      status: row.status,
      active: true,
      note: row.note || "",
    };
  };

  // Manual item should become reusable
  const createManualAndAddToPriceSheet = (category) => {
    const libId = `${slugify(category)}-${slugify("new-item")}-${Date.now()}`;
    const newRow = {
      libId,
      name: "New item",
      category,
      defaultQty: 1,
      unit: "ea",
      rate: 0,
      status: "included",
      note: "",
    };
    setPriceSheet((prev) => [...prev, newRow]);
    return makeItemFromPriceSheet(libId);
  };

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || rooms[0] || null,
    [rooms, activeRoomId]
  );

  // ---------- Auto-save ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_PRICE_SHEET_KEY, JSON.stringify(priceSheet));
  }, [priceSheet]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_SAVED_QUOTES_KEY, JSON.stringify(savedQuotes));
  }, [savedQuotes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      LS_QUOTE_STATE_KEY,
      JSON.stringify({ project, pricing, signature, rooms, activeRoomId })
    );
  }, [project, pricing, signature, rooms, activeRoomId]);

  // ---------- Price Sheet -> Quote sync ----------
  useEffect(() => {
    if (project.priceMode === "locked") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRooms((prevRooms) => {
      let changed = false;
      const next = prevRooms.map((room) => {
        const nextItems = (room.items || []).map((it) => {
          if (!it.sourceLibId) return it;
          const row = priceSheetById[it.sourceLibId];
          if (!row) return it;
          const updated = {
            ...it,
            name: row.name,
            unit: row.unit,
            rate: Number(row.rate ?? 0) || 0,
            status: row.status,
            note: row.note || "",
            category: row.category,
          };
          const same =
            updated.name === it.name &&
            updated.unit === it.unit &&
            updated.rate === it.rate &&
            updated.status === it.status &&
            updated.note === it.note &&
            updated.category === it.category;
          if (!same) changed = true;
          return same ? it : updated;
        });
        return changed ? { ...room, items: nextItems } : room;
      });
      return changed ? next : prevRooms;
    });
  }, [priceSheetById, project.priceMode]);

  // ---------- Calculations ----------
  const computeRoomTotals = useCallback((room) => {
    const activeItems = (room.items || []).filter((i) => i.active);
    const pricedItems = activeItems.map((item) => {
      const total = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const counts = STATUS_CONFIG[item.status]?.countInTotal;
      return { ...item, total, counts };
    });

    const baseQuotedAmount = pricedItems.reduce((sum, item) => (item.counts ? sum + item.total : sum), 0);
    const includedOnlyAmount = pricedItems.reduce(
      (sum, item) => (item.status === "included" ? sum + item.total : sum),
      0
    );
    const allowanceOnlyAmount = pricedItems.reduce(
      (sum, item) => (item.status === "allowance" ? sum + item.total : sum),
      0
    );

    const contingency = baseQuotedAmount * (pricing.contingencyPercent / 100);
    const markup = (baseQuotedAmount + contingency) * (pricing.markupPercent / 100);
    const beforeTax = baseQuotedAmount + contingency + markup;
    const tax = beforeTax * (pricing.taxPercent / 100);
    const grandTotal = beforeTax + tax;
    const areaSqft = Number(room?.areaSqft ?? 0) || 0;
    const costPerSqft = areaSqft > 0 ? grandTotal / areaSqft : NaN;
    const benchmark = ROOM_TYPE_BENCHMARKS[room?.type] || ROOM_TYPE_BENCHMARKS.customRoom;
    const benchmarkStatus = benchmarkStatusFor(costPerSqft, benchmark);

    return {
      pricedItems,
      baseQuotedAmount,
      includedOnlyAmount,
      allowanceOnlyAmount,
      contingency,
      markup,
      beforeTax,
      tax,
      grandTotal,
      areaSqft,
      costPerSqft,
      benchmark,
      benchmarkStatus,
    };
  }, [pricing]);

  const roomTotals = useMemo(() => {
    const map = {};
    rooms.forEach((room) => {
      map[room.id] = computeRoomTotals(room);
    });
    return map;
  }, [rooms, computeRoomTotals]);

  const projectTotals = useMemo(() => {
    const sum = {
      baseQuotedAmount: 0,
      includedOnlyAmount: 0,
      allowanceOnlyAmount: 0,
      contingency: 0,
      markup: 0,
      beforeTax: 0,
      tax: 0,
      grandTotal: 0,
      areaSqft: 0,
      benchmarkWeightedMin: 0,
      benchmarkWeightedMax: 0,
      costPerSqft: NaN,
      benchmarkMin: NaN,
      benchmarkMax: NaN,
    };
    rooms.forEach((room) => {
      const t = roomTotals[room.id];
      if (!t) return;
      sum.baseQuotedAmount += t.baseQuotedAmount;
      sum.includedOnlyAmount += t.includedOnlyAmount;
      sum.allowanceOnlyAmount += t.allowanceOnlyAmount;
      sum.contingency += t.contingency;
      sum.markup += t.markup;
      sum.beforeTax += t.beforeTax;
      sum.tax += t.tax;
      sum.grandTotal += t.grandTotal;
      if (t.areaSqft > 0 && t.benchmark) {
        sum.areaSqft += t.areaSqft;
        sum.benchmarkWeightedMin += t.benchmark.min * t.areaSqft;
        sum.benchmarkWeightedMax += t.benchmark.max * t.areaSqft;
      }
    });
    if (sum.areaSqft > 0) {
      sum.costPerSqft = sum.grandTotal / sum.areaSqft;
      sum.benchmarkMin = sum.benchmarkWeightedMin / sum.areaSqft;
      sum.benchmarkMax = sum.benchmarkWeightedMax / sum.areaSqft;
    }
    return sum;
  }, [rooms, roomTotals]);

  function groupByCategory(items) {
    return items.reduce((acc, item) => {
      const key = item.category || "Custom";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  const filteredGroupedItems = useMemo(() => {
    if (!activeRoom) return {};
    const filtered = (activeRoom.items || [])
      .filter((item) => (showInactive ? true : item.active))
      .filter((item) => {
        if (!searchTerm.trim()) return true;
        const s = searchTerm.trim().toLowerCase();
        return (
          (item.name || "").toLowerCase().includes(s) ||
          (item.note || "").toLowerCase().includes(s) ||
          (item.category || "").toLowerCase().includes(s)
        );
      });
    return groupByCategory(filtered);
  }, [activeRoom, showInactive, searchTerm]);

  const activeRoomTotals = activeRoom ? roomTotals[activeRoom.id] : null;

  const activeRoomCategoryTotals = useMemo(() => {
    if (!activeRoomTotals) return [];
    const map = {};
    activeRoomTotals.pricedItems.forEach((it) => {
      const cat = it.category || "Custom";
      if (!map[cat]) map[cat] = { category: cat, included: 0, allowance: 0, counted: 0 };
      if (it.status === "included") map[cat].included += it.total;
      if (it.status === "allowance") map[cat].allowance += it.total;
      if (it.counts) map[cat].counted += it.total;
    });
    return Object.values(map).sort((a, b) => b.counted - a.counted);
  }, [activeRoomTotals]);

  // ---------- Updates ----------
  const updateProject = (key, value) => setProject((prev) => ({ ...prev, [key]: value }));
  const updatePricing = (key, value) => setPricing((prev) => ({ ...prev, [key]: Number(value) || 0 }));

  const addRoom = (templateKey) => {
    const tpl = ROOM_TEMPLATES[templateKey] || ROOM_TEMPLATES.customRoom;
    const room = {
      id: uid("room"),
      type: templateKey,
      name: tpl.label,
      notes: "",
      areaSqft: 0,
      items: [],
    };
    setRooms((prev) => [...prev, room]);
    setActiveRoomId(room.id);
    setShowRoomScopePreview(true);
  };

  const removeRoom = (roomId) => {
    const next = rooms.filter((room) => room.id !== roomId);
    setRooms(next);
    if (activeRoomId === roomId) setActiveRoomId(next[0]?.id || "");
  };

  const updateRoom = (roomId, patch) => {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, ...patch } : room)));
  };

  const updateRoomItem = (roomId, itemId, patch) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        const nextItems = (room.items || []).map((item) => {
          if (item.id !== itemId) return item;
          const nextItem = { ...item, ...patch };

          if (project.priceMode === "live" && nextItem.sourceLibId) {
            const allowedKeys = ["name", "unit", "rate", "status", "note", "category"];
            const shouldUpdateSheet = allowedKeys.some((k) =>
              Object.prototype.hasOwnProperty.call(patch, k)
            );
            if (shouldUpdateSheet) {
              setPriceSheet((prevSheet) =>
                prevSheet.map((row) => {
                  if (row.libId !== nextItem.sourceLibId) return row;
                  return {
                    ...row,
                    name: nextItem.name,
                    unit: nextItem.unit,
                    rate: Number(nextItem.rate) || 0,
                    status: STATUS_CONFIG[nextItem.status] ? nextItem.status : row.status,
                    note: nextItem.note || "",
                    category: CATEGORY_OPTIONS.includes(nextItem.category)
                      ? nextItem.category
                      : row.category,
                  };
                })
              );
            }
          }

          return nextItem;
        });
        return { ...room, items: nextItems };
      })
    );
  };

  const addRoomItem = (roomId, item) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return { ...room, items: [...(room.items || []), item] };
      })
    );
  };

  const removeRoomItem = (roomId, itemId) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return { ...room, items: (room.items || []).filter((item) => item.id !== itemId) };
      })
    );
  };

  const toggleCategory = (category) =>
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));

  const libraryOptionsForCategory = (category) =>
    priceSheet.filter((item) => item.category === category);

  const addFromList = (category) => {
    const libId = libraryPick[category];
    if (!libId || !activeRoom) return;
    addRoomItem(activeRoom.id, makeItemFromPriceSheet(libId));
  };

  const addManualItem = (category) => {
    if (!activeRoom) return;
    const item = createManualAndAddToPriceSheet(category);
    addRoomItem(activeRoom.id, item);
  };

  // ---------- Quote Library ----------
  const snapshotCurrentQuote = () => ({ project, pricing, signature, rooms, activeRoomId });

  const saveCurrentQuote = () => {
    const nameDefault = project.customerName
      ? `${project.customerName} - ${project.projectName}`
      : project.projectName;
    const name = window.prompt("Save quote name:", nameDefault);
    if (!name) return;
    const now = new Date().toISOString();
    const id = uid("quote");
    const entry = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      priceMode: project.priceMode,
      data: snapshotCurrentQuote(),
    };
    setSavedQuotes((prev) => [entry, ...prev]);
    alert("Saved! You can reopen it from Quotes.");
  };

  const overwriteCurrentQuote = () => {
    const id = window.prompt("Paste the Quote ID to overwrite (from Quotes list):");
    if (!id) return;
    const now = new Date().toISOString();
    setSavedQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, updatedAt: now, priceMode: project.priceMode, data: snapshotCurrentQuote() }
          : q
      )
    );
    alert("Updated saved quote.");
  };

  const loadQuote = (id) => {
    const q = savedQuotes.find((x) => x.id === id);
    if (!q) return;
    const data = q.data;
    if (!data) return;
    setProject(data.project);
    setPricing(data.pricing);
    setSignature(data.signature);
    setRooms(normalizeRooms(data.rooms));
    setActiveRoomId(data.activeRoomId);
    setShowQuotes(false);
  };

  const deleteQuote = (id) => {
    if (!window.confirm("Delete this saved quote?")) return;
    setSavedQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const duplicateQuote = (id) => {
    const q = savedQuotes.find((x) => x.id === id);
    if (!q) return;
    const now = new Date().toISOString();
    setSavedQuotes((prev) => [
      {
        ...q,
        id: uid("quote"),
        name: `${q.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
  };

  const renameQuote = (id) => {
    const q = savedQuotes.find((x) => x.id === id);
    if (!q) return;
    const name = window.prompt("New quote name:", q.name);
    if (!name) return;
    setSavedQuotes((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  const exportAllQuotes = () => {
    downloadText(
      `epf-reno-quotes-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(savedQuotes, null, 2)
    );
  };

  const importAllQuotes = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = safeJsonParse(String(reader.result || ""), null);
      if (!Array.isArray(parsed)) return;
      setSavedQuotes((prev) => [...parsed, ...prev]);
    };
    reader.readAsText(file);
  };

  // ---------- Price Sheet actions ----------
  const resetPriceSheet = () => setPriceSheet(DEFAULT_PRICE_SHEET);

  const exportPriceSheet = () => {
    downloadText(
      `epf-reno-price-sheet-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(priceSheet, null, 2)
    );
  };

  const importPriceSheet = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = safeJsonParse(String(reader.result || ""), null);
      if (!Array.isArray(parsed)) return;
      const cleaned = parsed
        .filter((x) => x && typeof x === "object")
        .map((x) => ({
          libId: String(x.libId || uid("lib")),
          name: String(x.name || "Unnamed"),
          category: CATEGORY_OPTIONS.includes(x.category) ? x.category : "Custom",
          defaultQty: Number(x.defaultQty ?? 1) || 1,
          unit: String(x.unit || "ea"),
          rate: Number(x.rate ?? 0) || 0,
          status: STATUS_CONFIG[x.status] ? x.status : "included",
          note: String(x.note || ""),
        }));
      if (cleaned.length) setPriceSheet(cleaned);
    };
    reader.readAsText(file);
  };

  const updatePriceRow = (libId, patch) => {
    setPriceSheet((prev) => prev.map((row) => (row.libId === libId ? { ...row, ...patch } : row)));
  };

  const addPriceRow = (category = "Custom") => {
    const libId = `${slugify(category)}-${Date.now()}`;
    setPriceSheet((prev) => [
      ...prev,
      {
        libId,
        name: "New price item",
        category,
        defaultQty: 1,
        unit: "ea",
        rate: 0,
        status: "included",
        note: "",
      },
    ]);
  };

  const removePriceRow = (libId) =>
    setPriceSheet((prev) => prev.filter((row) => row.libId !== libId));

  // ---------- PDF/Print (robust) ----------
  const buildPrintableHtml = () => {
    const now = new Date().toISOString().slice(0, 10);
    const roomsList = rooms.map((room) => room.name).join(", ");
    const projectSummary = roomsList
      ? `This proposal outlines renovation work for ${roomsList}, including demolition, trade coordination, waterproofing, finish installation, painting, and final detailing. The project is planned to deliver durable finishes with clean execution and code-conscious workmanship.`
      : "This proposal outlines the renovation scope, pricing, allowances, and schedule for the requested work.";

    const projectCategoryTotals = {};
    rooms.forEach((room) => {
      const t = roomTotals[room.id];
      (t?.pricedItems || []).forEach((item) => {
        if (!item.counts) return;
        const key = item.category || "Custom";
        projectCategoryTotals[key] = (projectCategoryTotals[key] || 0) + item.total;
      });
    });

    const categoryRows = Object.entries(projectCategoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([category, total]) => `
          <tr>
            <td>${escapeHtml(category)}</td>
            <td style="text-align:right; font-weight:700;">${currency(total)}</td>
          </tr>
        `
      )
      .join("");

    const categoryBreakdownHtml = categoryRows
      ? `
        <h3>Cost Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align:right;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      `
      : "";

    const printableRooms = rooms
      .map((room) => {
        const t = roomTotals[room.id];
        const items = t?.pricedItems || [];
        const hasScopeLines = items.length > 0;
        return { room, t, items, hasScopeLines };
      })
      .filter((x) => x.hasScopeLines);

    const roomsHtml = printableRooms
      .map(({ room, t, items }) => {
        const byCat = items.reduce((acc, it) => {
          const c = it.category || "Custom";
          if (!acc[c]) acc[c] = [];
          acc[c].push(it);
          return acc;
        }, {});

        const roomRateParts = [];
        if (t?.areaSqft > 0) {
          roomRateParts.push(`Area: ${t.areaSqft} sf`);
          roomRateParts.push(`Quote rate: ${ratePerSqft(t.costPerSqft)}`);
        }
        roomRateParts.push(
          `Similar projects: ${ratePerSqft(t?.benchmark?.min)} - ${ratePerSqft(t?.benchmark?.max)}`
        );
        roomRateParts.push(`Status: ${t?.benchmarkStatus || "-"}`);

        const categories = Object.keys(byCat).sort((a, b) => a.localeCompare(b));

        const catRows = categories
          .map((cat) => {
            const counted = (byCat[cat] || []).reduce(
              (sum, it) => (it.counts ? sum + (Number(it.total) || 0) : sum),
              0
            );
            return `
              <tr>
                <td>${escapeHtml(cat)}</td>
                <td style="text-align:right; font-weight:700;">${currency(counted)}</td>
              </tr>
            `;
          })
          .join("");

        const catHtml = categories
          .map((cat) => {
            const rows = byCat[cat]
              .map((it) => {
                const line = it.counts ? currency(it.total) : "-";
                return `
                  <tr>
                    <td>${escapeHtml(it.name)}</td>
                    <td style="text-align:right;">${escapeHtml(it.qty)}</td>
                    <td>${escapeHtml(it.unit)}</td>
                    <td style="text-align:right;">${escapeHtml(currency(it.rate))}</td>
                    <td>${escapeHtml(STATUS_CONFIG[it.status]?.label || it.status)}</td>
                    <td style="text-align:right; font-weight:700;">${escapeHtml(line)}</td>
                    <td>${escapeHtml(it.note || "")}</td>
                  </tr>
                `;
              })
              .join("");

            return `
              <h4 style="margin: 16px 0 8px; font-size: 13px;">${escapeHtml(cat)}</h4>
              <table>
                <thead>
                  <tr>
                    <th style="width:28%">Item</th>
                    <th style="width:7%">Qty</th>
                    <th style="width:7%">Unit</th>
                    <th style="width:10%">Rate</th>
                    <th style="width:10%">Status</th>
                    <th style="width:10%">Line total</th>
                    <th style="width:28%">Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            `;
          })
          .join("");

        return `
          <section class="room-section" style="margin-top: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px;">
              <div>
                <div style="font-size:16px; font-weight:900;">${escapeHtml(room.name)}</div>
                <div style="font-size:12px; color:#334155;">${escapeHtml(
                  ROOM_TEMPLATES[room.type]?.description || ""
                )}</div>
                <div style="font-size:12px; color:#334155;">${escapeHtml(roomRateParts.join(" | "))}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px; font-weight:700; color:#0f172a;">Room total</div>
                <div style="font-size:18px; font-weight:900;">${currency(t?.grandTotal || 0)}</div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:12px;">
              <div class="box"><div class="k">Included</div><div class="v">${currency(t?.includedOnlyAmount || 0)}</div></div>
              <div class="box"><div class="k">Allowances</div><div class="v">${currency(t?.allowanceOnlyAmount || 0)}</div></div>
              <div class="box"><div class="k">Before tax</div><div class="v">${currency(t?.beforeTax || 0)}</div></div>
            </div>

            <h4 style="margin: 16px 0 8px; font-size: 13px;">Room Category Summary</h4>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="text-align:right;">Cost</th>
                </tr>
              </thead>
              <tbody>
                ${catRows || `<tr><td colspan="2">No active priced lines</td></tr>`}
              </tbody>
            </table>

            <div style="margin-top:12px; font-size:12px; color:#0f172a;"><strong>Room notes:</strong> ${escapeHtml(
              room.notes || "-"
            )}</div>

            ${catHtml}
          </section>
        `;
      })
      .join("");

    const roomScopeSectionHtml = roomsHtml
      ? `
          <h3 style="margin-top:24px;">Room Scope Details</h3>
          ${roomsHtml}
        `
      : `
          <section class="section callout">
            <h4>Room Scope Details</h4>
            No room scope lines were added to this quote yet.
          </section>
        `;

    const signatureImg = signature.signatureDataUrl
      ? `<div style="margin-top:10px;"><div class="k">Signature</div><img src="${signature.signatureDataUrl}" style="max-height:90px; border:1px solid #0f172a; border-radius:8px; padding:6px;" /></div>`
      : "";

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>EPF Renovation Quote ${escapeHtml(now)}</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 28px; color:#0f172a; }
            .hero { border: 2px solid #0f172a; border-radius: 14px; padding: 18px; background: linear-gradient(135deg, #f8fafc, #eef2ff); }
            .hero h1 { margin: 0; font-size: 28px; font-weight: 900; }
            .muted { color:#334155; font-size:12px; }
            .grid2 { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .grid4 { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
            .box { border: 1px solid #0f172a; border-radius: 10px; padding: 10px; background: #fff; }
            .k { font-size: 11px; font-weight: 800; color:#334155; text-transform: uppercase; letter-spacing: .6px; }
            .v { font-size: 14px; font-weight: 900; margin-top: 4px; }
            .totalBox { border: 2px solid #0f172a; border-radius: 12px; padding: 14px; margin-top: 14px; background: #0f172a; color: #fff; }
            .totalValue { font-size: 34px; font-weight: 900; margin-top: 6px; }
            .section { margin-top: 18px; }
            h3 { margin: 0 0 10px; font-size: 16px; font-weight: 900; }
            h4 { margin: 0 0 8px; font-size: 14px; font-weight: 800; }
            ul { margin: 0; padding-left: 18px; }
            li { margin: 4px 0; font-size: 12px; }
            .notes { white-space: pre-wrap; border: 1px solid #0f172a; border-radius: 10px; padding: 10px; font-size: 12px; margin-top: 8px; }
            .callout { border: 1px solid #0f172a; border-radius: 10px; padding: 10px; background: #f8fafc; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #0f172a; border-radius: 10px; overflow: hidden; }
            thead th { background:#0f172a; color:#fff; font-size: 11px; text-align: left; padding: 8px; }
            tbody td { border-top: 1px solid #0f172a; font-size: 11px; padding: 8px; vertical-align: top; }
            .footer { margin-top: 20px; font-size: 11px; color:#334155; border-top: 1px solid #cbd5e1; padding-top: 10px; }
            @media print {
              body { margin: 10mm; }
              .hero { page-break-inside: avoid; break-inside: avoid-page; }
              h3, h4 { page-break-after: avoid; break-after: avoid-page; }
              .room-section { page-break-inside: auto; break-inside: auto; }
              table { page-break-inside: auto; break-inside: auto; }
              tr { page-break-inside: avoid; break-inside: avoid; }
              /* Avoid print engine column-fragment glitches that can create blank pages */
              .grid2, .grid4 { display: block; }
              .grid2 .box, .grid4 .box { margin-top: 8px; }
            }
          </style>
        </head>
        <body>
          <section class="hero">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
              <div>
                <h1>${escapeHtml(project.projectName || "Bathroom Renovation Proposal")}</h1>
                <div class="muted" style="margin-top:8px;"><strong>Prepared for:</strong> ${escapeHtml(project.customerName || "Client Name")}</div>
                <div class="muted"><strong>Property address:</strong> ${escapeHtml(project.address || "Property Address")}</div>
                <div class="muted" style="margin-top:8px;"><strong>Prepared by:</strong> EPF Pro Services</div>
                <div class="muted"><strong>Estimator:</strong> ${escapeHtml(project.estimator || "Alex")} | <strong>Date:</strong> ${escapeHtml(project.quoteDate || now)}</div>
              </div>
              <div class="muted" style="text-align:right;">
                <div><strong>Quote #:</strong> ${escapeHtml(project.quoteNumber || "-")}</div>
                <div><strong>Validity:</strong> ${escapeHtml(String(project.validDays || 14))} days</div>
              </div>
            </div>
            <div class="section grid2">
              <div class="box">
                <h4>What You Get</h4>
                <ul>
                  <li>&check; Fully insured contractor</li>
                  <li>&check; Dust-control setup</li>
                  <li>&check; Professional renovation crew</li>
                  <li>&check; 12-month workmanship warranty</li>
                </ul>
              </div>
              <div class="box">
                <h4>Project Summary</h4>
                <div style="font-size:12px; color:#334155;">${escapeHtml(projectSummary)}</div>
              </div>
            </div>
          </section>

          <section class="section totalBox">
            <div class="k" style="color:#cbd5e1;">Project total</div>
            <div class="totalValue">${currency(projectTotals.grandTotal)}</div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:6px;">
              Includes labour, standard materials, site protection, and cleanup.
            </div>
          </section>

          <section class="section grid4">
            <div class="box"><div class="k">Included work</div><div class="v">${currency(projectTotals.includedOnlyAmount)}</div></div>
            <div class="box"><div class="k">Allowances</div><div class="v">${currency(projectTotals.allowanceOnlyAmount)}</div></div>
            <div class="box"><div class="k">Before tax</div><div class="v">${currency(projectTotals.beforeTax)}</div></div>
            <div class="box"><div class="k">HST</div><div class="v">${currency(projectTotals.tax)}</div></div>
          </section>

          <section class="section callout">
            <h4>Allowance Explanation</h4>
            Allowances are budget placeholders for items selected later (for example tile, fixtures, fan). If selections exceed allowance values, only the difference is added. If selections are lower, you receive a credit.
          </section>

          ${categoryBreakdownHtml}

          <section class="section grid2">
            <div class="box">
              <h4>Why Clients Choose EPF Pro Services</h4>
              <ul>
                <li>&check; Professional dust protection</li>
                <li>&check; Experienced renovation crew</li>
                <li>&check; Clear pricing with documented scope</li>
                <li>&check; Respect for your home and schedule</li>
              </ul>
            </div>
            <div class="box">
              <h4>Typical Project Timeline</h4>
              <div style="font-size:12px;">${escapeHtml(project.timeline || "Bathroom renovation: estimated 5-7 working days, subject to scope and material lead times.")}</div>
              <h4 style="margin-top:12px;">Project Outcome</h4>
              <ul>
                <li>Fully waterproofed wet area</li>
                <li>Professional tile and finish installation</li>
                <li>Proper ventilation and plumbing functionality</li>
                <li>Clean completed surfaces ready for use</li>
              </ul>
            </div>
          </section>

          ${roomScopeSectionHtml}

          <section class="section grid2">
            <div class="box">
              <h4>Payment Schedule</h4>
              <ul>
                <li>Deposit to reserve project date - 30%</li>
                <li>Mid-project progress payment - 40%</li>
                <li>Final payment after completion - 30%</li>
              </ul>
              <div style="font-size:12px; margin-top:8px;"><strong>Custom note:</strong> ${escapeHtml(project.paymentSchedule || "-")}</div>
            </div>
            <div class="box">
              <h4>Workmanship Warranty</h4>
              <div style="font-size:12px;">EPF Pro Services provides a 12-month workmanship warranty on installation and labour. Materials are covered by manufacturer warranties.</div>
            </div>
          </section>

          <section class="section">
            <h3>Project Approval</h3>
            <div class="notes">
              Client name: ${escapeHtml(signature.signerName || "________________________")}\n\n
              Signature: ________________________\n\n
              Date: ${escapeHtml(signature.signerDate || "________________________")}\n\n
              Start date target: ________________________
            </div>
            ${signatureImg}
          </section>

          <section class="section">
            <h3>Project Notes</h3>
            <div class="notes">${escapeHtml(project.quoteNotes || "-")}</div>
            <div class="notes" style="margin-top:8px;">${escapeHtml(project.exclusionsNotes || "-")}</div>
          </section>

          <section class="section">
            <h3>Recent Bathroom Projects</h3>
            <div class="grid2">
              <div class="box" style="height:90px; display:flex; align-items:center; justify-content:center; color:#64748b;">Photo placeholder</div>
              <div class="box" style="height:90px; display:flex; align-items:center; justify-content:center; color:#64748b;">Photo placeholder</div>
            </div>
          </section>

          <footer class="footer">
            EPF Pro Services | Bathroom Renovation Specialists | Phone: 647-923-6784 | Email: info@epfproservices.com | Website: epfproservices.com
          </footer>
        </body>
      </html>
    `;
  };

  const handlePrintPdf = () => {
    const html = buildPrintableHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const w = window.open(url, "_blank", "noopener,noreferrer");

    if (!w) {
      alert("Pop-up blocked. Allow pop-ups for this site, then use Print / Save PDF.");
      URL.revokeObjectURL(url);
      return;
    }

    const tryPrint = () => {
      try {
        w.focus();
        w.print();
      } catch {}
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    w.onload = () => setTimeout(tryPrint, 300);
    setTimeout(tryPrint, 900);
  };

  // ---------- Signature upload ----------
  const handleSignatureFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setSignature((prev) => ({ ...prev, signatureDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  // ---------- UI ----------
  const updateProjectLocal = (key, value) => updateProject(key, value);

  if (!hasHydrated) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-4 pb-28 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-3xl bg-slate-900 p-6 shadow-sm text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs tracking-widest font-bold text-slate-200">EPF PRO SERVICES</div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Renovation Estimator</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-200">
                  Separate estimator module. Existing tools remain unchanged.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Back To Toolbox
                </Link>
                <Button
                  variant="outline"
                  className={`rounded-2xl ${
                    mode === "estimate"
                      ? "border-white bg-white text-slate-900 hover:bg-white"
                      : "border-slate-200 bg-transparent text-white hover:bg-slate-800"
                  }`}
                  onClick={() => setMode("estimate")}
                >
                  <Calculator className="mr-2 h-4 w-4" /> Estimate Builder
                </Button>
                <Button
                  variant="outline"
                  className={`rounded-2xl ${
                    mode === "prices"
                      ? "border-white bg-white text-slate-900 hover:bg-white"
                      : "border-slate-200 bg-transparent text-white hover:bg-slate-800"
                  }`}
                  onClick={() => setMode("prices")}
                >
                  <Sheet className="mr-2 h-4 w-4" /> Price Sheet
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-slate-200 text-white hover:bg-slate-800"
                  onClick={() => setShowQuotes(true)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" /> Quotes
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-slate-200 text-white hover:bg-slate-800"
                  onClick={saveCurrentQuote}
                >
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </div>
          </div>

          {showQuotes ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-4xl rounded-3xl bg-white shadow-lg border-2 border-slate-300">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">Saved Quotes</div>
                    <div className="text-sm text-slate-600">
                      Open, duplicate, rename, delete. Export/import if you switch laptops.
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowQuotes(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={exportAllQuotes}>
                      <Download className="mr-2 h-4 w-4" /> Export Quotes
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => document.getElementById("epfQuotesImport")?.click?.()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Import Quotes
                    </Button>
                    <input
                      id="epfQuotesImport"
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => importAllQuotes(e.target.files?.[0])}
                    />
                    <Button variant="outline" className="rounded-2xl" onClick={overwriteCurrentQuote}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Overwrite by ID
                    </Button>
                  </div>

                  {savedQuotes.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-slate-600">
                      No saved quotes yet. Click <strong>Save</strong> to store this one.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                      {savedQuotes.map((q) => (
                        <div key={q.id} className="rounded-2xl border-2 border-slate-300 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-extrabold text-slate-900">{q.name}</div>
                              <div className="text-xs text-slate-600">
                                ID: <span className="font-mono">{q.id}</span> - Created: {String(q.createdAt || "").slice(0, 10)} - Updated: {String(q.updatedAt || "").slice(0, 10)} - Mode: {q.priceMode === "locked" ? "LOCKED" : "LIVE"}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button className="rounded-2xl" onClick={() => loadQuote(q.id)}>
                                Open
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => duplicateQuote(q.id)}
                              >
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </Button>
                              <Button variant="outline" className="rounded-2xl" onClick={() => renameQuote(q.id)}>
                                Rename
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-2xl text-red-700"
                                onClick={() => deleteQuote(q.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {mode === "prices" ? (
            <Card className="rounded-3xl shadow-sm border-2 border-slate-300">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sheet className="h-5 w-5" /> Price Sheet (auto-saved)
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-2xl" onClick={() => addPriceRow("Custom")}>
                    <Plus className="mr-2 h-4 w-4" /> Add Row
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={exportPriceSheet}>
                    <Download className="mr-2 h-4 w-4" /> Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => fileInputRef.current?.click?.()}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Import JSON
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => importPriceSheet(e.target.files?.[0])}
                  />
                  <Button variant="outline" className="rounded-2xl text-red-600" onClick={resetPriceSheet}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset Defaults
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
                  Edit any row here and your estimates update instantly (in LIVE mode). Manual items you add in
                  estimates also appear here automatically.
                </div>

                <div className="overflow-x-auto rounded-2xl border-2 border-slate-300">
                  <div className="min-w-[1200px]">
                    <div className="grid grid-cols-12 gap-2 bg-slate-900 px-3 py-3 text-xs font-extrabold text-white">
                      <div className="col-span-2">Category</div>
                      <div className="col-span-3">Name</div>
                      <div className="col-span-1 text-right">Default Qty</div>
                      <div className="col-span-1">Unit</div>
                      <div className="col-span-1 text-right">Rate</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Note</div>
                      <div className="col-span-0 text-right">Remove</div>
                    </div>

                    {priceSheet.map((row) => (
                      <div
                        key={row.libId}
                        className="grid grid-cols-12 gap-2 border-t border-slate-300 bg-white px-3 py-3 text-sm"
                      >
                        <div className="col-span-2">
                          <Select value={row.category} onValueChange={(v) => updatePriceRow(row.libId, { category: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input value={row.name} onChange={(e) => updatePriceRow(row.libId, { name: e.target.value })} />
                          <div className="mt-1 text-[11px] text-slate-500">ID: {row.libId}</div>
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            className="text-right"
                            value={row.defaultQty}
                            onChange={(e) => updatePriceRow(row.libId, { defaultQty: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-span-1">
                          <Input value={row.unit} onChange={(e) => updatePriceRow(row.libId, { unit: e.target.value })} />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            className="text-right"
                            value={row.rate}
                            onChange={(e) => updatePriceRow(row.libId, { rate: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Select value={row.status} onValueChange={(v) => updatePriceRow(row.libId, { status: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <SelectItem key={key} value={key}>
                                  {cfg.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div
                            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${
                              STATUS_CONFIG[row.status]?.badgeClass || ""
                            }`}
                          >
                            {STATUS_CONFIG[row.status]?.label || "-"}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Input value={row.note} onChange={(e) => updatePriceRow(row.libId, { note: e.target.value })} />
                        </div>
                        <div className="col-span-0 flex items-center justify-end">
                          <Button variant="ghost" size="icon" onClick={() => removePriceRow(row.libId)} title="Remove row">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card className="rounded-3xl shadow-sm border-2 border-slate-300 xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Home className="h-5 w-5" /> Project Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={project.projectName}
                        onChange={(e) => updateProjectLocal("projectName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quote Date</Label>
                      <Input
                        type="date"
                        value={project.quoteDate}
                        onChange={(e) => updateProjectLocal("quoteDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input
                        value={project.customerName}
                        onChange={(e) => updateProjectLocal("customerName", e.target.value)}
                        placeholder="Client name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Address</Label>
                      <Input
                        value={project.address}
                        onChange={(e) => updateProjectLocal("address", e.target.value)}
                        placeholder="Job site address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quote # (optional)</Label>
                      <Input
                        value={project.quoteNumber}
                        onChange={(e) => updateProjectLocal("quoteNumber", e.target.value)}
                        placeholder="EPF-2026-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimator</Label>
                      <Input
                        value={project.estimator}
                        onChange={(e) => updateProjectLocal("estimator", e.target.value)}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Search active room scope</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search items, notes, category"
                          />
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-3">
                          <Checkbox checked={showInactive} onCheckedChange={(v) => setShowInactive(!!v)} />
                          <span className="text-sm text-slate-700">Show inactive</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Price Mode</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={project.priceMode === "live" ? "default" : "outline"}
                          className="rounded-2xl"
                          onClick={() => updateProjectLocal("priceMode", "live")}
                        >
                          <Unlock className="mr-2 h-4 w-4" /> LIVE
                        </Button>
                        <Button
                          type="button"
                          variant={project.priceMode === "locked" ? "default" : "outline"}
                          className="rounded-2xl"
                          onClick={() => updateProjectLocal("priceMode", "locked")}
                        >
                          <Lock className="mr-2 h-4 w-4" /> LOCKED
                        </Button>
                      </div>
                      <div className="text-xs text-slate-600">
                        LIVE = prices follow Price Sheet. LOCKED = this quote stays the same even if prices are
                        updated.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Quote valid (days)</Label>
                      <Input
                        type="number"
                        value={project.validDays}
                        onChange={(e) => updateProjectLocal("validDays", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Timeline (optional)</Label>
                      <Input
                        value={project.timeline}
                        onChange={(e) => updateProjectLocal("timeline", e.target.value)}
                        placeholder="Example: 2-3 working days"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Payment schedule (optional)</Label>
                      <Input
                        value={project.paymentSchedule}
                        onChange={(e) => updateProjectLocal("paymentSchedule", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm border-2 border-slate-300">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calculator className="h-5 w-5" /> Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-slate-900 p-5 text-white">
                      <p className="text-xs uppercase tracking-wide text-slate-200 font-bold">Client-facing total</p>
                      <p className="mt-2 text-3xl font-extrabold">{currency(projectTotals.grandTotal)}</p>
                      <p className="mt-1 text-sm text-slate-200">
                        Project rate: {ratePerSqft(projectTotals.costPerSqft)} · Area: {projectTotals.areaSqft || 0} sf
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Similar projects: {ratePerSqft(projectTotals.benchmarkMin)} -{" "}
                        {ratePerSqft(projectTotals.benchmarkMax)}
                      </p>
                      <p className="mt-2 text-sm text-slate-200">
                        If Print opens nothing, pop-ups are blocked. Allow pop-ups for localhost.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="rounded-2xl border-white bg-white text-slate-900 hover:bg-white"
                          onClick={handlePrintPdf}
                        >
                          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-white text-white hover:bg-slate-800"
                          onClick={saveCurrentQuote}
                        >
                          <Save className="mr-2 h-4 w-4" /> Save Quote
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-900">
                      <div className="flex justify-between">
                        <span>Included work</span>
                        <span className="font-semibold">{currency(projectTotals.includedOnlyAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances in total</span>
                        <span className="font-semibold">{currency(projectTotals.allowanceOnlyAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base quoted amount</span>
                        <span className="font-semibold">{currency(projectTotals.baseQuotedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contingency ({pricing.contingencyPercent}%)</span>
                        <span className="font-semibold">{currency(projectTotals.contingency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Markup ({pricing.markupPercent}%)</span>
                        <span className="font-semibold">{currency(projectTotals.markup)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HST ({pricing.taxPercent}%)</span>
                        <span className="font-semibold">{currency(projectTotals.tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Project $/sf</span>
                        <span className="font-semibold">{ratePerSqft(projectTotals.costPerSqft)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Similar projects average</span>
                        <span className="font-semibold">
                          {ratePerSqft(projectTotals.benchmarkMin)} - {ratePerSqft(projectTotals.benchmarkMax)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-extrabold">
                        <span>Total before tax</span>
                        <span>{currency(projectTotals.beforeTax)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Contingency %</Label>
                        <Input
                          type="number"
                          value={pricing.contingencyPercent}
                          onChange={(e) => updatePricing("contingencyPercent", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Markup %</Label>
                        <Input
                          type="number"
                          value={pricing.markupPercent}
                          onChange={(e) => updatePricing("markupPercent", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>HST %</Label>
                        <Input
                          type="number"
                          value={pricing.taxPercent}
                          onChange={(e) => updatePricing("taxPercent", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-3xl shadow-sm border-2 border-slate-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <LayoutGrid className="h-5 w-5" /> Room Planner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Add rooms</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                      {Object.entries(ROOM_TEMPLATES).map(([key, template]) => (
                        <Button
                          key={key}
                          variant="outline"
                          className="justify-start rounded-2xl border-2 border-slate-300"
                          onClick={() => addRoom(key)}
                        >
                          <Plus className="mr-2 h-4 w-4" /> {template.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Rooms in this project</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rooms.map((room) => {
                        const active = room.id === activeRoomId;
                        const t = roomTotals[room.id];
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => {
                              setActiveRoomId(room.id);
                              setShowRoomScopePreview(true);
                            }}
                            className={`rounded-2xl border-2 px-4 py-3 text-left ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-900"
                            }`}
                          >
                            <div className="text-sm font-extrabold">{room.name}</div>
                            <div className={`text-xs ${active ? "text-slate-200" : "text-slate-600"}`}>
                              Total: {currency(t?.grandTotal || 0)}
                            </div>
                            <div className={`text-xs ${active ? "text-slate-200" : "text-slate-600"}`}>
                              Area: {Number(room.areaSqft || 0)} sf · {ratePerSqft(t?.costPerSqft)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeRoom && activeRoomTotals ? (
                    <div className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-600">ACTIVE ROOM</div>
                          <div className="text-xl font-extrabold text-slate-900">{activeRoom.name}</div>
                          <div className="text-sm text-slate-600">
                            {ROOM_TEMPLATES[activeRoom.type]?.description || ""}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl border-2 border-slate-300 p-3">
                            <div className="text-[11px] font-bold text-slate-600">Included</div>
                            <div className="text-lg font-extrabold">{currency(activeRoomTotals.includedOnlyAmount)}</div>
                          </div>
                          <div className="rounded-2xl border-2 border-slate-300 p-3">
                            <div className="text-[11px] font-bold text-slate-600">Allowances</div>
                            <div className="text-lg font-extrabold">{currency(activeRoomTotals.allowanceOnlyAmount)}</div>
                          </div>
                          <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-3 text-white">
                            <div className="text-[11px] font-bold text-slate-200">Room total</div>
                            <div className="text-lg font-extrabold">{currency(activeRoomTotals.grandTotal)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl border-2 border-slate-300 p-3">
                          <div className="text-[11px] font-bold text-slate-600">Room area (sf)</div>
                          <Input
                            type="number"
                            min="0"
                            value={activeRoom.areaSqft || 0}
                            onChange={(e) => updateRoom(activeRoom.id, { areaSqft: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="rounded-2xl border-2 border-slate-300 p-3">
                          <div className="text-[11px] font-bold text-slate-600">Your quote rate</div>
                          <div className="text-lg font-extrabold">{ratePerSqft(activeRoomTotals.costPerSqft)}</div>
                        </div>
                        <div className="rounded-2xl border-2 border-slate-300 p-3">
                          <div className="text-[11px] font-bold text-slate-600">Market average</div>
                          <div className="text-sm font-bold text-slate-900">
                            {ratePerSqft(activeRoomTotals.benchmark?.min)} - {ratePerSqft(activeRoomTotals.benchmark?.max)}
                          </div>
                          <div className="text-xs text-slate-600">{activeRoomTotals.benchmarkStatus}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border-2 border-slate-300 p-4">
                          <div className="font-extrabold text-slate-900">Category breakdown</div>
                          <div className="mt-3 space-y-2">
                            {activeRoomCategoryTotals.slice(0, 8).map((row) => (
                              <div key={row.category} className="flex items-center justify-between text-sm">
                                <div className="text-slate-700">{row.category}</div>
                                <div className="font-bold text-slate-900">{currency(row.counted)}</div>
                              </div>
                            ))}
                            {activeRoomCategoryTotals.length > 8 ? (
                              <div className="text-xs text-slate-500">
                                + {activeRoomCategoryTotals.length - 8} more categories
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-2xl border-2 border-slate-300 p-4">
                          <div className="flex items-center justify-between">
                            <div className="font-extrabold text-slate-900">Room scope preview</div>
                            <Button
                              variant="outline"
                              className="rounded-2xl border-2 border-slate-300"
                              onClick={() => setShowRoomScopePreview((v) => !v)}
                            >
                              {showRoomScopePreview ? "Hide" : "Show"}
                            </Button>
                          </div>
                          {showRoomScopePreview ? (
                            <div className="mt-3 space-y-2 max-h-56 overflow-auto">
                              {activeRoomTotals.pricedItems.slice(0, 20).map((it) => (
                                <div key={it.id} className="flex items-start justify-between gap-2 text-sm">
                                  <div className="text-slate-800">
                                    <div className="font-medium">{it.name}</div>
                                    <div className="text-xs text-slate-500">{it.category}</div>
                                  </div>
                                  <div
                                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                                      STATUS_CONFIG[it.status]?.badgeClass || ""
                                    }`}
                                  >
                                    {STATUS_CONFIG[it.status]?.label}
                                  </div>
                                </div>
                              ))}
                              {activeRoomTotals.pricedItems.length > 20 ? (
                                <div className="text-xs text-slate-500">
                                  Showing first 20 lines. Full list below in the Scope Builder.
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-slate-600">Scope preview hidden.</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label>Active room notes</Label>
                        <Textarea
                          value={activeRoom.notes}
                          onChange={(e) => updateRoom(activeRoom.id, { notes: e.target.value })}
                          className="min-h-[80px]"
                          placeholder="Room-specific notes, access, hidden conditions, finish level, etc."
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-slate-600">
                          The Scope Builder below edits the active room only.
                        </div>
                        {rooms.length > 1 ? (
                          <Button
                            variant="outline"
                            className="rounded-2xl border-2 border-slate-300 text-red-700"
                            onClick={() => removeRoom(activeRoom.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove active room
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm border-2 border-slate-300">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calculator className="h-5 w-5" /> Scope Builder
                  </CardTitle>
                  {activeRoomTotals ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full">Active: {activeRoom?.name}</Badge>
                      <Badge className="rounded-full">Room total: {currency(activeRoomTotals.grandTotal)}</Badge>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-sm text-slate-800">
                    <div className="font-extrabold text-slate-900">How to use allowances</div>
                    <div className="mt-1 text-slate-700">
                      Allowance = budget placeholder. Usually covers supply only unless note says supply + install.
                    </div>
                  </div>

                  {CATEGORY_OPTIONS.map((category) => {
                    const isOpen = !!expandedCategories[category];
                    const items = filteredGroupedItems[category] || [];
                    const options = libraryOptionsForCategory(category);

                    return (
                      <div key={category} className="rounded-2xl border-2 border-slate-300 bg-white">
                        <div className="flex w-full flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left"
                            onClick={() => toggleCategory(category)}
                          >
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-extrabold text-slate-900">{category}</span>
                            <span className="text-xs text-slate-600">({items.length} items shown)</span>
                          </button>

                          <div className="flex flex-wrap gap-2">
                            <Select
                              value={libraryPick[category] || ""}
                              onValueChange={(v) => setLibraryPick((prev) => ({ ...prev, [category]: v }))}
                            >
                              <SelectTrigger className="w-[320px] border-2 border-slate-300">
                                <SelectValue placeholder="Choose item from Price Sheet" />
                              </SelectTrigger>
                              <SelectContent>
                                {options.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No Price Sheet items
                                  </SelectItem>
                                ) : (
                                  options.map((opt) => (
                                    <SelectItem key={opt.libId} value={opt.libId}>
                                      {opt.name} - {currency(opt.rate)} / {opt.unit}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              className="rounded-2xl border-2 border-slate-300"
                              onClick={() => addFromList(category)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                            <Button className="rounded-2xl" onClick={() => addManualItem(category)}>
                              <PenLine className="mr-2 h-4 w-4" /> Manual
                            </Button>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="px-4 pb-4">
                            {items.length === 0 ? (
                              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                No items in this category yet for the active room.
                              </div>
                            ) : (
                              <>
                                <div className="space-y-3 md:hidden">
                                  {items.map((item) => {
                                    const total = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.excluded;
                                    const counts = STATUS_CONFIG[item.status]?.countInTotal;
                                    return (
                                      <div key={item.id} className="rounded-2xl border-2 border-slate-300 p-3">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <Checkbox
                                              checked={item.active}
                                              onCheckedChange={(v) =>
                                                updateRoomItem(activeRoom.id, item.id, { active: !!v })
                                              }
                                            />
                                            <span className="text-xs text-slate-600">{item.sourceLibId ? "Saved item" : "Manual item"}</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRoomItem(activeRoom.id, item.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>

                                        <div className="space-y-2">
                                          <Input
                                            value={item.name}
                                            onChange={(e) =>
                                              updateRoomItem(activeRoom.id, item.id, { name: e.target.value })
                                            }
                                          />

                                          <div className="grid grid-cols-3 gap-2">
                                            <Input
                                              type="number"
                                              value={item.qty}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, {
                                                  qty: Number(e.target.value) || 0,
                                                })
                                              }
                                            />
                                            <Input
                                              value={item.unit}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, { unit: e.target.value })
                                              }
                                            />
                                            <Input
                                              type="number"
                                              value={item.rate}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, {
                                                  rate: Number(e.target.value) || 0,
                                                })
                                              }
                                            />
                                          </div>

                                          <Select
                                            value={item.status}
                                            onValueChange={(v) =>
                                              updateRoomItem(activeRoom.id, item.id, { status: v })
                                            }
                                          >
                                            <SelectTrigger className="border-2 border-slate-300">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                <SelectItem key={key} value={key}>
                                                  {cfg.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>

                                          <div className="flex items-center justify-between">
                                            <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusCfg.badgeClass}`}>
                                              {statusCfg.label}
                                            </div>
                                            <div className="text-right">
                                              <div className="text-sm font-extrabold text-slate-900">{currency(total)}</div>
                                              <div className="text-[11px] text-slate-600">
                                                {counts ? "in total" : "not in total"}
                                              </div>
                                            </div>
                                          </div>

                                          <Input
                                            value={item.note}
                                            onChange={(e) =>
                                              updateRoomItem(activeRoom.id, item.id, { note: e.target.value })
                                            }
                                            placeholder="Explain scope / allowance"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="hidden md:block overflow-x-auto rounded-2xl border-2 border-slate-300">
                                  <div className="min-w-[1250px]">
                                    <div className="grid grid-cols-12 gap-2 bg-slate-900 px-3 py-3 text-xs font-extrabold text-white">
                                      <div className="col-span-1">Use</div>
                                      <div className="col-span-2">Item</div>
                                      <div className="col-span-1 text-right">Qty</div>
                                      <div className="col-span-1">Unit</div>
                                      <div className="col-span-1 text-right">Rate</div>
                                      <div className="col-span-2">Status</div>
                                      <div className="col-span-1 text-right">Line Total</div>
                                      <div className="col-span-3">Client note</div>
                                      <div className="col-span-1 text-right">Remove</div>
                                    </div>

                                    {items.map((item, idx) => {
                                      const total = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                      const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.excluded;
                                      const counts = STATUS_CONFIG[item.status]?.countInTotal;
                                      const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                                      return (
                                        <div
                                          key={item.id}
                                          className={`grid grid-cols-12 gap-2 border-t border-slate-300 px-3 py-3 text-sm ${zebra}`}
                                        >
                                          <div className="col-span-1 flex items-center">
                                            <Checkbox
                                              checked={item.active}
                                              onCheckedChange={(v) =>
                                                updateRoomItem(activeRoom.id, item.id, { active: !!v })
                                              }
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Input
                                              value={item.name}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, { name: e.target.value })
                                              }
                                            />
                                            {item.sourceLibId ? (
                                              <div className="mt-1 text-[11px] text-slate-500">Saved: {item.sourceLibId}</div>
                                            ) : (
                                              <div className="mt-1 text-[11px] text-slate-500">Manual</div>
                                            )}
                                          </div>
                                          <div className="col-span-1">
                                            <Input
                                              type="number"
                                              className="text-right"
                                              value={item.qty}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, {
                                                  qty: Number(e.target.value) || 0,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="col-span-1">
                                            <Input
                                              value={item.unit}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, { unit: e.target.value })
                                              }
                                            />
                                          </div>
                                          <div className="col-span-1">
                                            <Input
                                              type="number"
                                              className="text-right"
                                              value={item.rate}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, {
                                                  rate: Number(e.target.value) || 0,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Select
                                              value={item.status}
                                              onValueChange={(v) =>
                                                updateRoomItem(activeRoom.id, item.id, { status: v })
                                              }
                                            >
                                              <SelectTrigger className="border-2 border-slate-300">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                  <SelectItem key={key} value={key}>
                                                    {cfg.label}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${statusCfg.badgeClass}`}>
                                              {statusCfg.label}
                                            </div>
                                          </div>
                                          <div className="col-span-1 text-right">
                                            <div className="font-extrabold text-slate-900">{currency(total)}</div>
                                            <div className="text-[11px] text-slate-600">
                                              {counts ? "in total" : "not in total"}
                                            </div>
                                          </div>
                                          <div className="col-span-3">
                                            <Input
                                              value={item.note}
                                              onChange={(e) =>
                                                updateRoomItem(activeRoom.id, item.id, { note: e.target.value })
                                              }
                                              placeholder="Explain scope / allowance"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-center justify-end">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => removeRoomItem(activeRoom.id, item.id)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card className="rounded-3xl shadow-sm border-2 border-slate-300 xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-xl">Project Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Main quote notes</Label>
                      <Textarea
                        value={project.quoteNotes}
                        onChange={(e) => updateProjectLocal("quoteNotes", e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Allowance / exclusion notes</Label>
                      <Textarea
                        value={project.exclusionsNotes}
                        onChange={(e) => updateProjectLocal("exclusionsNotes", e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm border-2 border-slate-300">
                  <CardHeader>
                    <CardTitle className="text-xl">Signature / Approval</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border-2 border-slate-300 p-4 bg-white">
                      <div>
                        <div className="font-extrabold text-slate-900">Approved</div>
                        <div className="text-sm text-slate-600">Client accepts this quote</div>
                      </div>
                      <Checkbox
                        checked={signature.approved}
                        onCheckedChange={(v) => setSignature((prev) => ({ ...prev, approved: !!v }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Client name</Label>
                      <Input
                        value={signature.signerName}
                        onChange={(e) => setSignature((prev) => ({ ...prev, signerName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client email (optional)</Label>
                      <Input
                        value={signature.signerEmail}
                        onChange={(e) => setSignature((prev) => ({ ...prev, signerEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Approval date</Label>
                      <Input
                        type="date"
                        value={signature.signerDate}
                        onChange={(e) => setSignature((prev) => ({ ...prev, signerDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Signature image (optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => handleSignatureFile(e.target.files?.[0])} />
                      {signature.signatureDataUrl ? (
                        <Image
                          src={signature.signatureDataUrl}
                          alt="Signature"
                          width={320}
                          height={100}
                          unoptimized
                          className="mt-2 max-h-28 rounded-xl border-2 border-slate-300"
                        />
                      ) : (
                        <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-sm text-slate-600">
                          No signature image uploaded.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
                <div className="rounded-2xl border-2 border-slate-300 bg-white p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-600">Quick Quote</div>
                    <div className="text-sm font-extrabold text-slate-900">{currency(projectTotals.grandTotal)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button className="rounded-xl" onClick={handlePrintPdf}>
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={saveCurrentQuote}>
                      <Save className="h-4 w-4" /> Save
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => addRoom("customRoom")}>
                      <Plus className="h-4 w-4" /> Room
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
