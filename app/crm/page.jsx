// @ts-nocheck
"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CRM_STORAGE_KEY = "epf.crm.clients";
const CRM_AUTH_KEY = "epf.crm.unlocked";
const CRM_ACCESS_MODE_KEY = "epf.crm.accessMode";
const CRM_SETTINGS_KEY = "epf.crm.settings";
const CRM_ACCESS_PIN = "1234";
const CRM_LIMITED_PIN = "yehor";
const DELETE_PASSWORD = "1234";
const LIMITED_ASSIGNEE = "Yehor";
const limitedCalgaryKeywords = [
  "calgary",
  "airdrie",
  "chestermere",
  "cochrane",
  "popcorn ceiling removal calgary",
  "alpha drywall",
];

const leadStatuses = [
  "New Lead",
  "Contacted",
  "Estimate Booked",
  "Estimate Sent",
  "Follow-Up",
  "Won",
  "Lost",
];

const projectStatuses = [
  "Not Scheduled",
  "Scheduled",
  "In Progress",
  "Completed",
];

const paymentStatuses = [
  "No Invoice",
  "Deposit Due",
  "Deposit Paid",
  "Balance Due",
  "Paid",
];

const sources = ["phone", "email", "website", "referral", "manual", "paste", "voicemail"];
const communicationResults = [
  "Called - No Answer",
  "Text Sent",
  "Email Sent",
  "Client Replied",
  "Appointment Booked",
  "Estimate Sent",
];
const workNeededOptions = [
  "Popcorn ceiling removal",
  "Knockdown ceiling texture",
  "Ceiling texture repair",
  "Ceiling skim coat",
  "Drywall repair",
  "Drywall installation",
  "Interior painting",
  "Wallpaper removal",
  "Other",
];
const paymentMethodOptions = ["Cash", "e-Transfer", "Check"];

const navItems = ["Dashboard", "Pipeline", "Clients", "Calendar", "Invoices"];
const mobileNavLabels = {
  Dashboard: "Dash",
  Pipeline: "Pipe",
  Clients: "Clients",
  Calendar: "Cal",
  Invoices: "Bills",
};
const CRM_SCHEMA_VERSION = 2;
const crmPanelClass = "border border-slate-300 bg-white shadow-md shadow-slate-300/50";
const crmCardClass = "border border-slate-300 bg-white shadow-md shadow-slate-300/50";
const cityKeywords = [
  "Toronto",
  "Mississauga",
  "Brampton",
  "Oakville",
  "Burlington",
  "Hamilton",
  "Milton",
  "Etobicoke",
  "Scarborough",
  "North York",
  "Vaughan",
  "Markham",
  "Richmond Hill",
  "Calgary",
  "Airdrie",
  "Chestermere",
  "Cochrane",
];

const serviceKeywords = [
  ["popcorn removed", "Popcorn Ceiling Removal"],
  ["popcorn removal", "Popcorn Ceiling Removal"],
  ["popcorn ceiling removal", "Popcorn Ceiling Removal"],
  ["popcorn ceiling", "Popcorn Ceiling Removal"],
  ["skim coat", "Ceiling skim coat"],
  ["skimmed", "Ceiling skim coat"],
  ["ceiling repair", "Ceiling Repair"],
  ["painting", "Painting"],
  ["drywall", "Drywall"],
  ["wallpaper removal", "Wallpaper Removal"],
  ["baseboards", "Baseboards"],
  ["pot lights", "Pot Lights"],
];

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowISO = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthISO = () => new Date().toISOString().slice(0, 7);
const defaultBusinessContact = {
  name: "Alex",
  company: "EPF Pro Services",
  phone: "647-923-6784",
  email: "info@epfproservices.com",
  website: "epfproservices.com",
  title: "Popcorn ceiling specialist",
  textCheckInTemplate:
    "Hi {firstName}, this is {name} from {company}, {title}. Just following up about the {service}{cityText}. You can see more at {website}. Let me know if you have any questions or would like to book the next step.\n\n{signature}",
  textEstimateTemplate:
    "Hi {firstName}, this is {name} from {company}, {title}. I wanted to follow up on your {service}{cityText}.{estimateText} You can see more at {website}. If you would like, I can help confirm timing and the next available date.\n\n{signature}",
  emailCheckInTemplate:
    "Hi {firstName},\n\nThis is {name} from {company}, {title}. I am following up about the {service}{cityText}.\n\nYou can review our work and contact details here: {website}\n\nLet me know if you have any questions or if you would like to book the next step.\n\n{signature}",
  emailEstimateTemplate:
    "Hi {firstName},\n\nThis is {name} from {company}, {title}. I wanted to follow up on your {service}{cityText}.{estimateText}\n\nYou can review our work and contact details here: {website}\n\nIf you would like, I can help confirm timing and the next available date.\n\n{signature}",
};

function addDaysISO(days, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseRequestedDateToISO(value = "", from = new Date()) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const lower = raw.toLowerCase();
  if (lower === "today") return todayISO();
  if (lower === "tomorrow") return addDaysISO(1, from);

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekdayIndex = weekdays.findIndex((day) => lower.includes(day));
  if (weekdayIndex >= 0) {
    const date = new Date(from);
    const currentDay = date.getDay();
    const offset = (weekdayIndex - currentDay + 7) % 7 || 7;
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  const monthMatch = raw.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{4}))?\b/i);
  if (monthMatch) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIndex = monthNames.findIndex((month) => monthMatch[1].toLowerCase().startsWith(month));
    const day = Number(monthMatch[2]);
    const year = Number(monthMatch[3]) || from.getFullYear();
    if (monthIndex >= 0 && day >= 1 && day <= 31) {
      const date = new Date(year, monthIndex, day);
      if (!monthMatch[3] && date < new Date(todayISO())) date.setFullYear(year + 1);
      return date.toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return raw;
}

function dateTimeForICS(dateISO = addDaysISO(2), hour = 9) {
  const compactDate = String(dateISO || addDaysISO(2)).replace(/-/g, "");
  return `${compactDate}T${String(hour).padStart(2, "0")}0000`;
}

function escapeICS(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function normalizeSettings(settings = {}) {
  return {
    ...defaultBusinessContact,
    ...settings,
  };
}

function businessSignature(settings = defaultBusinessContact) {
  const contact = normalizeSettings(settings);
  return `${contact.name}\n${contact.company}\n${contact.title}\n${contact.phone}\n${contact.website}`;
}

function renderTemplate(template = "", values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function createFollowUpMessages(client = {}, settings = defaultBusinessContact) {
  const contact = normalizeSettings(settings);
  const firstName = String(client.name || "").trim().split(/\s+/)[0] || "there";
  const service = compactServiceLabel(client).toLowerCase();
  const values = {
    firstName,
    name: contact.name,
    company: contact.company,
    title: contact.title,
    phone: contact.phone,
    email: contact.email,
    website: contact.website,
    service,
    city: client.city || "",
    cityText: client.city ? ` in ${client.city}` : "",
    estimate: numberValue(client.estimateAmount) ? money(client.estimateAmount) : "",
    estimateText: numberValue(client.estimateAmount) ? ` The estimate is ${money(client.estimateAmount)}.` : "",
    signature: businessSignature(contact),
  };
  const subject = `${contact.company} follow-up`;
  return {
    textCheckIn: renderTemplate(contact.textCheckInTemplate, values),
    textEstimate: renderTemplate(contact.textEstimateTemplate, values),
    emailSubject: subject,
    emailCheckIn: renderTemplate(contact.emailCheckInTemplate, values),
    emailEstimate: renderTemplate(contact.emailEstimateTemplate, values),
  };
}

function googleCalendarHref(client = {}, dateISO = addDaysISO(2), description = "") {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Follow up: ${client.name || client.phone || "CRM lead"}`,
    dates: `${dateTimeForICS(dateISO, 9)}/${dateTimeForICS(dateISO, 9).replace("090000", "093000")}`,
    details: description,
  });
  const location = [client.address, client.city].filter(Boolean).join(", ");
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function createFollowUpCalendarDescription(client = {}, selectedMessage = "", messages = {}, settings = defaultBusinessContact) {
  const contact = normalizeSettings(settings);
  const allMessages = {
    ...createFollowUpMessages(client, contact),
    ...messages,
  };
  return [
    "Selected follow-up:",
    selectedMessage,
    "",
    "TEXT OPTION 1 - Friendly check-in:",
    allMessages.textCheckIn,
    "",
    "TEXT OPTION 2 - Estimate / booking follow-up:",
    allMessages.textEstimate,
    "",
    "Business details:",
    `${contact.name} - ${contact.company}`,
    contact.title,
    contact.phone,
    contact.email,
    contact.website,
    "",
    "Client details:",
    client.phone ? `Phone: ${client.phone}` : "",
    client.email ? `Email: ${client.email}` : "",
    client.service ? `Service: ${client.service}` : "",
    client.address ? `Address: ${client.address}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent || "");
}

function downloadFollowUpCalendar(client = {}, dateISO = addDaysISO(2), selectedMessage = "", messages = {}, settings = defaultBusinessContact) {
  if (typeof window === "undefined") return;
  const title = `Follow up: ${client.name || client.phone || "CRM lead"}`;
  const description = createFollowUpCalendarDescription(client, selectedMessage, messages, settings);
  const location = [client.address, client.city].filter(Boolean).join(", ");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EPF Toolbox//CRM Follow Up//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeICS(client.id || makeId())}-${dateISO}@epf-toolbox`,
    `DTSTAMP:${dateTimeForICS(todayISO(), 12)}Z`,
    `DTSTART:${dateTimeForICS(dateISO, 9)}`,
    `DTEND:${dateTimeForICS(dateISO, 9).replace("090000", "093000")}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    location ? `LOCATION:${escapeICS(location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = String(client.name || client.phone || "lead").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${safeName || "lead"}-follow-up-${dateISO}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function money(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number) || number === 0) return value ? String(value) : "$0";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(number);
}

function numberValue(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function monthLabel(value = monthISO()) {
  const [year, month] = String(value || monthISO()).split("-").map(Number);
  const date = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(date);
}

function createInvoiceHref(client = {}, invoices = []) {
  const attachedEstimate = getClientEstimates(client, invoices)[0];
  if (attachedEstimate?.id) {
    return `/invoice-basic?id=${encodeURIComponent(attachedEstimate.id)}`;
  }

  const params = new URLSearchParams({ new: "1" });
  if (client.id) params.set("clientId", client.id);
  if (client.name) params.set("client", client.name);
  const contact = [client.phone, client.email].filter(Boolean).join(" / ");
  if (contact) params.set("contact", contact);
  const site = [client.address, client.city].filter(Boolean).join(", ");
  if (site) params.set("site", site);
  const service = compactServiceLabel(client);
  if (service) params.set("service", service);
  const estimateAmount = String(client.estimateAmount || "").replace(/[^0-9.]/g, "");
  if (estimateAmount) params.set("amount", estimateAmount);
  if (client.notes) params.set("notes", client.notes);
  return `/invoice-basic?${params.toString()}`;
}

function compactServiceLabel(client = {}) {
  const text = [client.service, client.workNeeded, client.notes].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("popcorn") || text.includes("stucco")) return "Popcorn / Stucco Removal";
  if (text.includes("skim")) return "Ceiling skim coat";
  if (text.includes("drywall")) return "Drywall repair / installation";
  if (text.includes("paint")) return "Interior painting";
  return String(client.service || client.workNeeded || "Project work").slice(0, 80).trim();
}

function createEstimateHref(client = {}, salesTeamMode = false) {
  const params = new URLSearchParams({ source: "crm" });
  if (salesTeamMode) {
    params.set("brandScope", "calgary");
    params.set("brand", "popcornCalgary");
  }
  if (client.id) params.set("clientId", client.id);
  if (client.name) params.set("client", client.name);
  const contact = [client.phone, client.email].filter(Boolean).join(" / ");
  if (contact) params.set("contact", contact);
  const site = [client.address, client.city].filter(Boolean).join(", ");
  if (site) params.set("site", site);
  const compactService = compactServiceLabel(client);
  if (compactService) params.set("service", compactService);
  if (compactService) params.set("work", compactService);
  if (client.city) params.set("city", client.city);
  if (client.squareFootage) params.set("size", client.squareFootage);
  if (client.estimateAmount) {
    const estimateAmount = String(client.estimateAmount || "").replace(/[^0-9.]/g, "");
    if (estimateAmount) {
      params.set("amount", estimateAmount);
      params.set("autoAttach", "1");
    }
  }
  const estimateId = Array.isArray(client.estimateIds) ? client.estimateIds.filter(Boolean)[0] : "";
  if (estimateId) params.set("estimateId", estimateId);
  if (client.estimateDate) params.set("estimateDate", client.estimateDate);
  if (client.requestedDate) params.set("requestedDate", client.requestedDate);
  if (client.followUpDate) params.set("followUpDate", client.followUpDate);
  if (client.assignedTo) params.set("assignedTo", client.assignedTo);
  if (client.notes) params.set("notes", client.notes);
  return `/estimate-builder?${params.toString()}`;
}

function createGoogleMapsHref(clientOrAddress = {}) {
  const query =
    typeof clientOrAddress === "string"
      ? clientOrAddress
      : [clientOrAddress.address, clientOrAddress.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "")}`;
}

function cleanName(value = "") {
  return String(value)
    .replace(/\b(phone|email|city|service|message|looking|need|needs|for)\b.*$/i, "")
    .replace(/[^a-zA-Z' -]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");
}

function extractLabeledValue(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractLabeledBlock(text, labels) {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`^\\s*(?:${labelPattern})\\s*:\\s*([\\s\\S]*?)(?=^\\s*[A-Za-z][A-Za-z /-]{0,30}\\s*:|\\s*$)`, "im"));
  return match?.[1]?.trim() || "";
}

function normalizePhone(value = "") {
  const match = String(value).match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return match?.[0]?.trim() || "";
}

function detectService(text = "") {
  const lower = String(text || "").toLowerCase();
  if (/\bpopcorn\b/.test(lower) && /\b(remov(?:e|ed|al|ing)?|scrap(?:e|ed|ing)?)\b/.test(lower)) {
    return "Popcorn Ceiling Removal";
  }
  return serviceKeywords.find(([keyword]) => lower.includes(keyword))?.[1] || "";
}

function parseLeadText(inputText = "", source = "paste") {
  const text = String(inputText || "").trim();
  const lower = text.toLowerCase();
  const details = extractLabeledBlock(text, ["Details", "Message", "Notes", "Project", "Scope", "Description"]);
  const labeledPhone = normalizePhone(extractLabeledValue(text, ["Phone", "Tel", "Telephone", "Mobile", "Cell"]));
  const phone = labeledPhone || normalizePhone(text);
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0];
  const labeledName = extractLabeledValue(text, ["Name", "From", "Client", "Customer"]);
  const spokenName =
    text.match(/\b(?:hi[, ]+)?(?:this is|my name is|i am|i'm)\s+([a-zA-Z][a-zA-Z' -]{1,45})/i)?.[1] ||
    "";
  const city =
    extractLabeledValue(text, ["City", "Town", "Area", "Neighbourhood", "Neighborhood"]) ||
    cityKeywords.find((cityName) => lower.includes(cityName.toLowerCase())) ||
    "";
  const labeledService = extractLabeledValue(text, ["Service", "Work", "Job"]);
  const detectedService = detectService([details, text].filter(Boolean).join("\n"));
  const squareFootage =
    text.match(/\b\d{2,5}\s*(?:sq\.?\s*ft|sqft|square feet)\b/i)?.[0] ||
    text.match(/\b\d{1,3}\s*(?:x|by)\s*\d{1,3}\b/i)?.[0] ||
    "";
  const requestedDate =
    text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ||
    text.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?\b/i)?.[0] ||
    text.match(/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)?.[0] ||
    "";
  const address =
    extractLabeledValue(text, ["Address", "Site"]) ||
    text.match(/\b\d{1,6}\s+[a-zA-Z0-9' .-]+\s+(?:st|street|ave|avenue|road|rd|drive|dr|court|ct|crescent|cres|blvd|boulevard|lane|ln)\b/i)?.[0] ||
    "";

  return {
    name: cleanName(labeledName || spokenName),
    phone,
    email,
    city,
    service: labeledService || detectedService,
    workNeeded: detectedService,
    notes: text,
    squareFootage,
    requestedDate: parseRequestedDateToISO(requestedDate),
    address,
    source,
  };
}

function normalizeSource(value) {
  const source = String(value || "").toLowerCase();
  if (source.includes("voicemail")) return "voicemail";
  if (source.includes("paste")) return "paste";
  if (source.includes("phone") || source.includes("voice")) return "phone";
  if (source.includes("email")) return "email";
  if (source.includes("web") || source.includes("form")) return "website";
  if (source.includes("referral")) return "referral";
  return sources.includes(source) ? source : "manual";
}

function needsMigrationRepair(client = {}) {
  return client.schemaVersion !== CRM_SCHEMA_VERSION;
}

function hasTimelineText(client = {}, phrase = "") {
  const needle = phrase.toLowerCase();
  return [
    ...(client.communicationLog || []).map((entry) => entry.content || entry.title || ""),
    ...(client.activity || []),
  ].some((item) => String(item).toLowerCase().includes(needle));
}

function mapLeadStatus(client = {}) {
  if (
    needsMigrationRepair(client) &&
    client.leadStatus === "Won" &&
    !client.estimateAcceptedAt &&
    !client.completedDate &&
    !client.projectCompletedDate &&
    hasTimelineText(client, "Estimate Booked")
  ) {
    return "Estimate Booked";
  }

  if (leadStatuses.includes(client.leadStatus)) return client.leadStatus;

  const raw = String(client.leadStatus || client.projectFlag || client.tag || "").toLowerCase();
  if (raw.includes("lost") || raw.includes("not interested")) return "Lost";
  if (raw.includes("estimate booked") || raw.includes("appointment") || raw === "booked") {
    return "Estimate Booked";
  }
  if (raw.includes("won") || raw.includes("accepted")) return "Won";
  if (raw.includes("completed")) return "Won";
  if (raw.includes("estimate sent") || raw.includes("quote sent")) return "Estimate Sent";
  if (raw.includes("follow") || raw.includes("no response") || raw.includes("orange")) return "Follow-Up";
  if (raw.includes("contact") || raw.includes("active") || raw.includes("green")) return "Contacted";
  return "New Lead";
}

function mapProjectStatus(client = {}) {
  if (projectStatuses.includes(client.projectStatus)) {
    if (
      needsMigrationRepair(client) &&
      client.projectStatus === "Scheduled" &&
      !client.startDate &&
      !client.bookedStartDate &&
      !hasTimelineText(client, "project status changed to Scheduled")
    ) {
      return "Not Scheduled";
    }
    return client.projectStatus;
  }

  const raw = String(client.projectStatus || client.projectFlag || client.leadStatus || "").toLowerCase();
  if (raw.includes("not scheduled")) return "Not Scheduled";
  if (raw.includes("completed") || raw.includes("red")) return "Completed";
  if (raw.includes("progress")) return "In Progress";
  if (raw.includes("scheduled") || raw.includes("booked") || client.bookedStartDate || client.startDate) {
    return "Scheduled";
  }
  return "Not Scheduled";
}

function mapPaymentStatus(client = {}) {
  if (paymentStatuses.includes(client.paymentStatus)) {
    if (
      needsMigrationRepair(client) &&
      client.paymentStatus === "Paid" &&
      !numberValue(client.paymentAmount) &&
      hasTimelineText(client, "Deposit Paid")
    ) {
      return "Deposit Paid";
    }
    return client.paymentStatus;
  }

  const raw = String(client.paymentStatus || client.projectFlag || client.tag || "").toLowerCase();
  if (raw.includes("deposit paid")) return "Deposit Paid";
  if (raw.includes("balance due") || numberValue(client.balanceDue) > 0) return "Balance Due";
  if (raw.includes("paid")) return "Paid";
  if (raw.includes("deposit") || numberValue(client.depositAmount) > 0) return "Deposit Due";
  return "No Invoice";
}

function conditionValue(client = {}) {
  const condition = String(client.popcornCondition || client.ceilingCondition || "unknown").toLowerCase();
  if (condition.includes("unpainted")) return "unpainted";
  if (condition.includes("painted")) return "painted";
  return "unknown";
}

function makeTimelineEntry({ type = "note", direction = "internal", content, createdBy = "CRM" }) {
  return {
    id: makeId(),
    date: nowISO(),
    type,
    direction,
    content,
    createdBy,
  };
}

function legacyTimeline(client = {}) {
  const activity = (client.activity || []).map((content, index) => ({
    id: `activity-${index}-${client.id || makeId()}`,
    date: client.updatedAt || client.createdAt || nowISO(),
    type: "note",
    direction: "internal",
    content: String(content),
    createdBy: "Legacy CRM",
  }));

  const edits = (client.editHistory || []).map((edit) => ({
    id: edit.id || makeId(),
    date: edit.date || client.updatedAt || nowISO(),
    type: "status_change",
    direction: "internal",
    content: `${edit.field}: ${edit.from} -> ${edit.to}`,
    createdBy: "Legacy CRM",
  }));

  return [...(client.communicationLog || []), ...activity, ...edits];
}

function normalizeTimelineEntry(entry = {}) {
  return {
    id: entry.id || makeId(),
    date: entry.date || nowISO(),
    type: entry.type || "note",
    direction: entry.direction || "internal",
    content: String(entry.content || entry.title || ""),
    createdBy: entry.createdBy || "CRM",
  };
}

function getClientTimeline(client = {}) {
  const existing = (client.communicationLog || [])
    .map(normalizeTimelineEntry)
    .filter((entry) => entry.content);

  if (existing.length) return uniqueTimelineEntries(existing);

  return uniqueTimelineEntries(legacyTimeline(client)
    .map(normalizeTimelineEntry)
    .filter((entry) => entry.content));
}

function uniqueTimelineEntries(entries = []) {
  const seenIds = new Map();

  return entries.map((entry) => {
    const baseId = entry.id || makeId();
    const count = seenIds.get(baseId) || 0;
    seenIds.set(baseId, count + 1);

    if (count === 0) return { ...entry, id: baseId };

    return {
      ...entry,
      id: `${baseId}-${count}-${String(entry.date || "").slice(0, 10)}`,
    };
  });
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

function getClientEstimates(client = {}, invoices = []) {
  const ids = new Set((client.estimateIds || []).filter(Boolean));
  return invoices
    .filter((invoice) => invoice?.crmClientId === client.id || ids.has(invoice?.id))
    .sort((a, b) => new Date(b.updatedAt || b.savedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.savedAt || a.createdAt || 0).getTime());
}

function invoiceTotal(invoice = {}) {
  const total = numberValue(invoice.totals?.total);
  if (total) return total;
  return (invoice.items || []).reduce((sum, item) => sum + numberValue(item?.amount), 0);
}

function invoiceLabel(invoice = {}) {
  return invoice.quoteId || invoice.id || "invoice";
}

function summarizeClientInvoices(client = {}, invoices = []) {
  const attached = getClientEstimates(client, invoices);
  const total = attached.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const latest = attached[0] || null;
  const paid = numberValue(client.paymentAmount);
  const balance = Math.max(0, total - paid);
  return { attached, total, latest, paid, balance };
}

function isLimitedClient(client = {}) {
  const assigned = String(client.assignedTo || "").toLowerCase();
  if (assigned === LIMITED_ASSIGNEE.toLowerCase()) return true;

  const haystack = [
    client.city,
    client.address,
    client.service,
    client.workNeeded,
    client.source,
    client.notes,
    ...(client.communicationLog || []).map((entry) => entry.content),
  ]
    .join(" ")
    .toLowerCase();

  return limitedCalgaryKeywords.some((keyword) => haystack.includes(keyword));
}

function canAccessClient(client = {}, accessMode = "master") {
  if (accessMode !== "limited") return true;
  return isLimitedClient(client);
}

function canAccessInvoice(invoice = {}, visibleClientIds = new Set(), accessMode = "master") {
  if (accessMode !== "limited") return true;
  if (invoice.crmClientId && visibleClientIds.has(invoice.crmClientId)) return true;
  const haystack = [
    invoice.brandKey,
    invoice.client,
    invoice.site,
    invoice.contact,
    invoice.notes,
    ...(invoice.items || []).map((item) => item.description),
  ]
    .join(" ")
    .toLowerCase();
  return limitedCalgaryKeywords.some((keyword) => haystack.includes(keyword));
}

function normalizeClient(client = {}) {
  const id = client.id || makeId();
  const createdAt = client.createdAt || client.updatedAt || nowISO();
  const estimateSentAt =
    client.estimateSentAt ||
    (client.estimateSent === "Yes" || mapLeadStatus(client) === "Estimate Sent" ? client.updatedAt || nowISO() : "");

  return {
    ...client,
    schemaVersion: CRM_SCHEMA_VERSION,
    id,
    name: client.name || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    city: client.city || client.neighborhood || "",
    service: client.service || "",
    source: normalizeSource(client.source || client.leadSource),
    assignedTo: client.assignedTo || "",
    createdAt,
    updatedAt: client.updatedAt || createdAt,
    deletedAt: client.deletedAt || "",
    leadStatus: mapLeadStatus(client),
    projectStatus: mapProjectStatus(client),
    paymentStatus: mapPaymentStatus(client),
    estimateAmount: client.estimateAmount || "",
    estimateDate: client.estimateDate || "",
    estimateSentAt,
    estimateAcceptedAt: client.estimateAcceptedAt || "",
    estimateIds: Array.isArray(client.estimateIds) ? client.estimateIds.filter(Boolean) : [],
    squareFootage: client.squareFootage || client.approxSqft || "",
    workNeeded: client.workNeeded || client.scopeOfWork || client.workScope || "",
    popcornCondition: conditionValue(client),
    ceilingHeight: client.ceilingHeight || "",
    asbestosStatus: client.asbestosStatus || "",
    startDate: client.startDate || client.bookedStartDate || "",
    completedDate: client.completedDate || client.projectCompletedDate || "",
    followUpDate: client.followUpDate || "",
    requestedDate: client.requestedDate || "",
    depositAmount: client.depositAmount || "",
    paymentAmount: client.paymentAmount || "",
    balanceDue: client.balanceDue || "",
    paymentMethod: client.paymentMethod || "",
    notes: client.notes || client.projectNotes || "",
    communicationLog: getClientTimeline(client),
  };
}

function clientSyncTime(client = {}) {
  const value = client.deletedAt || client.updatedAt || client.createdAt || "";
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function mergeClientLists(...lists) {
  const byId = new Map();

  lists.flat().filter(Boolean).map(normalizeClient).forEach((client) => {
    const previous = byId.get(client.id);
    if (!previous || clientSyncTime(client) >= clientSyncTime(previous)) {
      byId.set(client.id, client);
    }
  });

  return [...byId.values()].sort((a, b) => clientSyncTime(b) - clientSyncTime(a));
}

const emptyClient = normalizeClient({
  source: "manual",
  leadStatus: "New Lead",
  projectStatus: "Not Scheduled",
  paymentStatus: "No Invoice",
  communicationLog: [],
});

const sampleClients = [
  normalizeClient({
    id: makeId(),
    name: "Laura Lewis",
    phone: "4036088822",
    email: "laura-lewis@live.com",
    city: "Calgary",
    service: "Popcorn Ceiling Removal",
    source: "website",
    assignedTo: "Alex",
    squareFootage: "1400",
    leadStatus: "New Lead",
    followUpDate: todayISO(),
    estimateAmount: "7200",
    notes: "Lead pasted from website form.",
    communicationLog: [makeTimelineEntry({ content: "Lead created from website form." })],
  }),
  normalizeClient({
    id: makeId(),
    name: "Completed Example Client",
    phone: "9055551111",
    email: "completed@example.com",
    city: "Mississauga",
    service: "Popcorn Ceiling Removal",
    source: "referral",
    assignedTo: "Alex",
    leadStatus: "Won",
    projectStatus: "Completed",
    paymentStatus: "Paid",
    estimateAmount: "6400",
    paymentAmount: "6400",
    completedDate: todayISO(),
    communicationLog: [makeTimelineEntry({ content: "Project completed and paid." })],
  }),
  normalizeClient({
    id: makeId(),
    name: "No Response Example",
    phone: "4165552222",
    city: "Oakville",
    service: "Interior Painting",
    source: "phone",
    assignedTo: "Sam",
    leadStatus: "Follow-Up",
    projectStatus: "Not Scheduled",
    paymentStatus: "No Invoice",
    followUpDate: todayISO(),
    communicationLog: [makeTimelineEntry({ type: "call", direction: "outbound", content: "Called - No Answer" })],
  }),
];

function isFollowUpOverdue(client) {
  if (client.leadStatus === "Lost" || client.leadStatus === "Won") return false;
  return Boolean(client.followUpDate && client.followUpDate < todayISO());
}

function daysSinceISO(dateISO = "") {
  if (!dateISO) return 0;
  const start = new Date(`${String(dateISO).slice(0, 10)}T00:00:00`);
  const end = new Date(`${todayISO()}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff)) return 0;
  return Math.max(0, Math.floor(diff / 86400000));
}

function needsReminder(client) {
  if (client.leadStatus === "Lost" || client.leadStatus === "Won") return false;
  const created = (client.createdAt || "").slice(0, 10);
  const estimateSent = (client.estimateSentAt || "").slice(0, 10);
  if (client.leadStatus === "New Lead" && created && addDaysISO(1, new Date(created)) < todayISO()) return true;
  if (client.leadStatus === "Estimate Sent" && estimateSent && addDaysISO(2, new Date(estimateSent)) <= todayISO()) return true;
  return isFollowUpOverdue(client);
}

function hasClientActionAfter(client = {}, isoDate = "") {
  const since = new Date(isoDate).getTime();
  if (!Number.isFinite(since)) return false;
  return (client.communicationLog || []).some((entry) => {
    const time = new Date(entry.date || "").getTime();
    if (!Number.isFinite(time) || time <= since) return false;
    const content = String(entry.content || "").toLowerCase();
    if (content.includes("moved to follow-up")) return false;
    return ["call", "text", "email", "note"].includes(entry.type);
  });
}

function shouldMoveEstimateToFollowUp(client = {}) {
  if (client.leadStatus !== "Estimate Sent") return false;
  const estimateSent = (client.estimateSentAt || "").slice(0, 10);
  if (!estimateSent) return false;
  if (addDaysISO(2, new Date(estimateSent)) > todayISO()) return false;
  return !hasClientActionAfter(client, client.estimateSentAt || estimateSent);
}

function lastContactDate(client) {
  const event = (client.communicationLog || []).find((item) =>
    ["call", "text", "email", "note"].includes(item.type)
  );
  return event?.date?.slice(0, 10) || "";
}

function clientCardNote(client = {}) {
  const directNote = String(client.notes || "").trim();
  if (directNote) return directNote;
  const timelineNote = (client.communicationLog || []).find((entry) =>
    String(entry.content || "").trim()
  );
  return String(timelineNote?.content || "").trim();
}

export default function CrmPage() {
  const [clients, setClients] = useState(sampleClients);
  const [form, setForm] = useState(emptyClient);
  const [editingId, setEditingId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [activeView, setActiveView] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
  const [leadFormMode, setLeadFormMode] = useState("manual");
  const [leadMenuOpen, setLeadMenuOpen] = useState(false);
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);
  const [smartLeadText, setSmartLeadText] = useState("");
  const [smartLeadParsed, setSmartLeadParsed] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    salesperson: "All",
    city: "All",
    service: "All",
    paymentStatus: "All",
    special: "All",
  });
  const [syncStatus, setSyncStatus] = useState("Loading shared CRM...");
  const [cloudSyncAvailable, setCloudSyncAvailable] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessMode, setAccessMode] = useState("master");
  const [masterPreviewLimited, setMasterPreviewLimited] = useState(false);
  const [accessPin, setAccessPin] = useState("");
  const [accessError, setAccessError] = useState("");
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [followUpClientId, setFollowUpClientId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState(defaultBusinessContact);
  const clientsRef = useRef(sampleClients);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  const saveLocalClients = useCallback((nextClients) => {
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(nextClients));
    } catch {}
  }, []);

  const fetchCloudClients = useCallback(async () => {
    const res = await fetch("/api/crm", { cache: "no-store" });
    if (!res.ok) throw new Error("CRM load failed");
    const data = await res.json();
    return Array.isArray(data.items) ? data.items.map(normalizeClient) : [];
  }, []);

  const refreshCloudClients = useCallback(async () => {
    try {
      const cloudClients = await fetchCloudClients();
      const merged = mergeClientLists(clientsRef.current, cloudClients);
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: merged }),
      });
      if (!res.ok) throw new Error("CRM push failed");
      const data = await res.json();
      const syncedClients = Array.isArray(data.items) ? data.items.map(normalizeClient) : merged;
      setCloudSyncAvailable(true);
      setClients(syncedClients);
      saveLocalClients(syncedClients);
      setSyncStatus(`Shared CRM synced ${new Date().toLocaleTimeString("en-CA")}`);
    } catch {
      setCloudSyncAvailable(false);
      setSyncStatus("Cloud sync is offline. Changes are queued on this device.");
    }
  }, [fetchCloudClients, saveLocalClients]);

  const syncClients = useCallback(
    async (nextClients) => {
      saveLocalClients(nextClients);
      if (!cloudSyncAvailable) {
        setSyncStatus("Cloud sync is offline. Changes are queued on this device.");
        return;
      }

      setSyncStatus("Saving shared CRM...");
      try {
        const res = await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clients: nextClients }),
        });
        if (!res.ok) throw new Error("CRM sync failed");
        const data = await res.json();
        const syncedClients = Array.isArray(data.items) ? data.items.map(normalizeClient) : nextClients;
        setClients(syncedClients);
        saveLocalClients(syncedClients);
        setCloudSyncAvailable(true);
        setSyncStatus(`Shared CRM saved ${new Date().toLocaleTimeString("en-CA")}`);
      } catch {
        setCloudSyncAvailable(false);
        setSyncStatus("Cloud sync is offline. Changes are queued on this device.");
      }
    },
    [cloudSyncAvailable, saveLocalClients]
  );

  useEffect(() => {
    try {
      const unlocked = window.localStorage.getItem(CRM_AUTH_KEY) === "yes";
      setIsUnlocked(unlocked);
      const storedMode = window.localStorage.getItem(CRM_ACCESS_MODE_KEY);
      setAccessMode(storedMode === "limited" ? "limited" : "master");
      const storedSettings = JSON.parse(window.localStorage.getItem(CRM_SETTINGS_KEY) || "{}");
      setAppSettings(normalizeSettings(storedSettings));
    } catch {}
  }, []);

  const refreshSavedInvoices = useCallback(() => {
    try {
      const invoices = parseStoredList(window.localStorage.getItem("epf.invoices"));
      const esInvoices = parseStoredList(window.localStorage.getItem("epf.eslist"));
      const byId = new Map();
      [...invoices, ...esInvoices].filter(Boolean).forEach((invoice) => {
        if (invoice.id) byId.set(invoice.id, invoice);
      });
      setSavedInvoices([...byId.values()]);
    } catch {
      setSavedInvoices([]);
    }
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    refreshSavedInvoices();
    const onRefresh = () => refreshSavedInvoices();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("storage", onRefresh);
    return () => {
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("storage", onRefresh);
    };
  }, [isUnlocked, refreshSavedInvoices]);

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const cached = window.localStorage.getItem(CRM_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && !cancelled) setClients(parsed.map(normalizeClient));
        }
      } catch {}

      try {
        const items = await fetchCloudClients();
        if (cancelled) return;
        setClients((current) => {
          const merged = mergeClientLists(current, items);
          saveLocalClients(merged);
          return merged;
        });
        setCloudSyncAvailable(true);
        setSyncStatus(`Shared CRM loaded ${new Date().toLocaleTimeString("en-CA")}`);
      } catch {
        if (!cancelled) setSyncStatus("Cloud sync is offline. Changes are queued on this device.");
        if (!cancelled) setCloudSyncAvailable(false);
      }
    }

    loadClients();
    return () => {
      cancelled = true;
    };
  }, [fetchCloudClients, saveLocalClients]);

  useEffect(() => {
    if (!isUnlocked) return;

    const interval = window.setInterval(refreshCloudClients, 30000);
    const onFocus = () => refreshCloudClients();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshCloudClients();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isUnlocked, refreshCloudClients]);

  const isSalesTeamView = accessMode === "limited" || masterPreviewLimited;
  const effectiveAccessMode = isSalesTeamView ? "limited" : accessMode;

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) =>
          client.id === selectedClientId &&
          !client.deletedAt &&
          canAccessClient(client, effectiveAccessMode)
      ) || null,
    [clients, effectiveAccessMode, selectedClientId]
  );

  const followUpClient = useMemo(
    () =>
      clients.find(
        (client) =>
          client.id === followUpClientId &&
          !client.deletedAt &&
          canAccessClient(client, effectiveAccessMode)
      ) || null,
    [clients, effectiveAccessMode, followUpClientId]
  );

  const activeClients = useMemo(
    () => clients.filter((client) => !client.deletedAt && canAccessClient(client, effectiveAccessMode)),
    [clients, effectiveAccessMode]
  );

  const dailyClients = useMemo(
    () => activeClients.filter((client) => client.leadStatus !== "Lost"),
    [activeClients]
  );

  const archivedClients = useMemo(
    () => activeClients.filter((client) => client.leadStatus === "Lost"),
    [activeClients]
  );

  const visibleClientIds = useMemo(
    () => new Set(activeClients.map((client) => client.id)),
    [activeClients]
  );

  const visibleSavedInvoices = useMemo(
    () => savedInvoices.filter((invoice) => canAccessInvoice(invoice, visibleClientIds, effectiveAccessMode)),
    [effectiveAccessMode, savedInvoices, visibleClientIds]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clientId = new URLSearchParams(window.location.search || "").get("client");
    const urlClient = activeClients.find((client) => client.id === clientId);
    if (urlClient) {
      setSelectedClientId(clientId);
      setActiveView(urlClient.leadStatus === "Lost" ? "Archive" : "Clients");
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("client");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {}
    }
  }, [activeClients]);

  const filterOptions = useMemo(() => {
    const unique = (field) => [...new Set(dailyClients.map((client) => client[field]).filter(Boolean))].sort();
    return {
      salesperson: unique("assignedTo"),
      city: unique("city"),
      service: unique("service"),
    };
  }, [dailyClients]);

  const filteredClients = useMemo(() => {
    const query = search.toLowerCase();
    return dailyClients
      .filter((client) => {
        const notes = [
          client.notes,
          ...(client.communicationLog || []).map((entry) => entry.content),
        ].join(" ");
        const haystack = [client.name, client.phone, client.email, client.city, client.service, client.workNeeded, notes]
          .join(" ")
          .toLowerCase();
        const specialOk =
          filters.special === "All" ||
          (filters.special === "Follow-up overdue" && isFollowUpOverdue(client)) ||
          (filters.special === "Balance due" && client.paymentStatus === "Balance Due") ||
          (filters.special === "Completed unpaid" &&
            client.projectStatus === "Completed" &&
            client.paymentStatus !== "Paid");

        return (
          haystack.includes(query) &&
          (filters.status === "All" || client.leadStatus === filters.status) &&
          (filters.salesperson === "All" || client.assignedTo === filters.salesperson) &&
          (filters.city === "All" || client.city === filters.city) &&
          (filters.service === "All" || client.service === filters.service) &&
          (filters.paymentStatus === "All" || client.paymentStatus === filters.paymentStatus) &&
          specialOk
        );
      })
      .sort((a, b) => {
        if (a.leadStatus === "Lost" && b.leadStatus !== "Lost") return 1;
        if (a.leadStatus !== "Lost" && b.leadStatus === "Lost") return -1;
        if (needsReminder(a) && !needsReminder(b)) return -1;
        if (!needsReminder(a) && needsReminder(b)) return 1;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });
  }, [dailyClients, filters, search]);

  const stats = useMemo(() => {
    const thisMonth = monthISO();
    const byLead = (status) => dailyClients.filter((client) => client.leadStatus === status);
    const balanceDue = dailyClients.filter((client) => client.paymentStatus === "Balance Due");
    const completed = dailyClients.filter((client) => client.projectStatus === "Completed");
    const followUpsToday = dailyClients.filter(
      (client) => client.followUpDate && client.followUpDate <= todayISO() && client.leadStatus !== "Lost"
    );
    const wonThisMonth = dailyClients.filter(
      (client) => client.leadStatus === "Won" && (client.estimateAcceptedAt || client.updatedAt || "").slice(0, 7) === thisMonth
    );

    return [
      { label: "New Leads", count: byLead("New Lead").length, amount: byLead("New Lead").reduce((sum, c) => sum + numberValue(c.estimateAmount), 0) },
      { label: "Follow-Ups Today", count: followUpsToday.length, amount: followUpsToday.reduce((sum, c) => sum + numberValue(c.estimateAmount), 0) },
      { label: "Estimates Sent", count: byLead("Estimate Sent").length, amount: byLead("Estimate Sent").reduce((sum, c) => sum + numberValue(c.estimateAmount), 0) },
      { label: "Won This Month", count: wonThisMonth.length, amount: wonThisMonth.reduce((sum, c) => sum + numberValue(c.estimateAmount), 0) },
      { label: "Balance Due", count: balanceDue.length, amount: balanceDue.reduce((sum, c) => sum + numberValue(c.balanceDue || c.estimateAmount), 0) },
      { label: "Completed Jobs", count: completed.length, amount: completed.reduce((sum, c) => sum + numberValue(c.estimateAmount), 0) },
    ];
  }, [dailyClients]);

  const clientMonthStats = useMemo(() => {
    const thisMonth = monthISO();
    const monthClients = dailyClients.filter(
      (client) => String(client.createdAt || client.updatedAt || "").slice(0, 7) === thisMonth
    );
    return {
      label: monthLabel(thisMonth),
      count: monthClients.length,
      won: monthClients.filter((client) => client.leadStatus === "Won").length,
      amount: monthClients.reduce((sum, client) => sum + numberValue(client.estimateAmount), 0),
    };
  }, [dailyClients]);

  const updateClientList = useCallback((mutator) => {
    setClients((current) => {
      const nextClients = mutator(current).map(normalizeClient);
      syncClients(nextClients);
      return nextClients;
    });
  }, [syncClients]);

  useEffect(() => {
    if (!isUnlocked || !savedInvoices.length) return;

    updateClientList((current) => {
      let changed = false;
      const next = current.map((client) => {
        if (client.deletedAt) return client;
        const summary = summarizeClientInvoices(client, savedInvoices);
        if (!summary.attached.length) return client;

        const estimateIds = [
          ...(client.estimateIds || []),
          ...summary.attached.map((invoice) => invoice.id).filter(Boolean),
        ];
        const uniqueEstimateIds = [...new Set(estimateIds)];
        const updates = {};
        const timeline = [];
        const totalRounded = Math.round(summary.total);
        const balanceRounded = Math.round(summary.balance);

        if (uniqueEstimateIds.length !== (client.estimateIds || []).length) {
          updates.estimateIds = uniqueEstimateIds;
        }
        if (!numberValue(client.estimateAmount) && totalRounded > 0) {
          updates.estimateAmount = String(totalRounded);
        }
        if (client.paymentStatus === "No Invoice") {
          updates.paymentStatus = balanceRounded > 0 ? "Balance Due" : "Paid";
        }
        if (client.paymentStatus !== "Paid" && balanceRounded > 0 && numberValue(client.balanceDue) !== balanceRounded) {
          updates.balanceDue = String(balanceRounded);
        }

        if (!Object.keys(updates).length) return client;

        const latestLabel = invoiceLabel(summary.latest);
        const alreadyLogged = (client.communicationLog || []).some((entry) =>
          String(entry.content || "").includes(`Invoice reconciliation: ${latestLabel}`)
        );
        if (!alreadyLogged) {
          timeline.push(
            makeTimelineEntry({
              type: "invoice",
              content: `Invoice reconciliation: ${latestLabel} linked for ${money(summary.total)}. Balance due ${money(summary.balance)}.`,
              createdBy: "CRM",
            })
          );
        }

        changed = true;
        return normalizeClient({
          ...client,
          ...updates,
          updatedAt: nowISO(),
          communicationLog: [...timeline, ...(client.communicationLog || [])],
        });
      });

      return changed ? next : current;
    });
  }, [isUnlocked, savedInvoices, updateClientList]);

  useEffect(() => {
    if (!isUnlocked) return;
    if (!clients.some(shouldMoveEstimateToFollowUp)) return;

    updateClientList((current) =>
      current.map((client) => {
        if (!shouldMoveEstimateToFollowUp(client)) return client;
        return normalizeClient({
          ...client,
          leadStatus: "Follow-Up",
          followUpDate: client.followUpDate || todayISO(),
          communicationLog: [
            makeTimelineEntry({
              type: "status_change",
              content: "Estimate had no client action for 2 days. Moved to Follow-Up.",
            }),
            ...(client.communicationLog || []),
          ],
        });
      })
    );
  }, [clients, isUnlocked, updateClientList]);

  function unlockCrm(event) {
    event.preventDefault();
    const trimmedPin = accessPin.trim();
    const nextMode =
      trimmedPin === CRM_ACCESS_PIN
        ? "master"
        : trimmedPin.toLowerCase() === CRM_LIMITED_PIN
          ? "limited"
          : "";
    if (!nextMode) {
      setAccessError("Wrong CRM PIN.");
      return;
    }
    try {
      window.localStorage.setItem(CRM_AUTH_KEY, "yes");
      window.localStorage.setItem(CRM_ACCESS_MODE_KEY, nextMode);
    } catch {}
    setAccessMode(nextMode);
    setIsUnlocked(true);
    setAccessPin("");
    setAccessError("");
  }

  function lockCrm() {
    try {
      window.localStorage.removeItem(CRM_AUTH_KEY);
      window.localStorage.removeItem(CRM_ACCESS_MODE_KEY);
    } catch {}
    setAccessMode("master");
    setMasterPreviewLimited(false);
    setIsUnlocked(false);
  }

  function toggleSalesTeamWatch() {
    setSelectedClientId(null);
    setShowForm(false);
    setEditingId(null);
    setLeadMenuOpen(false);
    setBackupMenuOpen(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("client");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {}
    setMasterPreviewLimited((value) => !value);
  }

  function baseNewClient(source = "manual") {
    return {
      ...emptyClient,
      id: makeId(),
      source,
      assignedTo: isSalesTeamView ? LIMITED_ASSIGNEE : emptyClient.assignedTo,
      city: isSalesTeamView ? "Calgary" : emptyClient.city,
      leadStatus: "New Lead",
      projectStatus: "Not Scheduled",
      paymentStatus: "No Invoice",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      communicationLog: [makeTimelineEntry({ content: "Lead created" })],
    };
  }

  function openNewClient(mode = "manual") {
    setEditingId(null);
    setLeadMenuOpen(false);
    setLeadFormMode(mode);
    setSmartLeadText("");
    setSmartLeadParsed(null);
    setForm(baseNewClient(mode === "phone" ? "phone" : mode === "voicemail" ? "voicemail" : mode === "paste" ? "paste" : "manual"));
    setShowForm(true);
    setActiveView("Clients");
  }

  function editClient(client) {
    setEditingId(client.id);
    setLeadFormMode("manual");
    setSmartLeadText("");
    setSmartLeadParsed(null);
    setForm(normalizeClient(client));
    setShowForm(true);
    setActiveView("Clients");
  }

  function applyParsedLead(text = smartLeadText, mode = leadFormMode) {
    const parsed = parseLeadText(text, mode === "voicemail" ? "voicemail" : "paste");
    const next = {
      ...form,
      name: parsed.name || (mode === "voicemail" ? "Unknown Caller" : form.name),
      phone: parsed.phone || form.phone,
      email: parsed.email || form.email,
      address: parsed.address || form.address,
      city: parsed.city || form.city,
      service: parsed.service || (mode === "voicemail" ? "No service" : form.service),
      workNeeded: parsed.workNeeded || form.workNeeded,
      squareFootage: parsed.squareFootage || form.squareFootage,
      requestedDate: parseRequestedDateToISO(parsed.requestedDate) || form.requestedDate,
      notes: parsed.notes || form.notes,
      source: parsed.source,
      leadStatus: "New Lead",
      projectStatus: "Not Scheduled",
      paymentStatus: "No Invoice",
      communicationLog: [
        makeTimelineEntry({
          content: mode === "voicemail" ? "Lead created from voicemail text" : "Lead created from pasted text",
        }),
      ],
    };
    setSmartLeadParsed(parsed);
    setForm(next);
  }

  function exportBackup() {
    setBackupMenuOpen(false);
    const blob = new Blob([JSON.stringify(clients, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crm-backup-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(file) {
    if (!file) return;
    setBackupMenuOpen(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        if (!Array.isArray(parsed)) throw new Error("Backup must be an array");
        const nextClients = parsed.map(normalizeClient);
        updateClientList(() => nextClients);
        setSyncStatus(`Imported ${nextClients.length} client(s) from backup.`);
      } catch {
        alert("Could not import that CRM backup JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function saveClient() {
    if (!form.name && !form.phone && !form.email) {
      alert("Add at least a name, phone, or email.");
      return;
    }

    const saved = normalizeClient({
      ...form,
      id: editingId || form.id || makeId(),
      createdAt: form.createdAt || nowISO(),
      updatedAt: nowISO(),
      communicationLog:
        form.communicationLog?.length > 0
          ? form.communicationLog
          : [makeTimelineEntry({ content: "Lead created" })],
    });

    if (
      saved.estimateAmount &&
      (saved.leadStatus === "New Lead" || saved.leadStatus === "Contacted") &&
      window.confirm("Estimate amount is filled. Mark this lead as Estimate Sent?")
    ) {
      saved.leadStatus = "Estimate Sent";
      saved.estimateSentAt = nowISO();
      saved.followUpDate = saved.followUpDate || addDaysISO(2);
      saved.communicationLog = [
        makeTimelineEntry({ type: "estimate", content: "Estimate created from saved amount" }),
        ...(saved.communicationLog || []),
      ];
    }

    if (saved.leadStatus === "Estimate Sent") {
      saved.estimateSentAt = saved.estimateSentAt || nowISO();
      saved.followUpDate = saved.followUpDate || addDaysISO(2);
    }
    if (saved.leadStatus === "Won") {
      saved.estimateAcceptedAt = saved.estimateAcceptedAt || nowISO();
    }
    if (saved.leadStatus === "Lost") {
      saved.followUpDate = "";
    }
    if (saved.projectStatus === "Completed") {
      saved.completedDate = saved.completedDate || todayISO();
    }
    if (saved.paymentStatus === "Paid") {
      saved.balanceDue = "";
    }

    updateClientList((current) => {
      if (editingId) return current.map((client) => (client.id === editingId ? saved : client));
      return [saved, ...current];
    });
    setShowForm(false);
    setEditingId(null);
    setSmartLeadText("");
    setSmartLeadParsed(null);
  }

  function deleteClient(id) {
    const password = window.prompt("Enter delete password");
    if (password !== DELETE_PASSWORD) {
      alert("Wrong password. Client was not deleted.");
      return;
    }
    updateClientList((current) =>
      current.map((client) =>
        client.id === id
          ? normalizeClient({ ...client, deletedAt: nowISO(), updatedAt: nowISO() })
          : client
      )
    );
    if (selectedClientId === id) setSelectedClientId(null);
  }

  function updateClient(id, updates, timelineEntry) {
    updateClientList((current) =>
      current.map((client) => {
        if (client.id !== id) return client;
        return normalizeClient({
          ...client,
          ...updates,
          updatedAt: nowISO(),
          communicationLog: timelineEntry
            ? [timelineEntry, ...(client.communicationLog || [])]
            : client.communicationLog || [],
        });
      })
    );
  }

  function changeStatus(id, field, value) {
    const client = clients.find((item) => item.id === id);
    if (!client || client[field] === value) return;

    const updates = { [field]: value };
    if (field === "leadStatus" && value === "Estimate Sent") {
      updates.estimateSentAt = nowISO();
      updates.followUpDate = addDaysISO(2);
    }
    if (field === "leadStatus" && value === "Won") {
      updates.estimateAcceptedAt = client.estimateAcceptedAt || nowISO();
    }
    if (field === "leadStatus" && value === "Lost") {
      updates.followUpDate = "";
    }
    if (field === "projectStatus" && value === "Completed") {
      updates.completedDate = client.completedDate || todayISO();
    }
    if (field === "paymentStatus" && value === "Paid") {
      updates.balanceDue = "";
    }

    updateClient(
      id,
      updates,
      makeTimelineEntry({
        type: "status_change",
        content: `${field.replace("Status", " status")} changed to ${value}`,
      })
    );
  }

  function addCommunication(id, result) {
    const lower = result.toLowerCase();
    const updates = {};
    let type = "note";
    let direction = "internal";

    if (lower.includes("called")) {
      type = "call";
      direction = "outbound";
      if (lower.includes("no answer")) {
        updates.leadStatus = "Follow-Up";
        updates.followUpDate = addDaysISO(1);
      } else {
        updates.leadStatus = "Contacted";
      }
    }
    if (lower.includes("text")) {
      type = "text";
      direction = "outbound";
      updates.leadStatus = updates.leadStatus || "Contacted";
    }
    if (lower.includes("email")) {
      type = "email";
      direction = "outbound";
      updates.leadStatus = updates.leadStatus || "Contacted";
    }
    if (lower.includes("replied")) {
      direction = "inbound";
      updates.leadStatus = "Contacted";
    }
    if (lower.includes("appointment")) {
      updates.leadStatus = "Estimate Booked";
    }
    if (lower.includes("estimate sent")) {
      type = "estimate";
      updates.leadStatus = "Estimate Sent";
      updates.estimateSentAt = nowISO();
      updates.followUpDate = addDaysISO(2);
    }

    updateClient(id, updates, makeTimelineEntry({ type, direction, content: result, createdBy: "Sales" }));
  }

  function saveSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
    setAppSettings(normalized);
    try {
      window.localStorage.setItem(CRM_SETTINGS_KEY, JSON.stringify(normalized));
    } catch {}
    setShowSettings(false);
  }

  async function scheduleFollowUp(client, message, messages, action = "calendar", channel = "text") {
    const followUpDate = addDaysISO(2);
    const description = createFollowUpCalendarDescription(client, message, messages, appSettings);
    const shouldCreateCalendar = ["calendar", "ics", "google"].includes(action);
    const shouldLogCommunication = ["textLog", "emailLog", "text", "email"].includes(action);
    const actionLabel =
      action === "copy"
        ? "Follow-up message copied"
        : shouldLogCommunication
          ? `${channel.toUpperCase()} handoff opened with template`
          : "Follow-up scheduled";
    updateClient(
      client.id,
      { leadStatus: "Follow-Up", followUpDate },
      makeTimelineEntry({
        type: "follow_up",
        direction: "outbound",
        content: `${actionLabel} for ${followUpDate}.\n\nSelected ${channel} message:\n${message}\n\n${description}`,
        createdBy: "CRM",
      })
    );
    if (action === "copy") {
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        window.prompt("Copy this follow-up message", message);
      }
    }
    if (shouldCreateCalendar && action !== "google") {
      downloadFollowUpCalendar(client, followUpDate, message, messages, appSettings);
    }
    setFollowUpClientId(null);
    if (action === "google") {
      window.open(googleCalendarHref(client, followUpDate, description), "_blank", "noopener,noreferrer");
    }
    if ((action === "textLog" || action === "text") && client.phone) {
      window.setTimeout(() => {
        window.location.href = `sms:${client.phone}&body=${encodeURIComponent(message)}`;
      }, 50);
    }
    if ((action === "emailLog" || action === "email") && client.email) {
      const subject = encodeURIComponent(messages.emailSubject || `${appSettings.company} follow-up`);
      window.setTimeout(() => {
        window.location.href = `mailto:${client.email}?subject=${subject}&body=${encodeURIComponent(message)}`;
      }, 50);
    }
  }

  function clearFollowUp(client) {
    if (!client.followUpDate && client.leadStatus !== "Follow-Up") {
      alert("This client has no CRM follow-up to clear.");
      return;
    }
    const ok = window.confirm(
      "Clear this follow-up from the CRM? If you already imported it into iPhone Calendar, delete that calendar event in the Calendar app too."
    );
    if (!ok) return;

    updateClient(
      client.id,
      {
        followUpDate: "",
        leadStatus: client.leadStatus === "Follow-Up" ? "Contacted" : client.leadStatus,
      },
      makeTimelineEntry({
        type: "follow_up",
        content: "Follow-up cleared from CRM by long press.",
        createdBy: "CRM",
      })
    );
  }

  function quickAction(client, action) {
    if (action === "call") {
      if (!client.phone) {
        alert("This client has no phone number.");
        return;
      }
      const result = window.prompt("Call result: Connected, No Answer, or Left Voicemail", "No Answer");
      if (result) addCommunication(client.id, result === "No Answer" ? "Called - No Answer" : `Called - ${result}`);
      window.location.href = `tel:${client.phone}`;
    }
    if (action === "text") {
      if (!client.phone) {
        alert("This client has no phone number.");
        return;
      }
      addCommunication(client.id, "Text Sent");
      window.location.href = `sms:${client.phone}`;
    }
    if (action === "email") {
      if (!client.email) {
        alert("This client has no email address.");
        return;
      }
      addCommunication(client.id, "Email Sent");
      window.location.href = `mailto:${client.email}`;
    }
    if (action === "estimate") {
      updateClient(
        client.id,
        { leadStatus: client.leadStatus === "New Lead" ? "Contacted" : client.leadStatus },
        makeTimelineEntry({ type: "estimate", content: "Estimate draft opened", createdBy: "Sales" })
      );
      window.setTimeout(() => {
        window.location.href = createEstimateHref(client, isSalesTeamView || isLimitedClient(client));
      }, 50);
    }
    if (action === "estimateSent") addCommunication(client.id, "Estimate Sent");
    if (action === "acceptInvoice") {
      const balance = numberValue(client.balanceDue || client.estimateAmount);
      updateClient(
        client.id,
        {
          leadStatus: "Won",
          estimateAcceptedAt: client.estimateAcceptedAt || nowISO(),
          paymentStatus: client.paymentStatus === "Paid" ? "Paid" : "Balance Due",
          balanceDue: client.paymentStatus === "Paid" ? "" : balance ? String(Math.round(balance)) : client.balanceDue,
        },
        makeTimelineEntry({ type: "estimate", content: "Estimate accepted. Invoice opened.", createdBy: "Sales" })
      );
      window.setTimeout(() => {
        window.location.href = createInvoiceHref({ ...client, leadStatus: "Won" }, visibleSavedInvoices);
      }, 50);
    }
    if (action === "followUp") {
      setFollowUpClientId(client.id);
    }
    if (action === "invoice") {
      updateClient(
        client.id,
        { paymentStatus: "Balance Due" },
        makeTimelineEntry({ type: "invoice", content: "Invoice created", createdBy: "Sales" })
      );
      window.setTimeout(() => {
        window.location.href = createInvoiceHref(client, visibleSavedInvoices);
      }, 50);
    }
    if (action === "note") {
      const note = window.prompt("Add note");
      if (note) updateClient(client.id, {}, makeTimelineEntry({ type: "note", content: note, createdBy: "Sales" }));
    }
    if (action === "paid") {
      updateClient(
        client.id,
        { paymentStatus: "Paid", balanceDue: "" },
        makeTimelineEntry({ type: "invoice", content: "Payment marked paid. Request review.", createdBy: "Sales" })
      );
    }
    if (action === "remarket") {
      updateClient(
        client.id,
        { leadStatus: "Follow-Up", followUpDate: todayISO() },
        makeTimelineEntry({
          type: "status_change",
          content: "Moved from Archive to Follow-Up for remarketing.",
          createdBy: "CRM",
        })
      );
      setActiveView("Clients");
      setSelectedClientId(client.id);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-slate-100 p-4 text-slate-900">
        <form onSubmit={unlockCrm} className="w-full max-w-sm rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-bold text-slate-500">Contractor CRM</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Enter CRM PIN</h1>
          <input
            type="password"
            value={accessPin}
            onChange={(e) => setAccessPin(e.target.value)}
            className="mt-4 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-700"
            autoFocus
          />
          {accessError && <p className="mt-2 text-sm font-bold text-red-600">{accessError}</p>}
          <button className="mt-4 w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">
            Unlock CRM
          </button>
        </form>
      </main>
    );
  }

  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-slate-100 text-slate-900 md:pb-20"
      style={{ paddingBottom: "calc(5.75rem + env(safe-area-inset-bottom))" }}
    >
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""
        }&libraries=places`}
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("epf-google-places-ready"));
          }
        }}
      />
      <div className="mx-auto w-full max-w-7xl px-3 py-3 md:p-5">
        <header className="sticky top-0 z-20 -mx-3 border-b border-slate-200 bg-slate-100/95 px-3 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Link href="/" className="text-xs font-bold text-blue-700 hover:underline">
                Back to menu
              </Link>
              <h1 className="truncate text-xl font-black md:text-3xl">
                {isSalesTeamView ? "Sales Team Watch" : "Sales CRM"}
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                {isSalesTeamView ? "Sales team watch - Calgary records only. " : ""}
                {syncStatus}
              </p>
            </div>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2 md:flex md:w-auto md:max-w-none md:flex-wrap md:justify-end">
              {accessMode === "master" && (
                <button
                  type="button"
                  onClick={toggleSalesTeamWatch}
                  className={`hidden rounded-md border px-3 py-2 text-sm font-black md:inline-flex ${
                    masterPreviewLimited
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  {masterPreviewLimited ? "Watching Team" : "Sales Team Watch"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveView("Archive")}
                className="hidden rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold md:inline-flex"
              >
                Archive ({archivedClients.length})
              </button>
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setLeadMenuOpen((open) => !open)}
                  className="min-h-11 w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800 md:w-auto"
                >
                  Add Lead
                </button>
                {leadMenuOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-2 rounded-lg border border-slate-200 bg-white p-2 shadow-xl md:left-auto md:w-56">
                  <button onClick={() => openNewClient("manual")} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                    Manual Lead
                  </button>
                  <button onClick={() => openNewClient("paste")} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                    Paste Lead / Email
                  </button>
                  <button onClick={() => openNewClient("voicemail")} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                    Voicemail Lead
                  </button>
                  <button onClick={() => openNewClient("phone")} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                    Quick Phone Lead
                  </button>
                  </div>
                )}
              </div>
              {accessMode === "master" && (
                <div className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setBackupMenuOpen((open) => !open)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                  >
                    Backup
                  </button>
                  {backupMenuOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                    <button onClick={exportBackup} className="block w-full rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                      Export JSON backup
                    </button>
                    <label className="block cursor-pointer rounded-md px-3 py-2 text-sm font-bold hover:bg-slate-100">
                      Import JSON backup
                      <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
                    </label>
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => setShowSettings(true)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                Settings
              </button>
              <button onClick={lockCrm} className="hidden rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold md:inline-flex">
                Lock
              </button>
              <details className="relative md:hidden">
                <summary className="min-h-11 cursor-pointer list-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                  More
                </summary>
                <div className="absolute right-0 z-30 mt-2 grid w-56 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                  {accessMode === "master" && (
                    <button
                      type="button"
                      onClick={toggleSalesTeamWatch}
                      className={`min-h-11 rounded-md px-3 py-2 text-left text-sm font-bold ${
                        masterPreviewLimited ? "bg-amber-50 text-amber-900" : "hover:bg-slate-100"
                      }`}
                    >
                      {masterPreviewLimited ? "Watching Team" : "Sales Team Watch"}
                    </button>
                  )}
                  <button onClick={() => setActiveView("Archive")} className="min-h-11 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                    Archive ({archivedClients.length})
                  </button>
                  {accessMode === "master" && (
                    <>
                      <button onClick={exportBackup} className="min-h-11 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                        Export Backup
                      </button>
                      <label className="block min-h-11 cursor-pointer rounded-md px-3 py-2 text-sm font-bold hover:bg-slate-100">
                        Import Backup
                        <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
                      </label>
                    </>
                  )}
                  <button onClick={lockCrm} className="min-h-11 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100">
                    Lock
                  </button>
                </div>
              </details>
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-amber-700">
            CRM syncs through the shared cloud store when configured. If offline, changes queue locally and sync when cloud returns.
          </p>
        </header>

        <DesktopTabs activeView={activeView} setActiveView={setActiveView} />

        {activeView === "Dashboard" && (
          <Dashboard
            stats={stats}
            clients={dailyClients}
            savedInvoices={visibleSavedInvoices}
            setActiveView={setActiveView}
            openClient={(client) => setSelectedClientId(client.id)}
            quickAction={quickAction}
            clearFollowUp={clearFollowUp}
          />
        )}

        {activeView === "Pipeline" && (
          <Pipeline
            clients={filteredClients}
            openClient={(client) => setSelectedClientId(client.id)}
            changeStatus={changeStatus}
          />
        )}

        {activeView === "Clients" && (
          <ClientsView
            clients={filteredClients}
            monthlyStats={clientMonthStats}
            savedInvoices={visibleSavedInvoices}
            filters={filters}
            setFilters={setFilters}
            filterOptions={filterOptions}
            search={search}
            setSearch={setSearch}
            openClient={(client) => setSelectedClientId(client.id)}
            editClient={editClient}
            deleteClient={deleteClient}
            quickAction={quickAction}
            clearFollowUp={clearFollowUp}
          />
        )}

        {activeView === "Calendar" && (
          <CalendarView clients={dailyClients} openClient={(client) => setSelectedClientId(client.id)} />
        )}

        {activeView === "Invoices" && (
          <InvoicesView clients={dailyClients} savedInvoices={visibleSavedInvoices} openClient={(client) => setSelectedClientId(client.id)} quickAction={quickAction} />
        )}

        {activeView === "Archive" && (
          <ArchiveView
            clients={archivedClients}
            openClient={(client) => setSelectedClientId(client.id)}
            quickAction={quickAction}
          />
        )}

        {showForm && (
          <ClientForm
            form={form}
            updateForm={updateForm}
            saveClient={saveClient}
            mode={leadFormMode}
            smartLeadText={smartLeadText}
            setSmartLeadText={setSmartLeadText}
            smartLeadParsed={smartLeadParsed}
            applyParsedLead={applyParsedLead}
            savedInvoices={visibleSavedInvoices}
            close={() => {
              setShowForm(false);
              setEditingId(null);
              setSmartLeadText("");
              setSmartLeadParsed(null);
            }}
            editing={Boolean(editingId)}
          />
        )}

        {selectedClient && (
          <ClientDetail
            client={selectedClient}
            savedInvoices={visibleSavedInvoices}
            close={() => setSelectedClientId(null)}
            editClient={editClient}
            updateClient={updateClient}
            changeStatus={changeStatus}
            quickAction={quickAction}
            clearFollowUp={clearFollowUp}
            addCommunication={addCommunication}
          />
        )}

        {followUpClient && (
          <FollowUpChooser
            client={followUpClient}
            settings={appSettings}
            close={() => setFollowUpClientId(null)}
            scheduleFollowUp={scheduleFollowUp}
          />
        )}

        {showSettings && (
          <SettingsPanel
            settings={appSettings}
            close={() => setShowSettings(false)}
            saveSettings={saveSettings}
          />
        )}
      </div>

      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </main>
  );
}

function DesktopTabs({ activeView, setActiveView }) {
  return (
    <nav className="my-4 hidden rounded-lg bg-white p-1 shadow-sm md:flex">
      {navItems.map((item) => (
        <button
          key={item}
          onClick={() => setActiveView(item)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-black ${
            activeView === item ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {item}
        </button>
      ))}
    </nav>
  );
}

function BottomNav({ activeView, setActiveView }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white md:hidden"
      style={{
        gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
      }}
    >
      {navItems.map((item) => (
        <button
          key={item}
          onClick={() => setActiveView(item)}
          className={`min-h-14 px-1 pt-2 text-[10px] font-black leading-tight ${activeView === item ? "text-blue-700" : "text-slate-500"}`}
        >
          <span className="block text-base leading-none">{item.slice(0, 1)}</span>
          <span className="block truncate">{mobileNavLabels[item] || item}</span>
        </button>
      ))}
    </nav>
  );
}

function LongPressCalendarButton({ client, message, messages, label, action, longPressAction, scheduleFollowUp }) {
  const timerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startLongPress() {
    longPressFiredRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      scheduleFollowUp(client, message, messages, longPressAction, "text");
    }, 650);
  }

  function handleClick(event) {
    if (longPressFiredRef.current) {
      event.preventDefault();
      longPressFiredRef.current = false;
      return;
    }
    scheduleFollowUp(client, message, messages, action, "text");
  }

  return (
    <button
      type="button"
      onPointerDown={startLongPress}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(event) => {
        event.preventDefault();
        clearTimer();
        scheduleFollowUp(client, message, messages, longPressAction, "text");
      }}
      onClick={handleClick}
      className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800"
    >
      {label}
    </button>
  );
}

function FollowUpActionButton({ primary = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        primary
          ? "min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-45"
          : "min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
      }
    >
      {children}
    </button>
  );
}

function FollowUpChooser({ client, settings, close, scheduleFollowUp }) {
  const messages = createFollowUpMessages(client, settings);
  const androidDevice = isAndroidDevice();
  const calendarAction = androidDevice ? "google" : "ics";
  const calendarLongPressAction = androidDevice ? "ics" : "google";
  const calendarLabel = androidDevice ? "Android Calendar" : "iPhone Calendar";
  const calendarLongPressLabel = androidDevice ? "Google calendar opens by default." : "iPhone calendar file downloads by default.";
  const options = [
    ["checkIn", "Option 1", "Friendly check-in", messages.textCheckIn, messages.emailCheckIn],
    ["estimate", "Option 2", "Estimate / booking follow-up", messages.textEstimate, messages.emailEstimate],
  ];

  return (
    <aside className="fixed inset-0 z-50 h-dvh overflow-hidden bg-slate-950/50 p-2 md:p-5">
      <section
        className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl"
        style={{ maxHeight: "calc(100dvh - 2.5rem)" }}
      >
        <header className="shrink-0 border-b border-slate-200 p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-blue-700">Follow Up</p>
              <h2 className="truncate text-xl font-black">{client.name || client.phone || "CRM lead"}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Calendar note saves both text options. {calendarLongPressLabel}.
              </p>
            </div>
            <button onClick={close} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black">
              Close
            </button>
          </div>
        </header>

        <div className="grid gap-3 overflow-auto p-3 md:grid-cols-2 md:p-4" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          {options.map(([key, eyebrow, title, textMessage, emailMessage]) => (
            <article key={key} className="rounded-lg border border-slate-300 bg-slate-50 p-3 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-500">{eyebrow}</p>
              <h3 className="mt-1 text-base font-black text-slate-950">{title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <LongPressCalendarButton
                  client={client}
                  message={textMessage}
                  messages={messages}
                  label={calendarLabel}
                  action={calendarAction}
                  longPressAction={calendarLongPressAction}
                  scheduleFollowUp={scheduleFollowUp}
                />
                <FollowUpActionButton
                  primary
                  disabled={!client.phone}
                  onClick={() => scheduleFollowUp(client, textMessage, messages, "textLog", "text")}
                >
                  Text + Log
                </FollowUpActionButton>
                <FollowUpActionButton
                  disabled={!client.email}
                  onClick={() => scheduleFollowUp(client, emailMessage, messages, "emailLog", "email")}
                >
                  Email + Log
                </FollowUpActionButton>
                <FollowUpActionButton onClick={() => scheduleFollowUp(client, textMessage, messages, "copy", "text")}>
                  Copy Message
                </FollowUpActionButton>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 text-slate-800">
                {textMessage}
              </p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}

function SettingsPanel({ settings, close, saveSettings }) {
  const [draft, setDraft] = useState(normalizeSettings(settings));
  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <aside className="fixed inset-0 z-50 h-dvh overflow-hidden bg-slate-950/50 p-2 md:p-5">
      <section
        className="mx-auto flex h-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl"
        style={{ maxHeight: "calc(100dvh - 2.5rem)" }}
      >
        <header className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-blue-700">CRM Settings</p>
              <h2 className="truncate text-xl font-black">App Adjustments</h2>
            </div>
            <button onClick={close} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black">
              Close
            </button>
          </div>
        </header>
        <div className="grid gap-3 overflow-auto p-3 md:grid-cols-2 md:p-4">
          <Input label="Your Name" value={draft.name} onChange={(v) => updateDraft("name", v)} />
          <Input label="Company" value={draft.company} onChange={(v) => updateDraft("company", v)} />
          <Input label="Title / Specialty" value={draft.title} onChange={(v) => updateDraft("title", v)} />
          <Input label="Phone" value={draft.phone} onChange={(v) => updateDraft("phone", v)} />
          <Input label="Email" value={draft.email} onChange={(v) => updateDraft("email", v)} />
          <Input label="Website" value={draft.website} onChange={(v) => updateDraft("website", v)} />
          <div className="md:col-span-2">
            <p className="text-xs font-black uppercase text-slate-500">Follow-up message templates</p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Available words: {"{firstName}"} {"{name}"} {"{company}"} {"{title}"} {"{service}"} {"{cityText}"} {"{estimateText}"} {"{website}"} {"{signature}"}
            </p>
          </div>
          {[
            ["Text Option 1", "textCheckInTemplate"],
            ["Text Option 2", "textEstimateTemplate"],
          ].map(([label, field]) => (
            <label key={field} className="block text-sm font-bold md:col-span-2">
              {label}
              <textarea
                value={draft[field] || ""}
                onChange={(e) => updateDraft(field, e.target.value)}
                className="mt-1 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-700"
              />
            </label>
          ))}
        </div>
        <footer
          className="grid gap-2 border-t border-slate-200 bg-white p-3 md:grid-cols-2"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button onClick={() => setDraft(defaultBusinessContact)} className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-black">
            Reset Default
          </button>
          <button onClick={() => saveSettings(draft)} className="rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">
            Save Settings
          </button>
        </footer>
      </section>
    </aside>
  );
}

function immediateActionReason(client = {}) {
  if (isFollowUpOverdue(client)) {
    return `Follow-up ${daysSinceISO(client.followUpDate)}d overdue`;
  }
  if (client.followUpDate && client.followUpDate <= todayISO() && client.leadStatus !== "Lost") {
    return "Follow-up due today";
  }
  if (client.leadStatus === "New Lead" && daysSinceISO(client.createdAt) > 1) {
    return `New lead waiting ${daysSinceISO(client.createdAt)}d`;
  }
  if (shouldMoveEstimateToFollowUp(client)) {
    return "Estimate waiting without action";
  }
  if (client.projectStatus === "Completed" && client.paymentStatus !== "Paid") {
    return "Completed job unpaid";
  }
  if (client.paymentStatus === "Balance Due") {
    return "Balance due";
  }
  if (client.leadStatus === "Won" && client.projectStatus === "Not Scheduled") {
    return "Won job not scheduled";
  }
  return "";
}

function immediateActionPriority(client = {}) {
  if (isFollowUpOverdue(client)) return 0;
  if (client.paymentStatus === "Balance Due") return 1;
  if (client.projectStatus === "Completed" && client.paymentStatus !== "Paid") return 2;
  if (shouldMoveEstimateToFollowUp(client)) return 3;
  if (client.followUpDate && client.followUpDate <= todayISO()) return 4;
  if (client.leadStatus === "New Lead" && daysSinceISO(client.createdAt) > 1) return 5;
  return 9;
}

function dailyQueueReason(client = {}) {
  if (client.leadStatus === "New Lead") return "New lead needs first contact";
  if (client.followUpDate && client.followUpDate <= todayISO()) return "Follow-up due";
  if (shouldMoveEstimateToFollowUp(client)) return "Estimate is waiting";
  if (client.leadStatus === "Estimate Sent") return "Estimate sent";
  if (client.leadStatus === "Won" && client.projectStatus === "Not Scheduled") return "Won job needs schedule";
  if (client.paymentStatus === "Balance Due") return "Balance due";
  return nextClientStep(client);
}

function DashboardQueue({ title, subtitle, clients, emptyText, openClient, quickAction, primaryAction = "open", tone = "slate" }) {
  const toneClass =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <section className={`rounded-lg p-3 ${crmPanelClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="text-xs font-bold text-slate-500">{subtitle}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${toneClass}`}>{clients.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {clients.slice(0, 5).map((client) => (
          <article key={`${title}-${client.id}`} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <button onClick={() => openClient(client)} className="w-full min-w-0 text-left">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-black text-slate-950">{client.name || client.phone || "Unnamed lead"}</span>
                  <span className="block truncate text-xs font-semibold text-slate-500">
                    {[client.service, client.city, client.assignedTo || "Unassigned"].filter(Boolean).join(" - ")}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-black text-slate-700">{money(client.estimateAmount)}</span>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-700">{dailyQueueReason(client)}</p>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => quickAction(client, primaryAction === "followUp" ? "followUp" : primaryAction === "invoice" ? "invoice" : "call")}
                className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white"
              >
                {primaryAction === "followUp" ? "Follow Up" : primaryAction === "invoice" ? "Invoice" : "Call"}
              </button>
              <button onClick={() => openClient(client)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                Open
              </button>
            </div>
          </article>
        ))}
        {!clients.length && <p className="rounded-md border border-dashed border-slate-200 p-3 text-sm font-bold text-slate-500">{emptyText}</p>}
      </div>
    </section>
  );
}

function ImmediateActionPanel({ clients, openClient, quickAction, setActiveView }) {
  const urgentClients = clients
    .map((client) => ({ client, reason: immediateActionReason(client) }))
    .filter((item) => item.reason)
    .sort((a, b) => immediateActionPriority(a.client) - immediateActionPriority(b.client))
    .slice(0, 5);

  if (!urgentClients.length) return null;

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-red-950">Immediate Action</h2>
          <p className="text-xs font-bold text-red-700">{urgentClients.length} urgent client(s) need attention</p>
        </div>
        <button onClick={() => setActiveView("Clients")} className="rounded-md bg-white px-3 py-2 text-sm font-black text-red-800">
          All
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {urgentClients.map(({ client, reason }) => (
          <article key={client.id} className="rounded-md border border-red-200 bg-white p-3 shadow-sm">
            <button onClick={() => openClient(client)} className="block w-full min-w-0 text-left">
              <p className="truncate font-black text-slate-950">{client.name || client.phone || "Unnamed lead"}</p>
              <p className="mt-0.5 text-sm font-bold text-red-700">{reason}</p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {[client.service, client.city, client.assignedTo || "Unassigned"].filter(Boolean).join(" - ")}
              </p>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button onClick={() => quickAction(client, "call")} className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white">
                Call
              </button>
              <button onClick={() => quickAction(client, "text")} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                Text
              </button>
              <button onClick={() => quickAction(client, "followUp")} className="min-h-11 rounded-md border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-black text-white">
                Follow Up
              </button>
              <button onClick={() => openClient(client)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                Open
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Dashboard({ stats, clients, savedInvoices = [], setActiveView, openClient, quickAction }) {
  const openLeads = clients.filter((client) => !["Won", "Lost"].includes(client.leadStatus));
  const wonClients = clients.filter((client) => client.leadStatus === "Won");
  const sentEstimates = clients.filter((client) => client.leadStatus === "Estimate Sent" || client.estimateIds?.length);
  const overdueFollowUps = clients.filter(isFollowUpOverdue);
  const newLeadQueue = clients
    .filter((client) => client.leadStatus === "New Lead")
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  const followUpQueue = clients
    .filter((client) => client.followUpDate && client.followUpDate <= todayISO() && !["Won", "Lost"].includes(client.leadStatus))
    .sort((a, b) => String(a.followUpDate || "").localeCompare(String(b.followUpDate || "")));
  const estimateQueue = clients
    .filter((client) => client.leadStatus === "Estimate Sent" || shouldMoveEstimateToFollowUp(client))
    .sort((a, b) => new Date(a.estimateSentAt || a.updatedAt || 0).getTime() - new Date(b.estimateSentAt || b.updatedAt || 0).getTime());
  const moneyQueue = clients
    .filter((client) => client.paymentStatus === "Balance Due" || (client.projectStatus === "Completed" && client.paymentStatus !== "Paid"))
    .sort((a, b) => numberValue(b.balanceDue || b.estimateAmount) - numberValue(a.balanceDue || a.estimateAmount));
  const pipelineValue = openLeads.reduce((sum, client) => sum + numberValue(client.estimateAmount), 0);
  const closeRate = sentEstimates.length ? Math.round((wonClients.length / sentEstimates.length) * 100) : 0;
  const invoiceValue = savedInvoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const invoiceTotalDue = clients.reduce((sum, client) => sum + numberValue(client.balanceDue), 0);
  const actionCount = newLeadQueue.length + followUpQueue.length + estimateQueue.length + moneyQueue.length;
  const ownerRows = [...new Set(clients.map((client) => client.assignedTo || "Unassigned"))]
    .map((owner) => ({
      owner,
      leads: clients.filter((client) => (client.assignedTo || "Unassigned") === owner && client.leadStatus !== "Lost").length,
      due: clients.filter((client) => (client.assignedTo || "Unassigned") === owner && client.followUpDate && client.followUpDate <= todayISO()).length,
      balance: clients
        .filter((client) => (client.assignedTo || "Unassigned") === owner)
        .reduce((sum, client) => sum + numberValue(client.balanceDue), 0),
    }))
    .sort((a, b) => b.due - a.due || b.leads - a.leads)
    .slice(0, 4);
  return (
    <section className="space-y-4">
      <section className={`rounded-lg p-3 ${crmPanelClass}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Daily Command Center</p>
            <h2 className="text-2xl font-black text-slate-950">{actionCount ? `${actionCount} active action(s)` : "No urgent CRM actions"}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Work top to bottom: new leads, follow-ups, estimates, then money.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            <button onClick={() => setActiveView("Clients")} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black">{newLeadQueue.length}</p>
              <p className="text-xs font-bold text-slate-500">New leads</p>
            </button>
            <button onClick={() => setActiveView("Clients")} className="rounded-md border border-red-200 bg-red-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black text-red-800">{followUpQueue.length}</p>
              <p className="text-xs font-bold text-red-700">Follow-ups</p>
            </button>
            <button onClick={() => setActiveView("Pipeline")} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black text-amber-900">{estimateQueue.length}</p>
              <p className="text-xs font-bold text-amber-800">Estimates</p>
            </button>
            <button onClick={() => setActiveView("Invoices")} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black">{moneyQueue.length}</p>
              <p className="text-xs font-bold text-slate-500">Money</p>
            </button>
          </div>
        </div>
      </section>

      <ImmediateActionPanel clients={clients} openClient={openClient} quickAction={quickAction} setActiveView={setActiveView} />

      <div className="grid gap-4 xl:grid-cols-4">
        <DashboardQueue
          title="1. New Leads"
          subtitle="Contact first. Oldest first."
          clients={newLeadQueue}
          emptyText="No untouched new leads."
          openClient={openClient}
          quickAction={quickAction}
          primaryAction="call"
        />
        <DashboardQueue
          title="2. Follow-Ups"
          subtitle="Due today or overdue."
          clients={followUpQueue}
          emptyText="No follow-ups due."
          openClient={openClient}
          quickAction={quickAction}
          primaryAction="followUp"
          tone="red"
        />
        <DashboardQueue
          title="3. Estimates"
          subtitle="Sent estimates waiting for answer."
          clients={estimateQueue}
          emptyText="No estimates waiting."
          openClient={openClient}
          quickAction={quickAction}
          primaryAction="followUp"
          tone="amber"
        />
        <DashboardQueue
          title="4. Money"
          subtitle="Invoices and balances to collect."
          clients={moneyQueue}
          emptyText="No balance due."
          openClient={openClient}
          quickAction={quickAction}
          primaryAction="invoice"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className={`rounded-lg p-3 ${crmPanelClass}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Pipeline Health</h2>
            <button onClick={() => setActiveView("Pipeline")} className="text-sm font-bold text-blue-700">
              Board
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setActiveView("Pipeline")} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black">{money(pipelineValue)}</p>
              <p className="text-xs font-bold text-slate-500">Open pipeline</p>
            </button>
            <button onClick={() => setActiveView("Clients")} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black">{closeRate}%</p>
              <p className="text-xs font-bold text-slate-500">Won / estimated</p>
            </button>
            <button onClick={() => setActiveView("Clients")} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black">{overdueFollowUps.length}</p>
              <p className="text-xs font-bold text-slate-500">Overdue follow-ups</p>
            </button>
            <button onClick={() => setActiveView("Invoices")} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
              <p className="text-xl font-black">{money(invoiceTotalDue || invoiceValue)}</p>
              <p className="text-xs font-bold text-slate-500">Invoice exposure</p>
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {leadStatuses.filter((status) => status !== "Lost").map((status) => {
              const count = clients.filter((client) => client.leadStatus === status).length;
              const pct = clients.length ? Math.round((count / clients.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs font-black text-slate-600">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {stats.slice(0, 4).map((stat) => (
              <button
                key={stat.label}
                onClick={() => setActiveView(stat.label === "Balance Due" ? "Invoices" : "Clients")}
                className={`rounded-lg p-3 text-left transition hover:border-blue-300 hover:shadow-lg ${crmCardClass}`}
              >
                <p className="text-xs font-black uppercase text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-black">{stat.count}</p>
                <p className="text-sm font-bold text-slate-500">{money(stat.amount)}</p>
              </button>
            ))}
          </div>

          <div className={`rounded-lg p-3 ${crmPanelClass}`}>
            <h2 className="text-lg font-black">Ownership</h2>
            <div className="mt-3 space-y-2">
              {ownerRows.map((row) => (
                <button key={row.owner} onClick={() => setActiveView("Clients")} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-left shadow-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{row.owner}</span>
                    <span className="block text-xs font-bold text-slate-500">{row.leads} active leads</span>
                  </span>
                  <span className="text-right text-xs font-black text-slate-600">
                    {row.due} due<br />
                    {money(row.balance)}
                  </span>
                </button>
              ))}
              {!ownerRows.length && <p className="text-sm font-bold text-slate-500">No active owners yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function Pipeline({ clients, openClient, changeStatus }) {
  const pipelineStatuses = leadStatuses.filter((status) => status !== "Lost");

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-black">Pipeline</h2>
          <p className="text-sm font-semibold text-slate-500">Move leads with the stage menu on each card.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 pb-2 md:flex-row md:overflow-x-auto">
        {pipelineStatuses.map((stage) => {
          const stageClients = clients.filter((client) => client.leadStatus === stage);
          return (
            <section
              key={stage}
              className={`rounded-lg p-3 md:min-w-[240px] md:flex-1 ${crmPanelClass}`}
            >
              <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-white py-1">
                <h3 className="text-sm font-black">{stage}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                  {stageClients.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageClients.map((client) => (
                  <PipelineCard
                    key={client.id}
                    client={client}
                    openClient={openClient}
                    changeStatus={changeStatus}
                  />
                ))}
                {stageClients.length === 0 && (
                  <p className="rounded-md border border-dashed border-slate-200 p-3 text-center text-xs font-bold text-slate-400">
                    No leads
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function PipelineCard({ client, openClient, changeStatus, compact = false }) {
  return (
    <article className={`rounded-md border bg-white shadow-sm ${compact ? "p-2" : "p-3"} ${needsReminder(client) ? "border-amber-400 shadow-amber-200" : "border-slate-300 shadow-slate-200"}`}>
      <button onClick={() => openClient(client)} className="w-full text-left">
        <p className="font-black text-slate-950">{client.name || "Unnamed Lead"}</p>
        {!compact && <p className="mt-1 text-sm font-semibold text-slate-600">{client.service || "No service"}</p>}
        <p className="text-xs font-bold text-slate-500">{[compact ? client.service : "", client.city].filter(Boolean).join(" - ") || "No city"}</p>
      </button>
      <div className={`mt-2 grid gap-2 text-xs font-bold text-slate-600 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <p>{money(client.estimateAmount)}</p>
        {!compact && <p>Next: {client.followUpDate || "-"}</p>}
        <p className={compact ? "" : "col-span-2"}>Last: {lastContactDate(client) || "-"}</p>
      </div>
      <select
        value={client.leadStatus}
        onChange={(e) => changeStatus(client.id, "leadStatus", e.target.value)}
        className="mt-3 w-full rounded-md border border-slate-300 bg-white p-2 text-xs font-bold"
      >
        {leadStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
    </article>
  );
}

function ClientsView({ clients, monthlyStats, savedInvoices, filters, setFilters, filterOptions, search, setSearch, openClient, editClient, deleteClient, quickAction, clearFollowUp }) {
  const [controlsOpen, setControlsOpen] = useState(false);
  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    Object.values(filters).filter((value) => value && value !== "All").length;

  return (
    <section className="space-y-3">
      <div className={`rounded-lg p-3 ${crmPanelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">Clients</h2>
            <p className="text-xs font-bold text-slate-500">
              {clients.length} shown{activeFilterCount ? ` • ${activeFilterCount} search/filter active` : ""}
            </p>
            {monthlyStats && (
              <p className="mt-0.5 text-xs font-black text-blue-700">
                {monthlyStats.label}: {monthlyStats.count} {monthlyStats.count === 1 ? "client" : "clients"} added · {monthlyStats.won} won · {money(monthlyStats.amount)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilters({
                    status: "All",
                    salesperson: "All",
                    city: "All",
                    service: "All",
                    paymentStatus: "All",
                    special: "All",
                  });
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setControlsOpen((open) => !open)}
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800"
            >
              Search / Filters
            </button>
          </div>
        </div>
        {controlsOpen && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-700"
              placeholder="Search name, phone, email, city, notes..."
            />
            <div className="mt-3 grid gap-2 md:grid-cols-6">
              <Filter label="Status" value={filters.status} options={["All", ...leadStatuses.filter((status) => status !== "Lost")]} onChange={(v) => setFilters({ ...filters, status: v })} />
              <Filter label="Salesperson" value={filters.salesperson} options={["All", ...filterOptions.salesperson]} onChange={(v) => setFilters({ ...filters, salesperson: v })} />
              <Filter label="City" value={filters.city} options={["All", ...filterOptions.city]} onChange={(v) => setFilters({ ...filters, city: v })} />
              <Filter label="Service" value={filters.service} options={["All", ...filterOptions.service]} onChange={(v) => setFilters({ ...filters, service: v })} />
              <Filter label="Payment" value={filters.paymentStatus} options={["All", ...paymentStatuses]} onChange={(v) => setFilters({ ...filters, paymentStatus: v })} />
              <Filter label="Special" value={filters.special} options={["All", "Follow-up overdue", "Balance due", "Completed unpaid"]} onChange={(v) => setFilters({ ...filters, special: v })} />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            estimates={getClientEstimates(client, savedInvoices)}
            openClient={openClient}
            editClient={editClient}
            deleteClient={deleteClient}
            quickAction={quickAction}
            clearFollowUp={clearFollowUp}
          />
        ))}
      </div>
      {clients.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
          No clients match those filters.
        </div>
      )}
    </section>
  );
}

function ClientCard({ client, estimates = [], openClient, editClient, deleteClient, quickAction, clearFollowUp }) {
  const lastContact = lastContactDate(client);
  const note = clientCardNote(client);

  return (
    <article className={`rounded-lg p-3 transition hover:border-blue-300 hover:shadow-lg ${crmCardClass} ${needsReminder(client) ? "ring-2 ring-amber-300" : ""}`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <button onClick={() => openClient(client)} className="min-w-0 text-left">
          <h3 className="truncate text-lg font-black">{client.name || "Unnamed Lead"}</h3>
          <p className="mt-1 break-words text-sm font-semibold text-slate-600">{[client.service, client.city].filter(Boolean).join(" - ") || "No service"}</p>
        </button>
        <div className="flex min-w-0 flex-wrap gap-1 sm:justify-end">
          <StatusBadge value={client.leadStatus} />
          <PaymentBadge value={client.paymentStatus} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        <Info label="Phone" value={client.phone} />
        <Info label="Estimate" value={money(client.estimateAmount)} />
        <Info label="Saved Estimates" value={estimates.length ? `${estimates.length}` : "-"} />
        <Info label="Follow-Up" value={client.followUpDate || "-"} />
        <Info label="Sales" value={client.assignedTo || "-"} />
      </div>

      <button
        type="button"
        onClick={() => openClient(client)}
        className="mt-3 block w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left"
      >
        <p className="text-xs font-black uppercase text-slate-500">
          Last contact: {lastContact || "No contact logged"}
        </p>
        <p className="mt-1 line-clamp-2 break-words text-sm font-semibold text-slate-700">
          {note || "No note yet"}
        </p>
      </button>

      <WorkflowWarnings client={client} />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button onClick={() => quickAction(client, "call")} className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
          Call
        </button>
        <button onClick={() => quickAction(client, "text")} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
          Text
        </button>
        <button onClick={() => quickAction(client, "estimate")} className="min-h-11 rounded-md border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
          Estimate
        </button>
        <LongPressFollowUpButton client={client} quickAction={quickAction} clearFollowUp={clearFollowUp} />
        <button onClick={() => openClient(client)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
          Open
        </button>
        <details className="relative">
          <summary className="min-h-11 cursor-pointer list-none rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-sm font-bold sm:text-left">
            More
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-xl sm:left-0 sm:right-auto">
            {["email", "invoice", "note"].map((action) => (
              <button key={action} onClick={() => quickAction(client, action)} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-bold capitalize hover:bg-slate-100">
                {action === "estimate" ? "Build Estimate" : action}
              </button>
            ))}
            <button onClick={() => deleteClient(client.id)} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50">
              Delete
            </button>
          </div>
        </details>
      </div>
    </article>
  );
}

function CalendarView({ clients, openClient }) {
  const dated = clients
    .flatMap((client) => [
      client.followUpDate && { date: client.followUpDate, label: "Follow-up", client },
      client.estimateDate && { date: client.estimateDate, label: "Estimate", client },
      client.startDate && { date: client.startDate, label: "Start", client },
      client.completedDate && { date: client.completedDate, label: "Completed", client },
    ])
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className={`rounded-lg p-3 ${crmPanelClass}`}>
      <h2 className="text-xl font-black">Calendar</h2>
      <div className="mt-3 space-y-2">
        {dated.map((item) => (
          <button key={`${item.client.id}-${item.label}-${item.date}`} onClick={() => openClient(item.client)} className="grid w-full gap-1 rounded-md border border-slate-300 bg-white p-3 text-left shadow-sm hover:border-blue-300 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <span className="min-w-0 break-words">
              <b>{item.date}</b> {item.label}
            </span>
            <span className="min-w-0 break-words text-sm font-bold text-slate-600 sm:text-right">{item.client.name}</span>
          </button>
        ))}
        {!dated.length && <p className="text-sm font-bold text-slate-500">No dated work yet.</p>}
      </div>
    </section>
  );
}

function InvoicesView({ clients, savedInvoices = [], openClient, quickAction }) {
  const invoiceClients = clients.filter(
    (client) => client.paymentStatus !== "No Invoice" || client.projectStatus === "Completed" || summarizeClientInvoices(client, savedInvoices).attached.length
  );

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black">Invoices & Payments</h2>
      {invoiceClients.map((client) => {
        const invoiceSummary = summarizeClientInvoices(client, savedInvoices);
        return (
        <article key={client.id} className={`rounded-lg p-3 ${crmCardClass}`}>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <button onClick={() => openClient(client)} className="min-w-0 text-left">
              <h3 className="break-words font-black">{client.name || "Unnamed Client"}</h3>
              <p className="break-words text-sm font-semibold text-slate-600">{client.service || "No service"}</p>
            </button>
            <div className="min-w-0 sm:text-right">
              <PaymentBadge value={client.paymentStatus} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-3">
            <Info label="Invoices" value={invoiceSummary.attached.length ? `${invoiceSummary.attached.length} / ${money(invoiceSummary.total)}` : "-"} />
            <Info label="Paid" value={money(client.paymentAmount)} />
            <Info label="Balance" value={money(client.balanceDue)} />
          </div>
          {invoiceSummary.attached.length > 0 && (
            <div className="mt-3 grid gap-2">
              {invoiceSummary.attached.slice(0, 2).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoice-basic?id=${encodeURIComponent(invoice.id)}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800"
                >
                  <span className="truncate">{invoiceLabel(invoice)}</span>
                  <span>{money(invoiceTotal(invoice))}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
            <button onClick={() => quickAction(client, "invoice")} className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
              Create Invoice
            </button>
            <button onClick={() => quickAction(client, "paid")} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
              Mark Paid
            </button>
          </div>
        </article>
      );
      })}
      {!invoiceClients.length && <p className={`rounded-lg p-8 text-center text-sm font-bold text-slate-500 ${crmPanelClass}`}>No invoices yet.</p>}
    </section>
  );
}

function ArchiveView({ clients, openClient, quickAction }) {
  const archivedValue = clients.reduce((sum, client) => sum + numberValue(client.estimateAmount), 0);

  return (
    <section className="space-y-3">
      <section className={`rounded-lg p-3 ${crmPanelClass}`}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <h2 className="text-xl font-black">Archive</h2>
            <p className="text-sm font-bold text-slate-500">
              Lost clients are hidden from daily dashboard, clients, calendar, invoices, and pipeline views.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left sm:text-right">
            <p className="text-xs font-black uppercase text-slate-500">Remarketing pool</p>
            <p className="text-lg font-black text-slate-950">{clients.length} / {money(archivedValue)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {clients.map((client) => (
          <article key={client.id} className={`rounded-lg p-3 ${crmCardClass}`}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <button onClick={() => openClient(client)} className="min-w-0 text-left">
                <h3 className="truncate text-lg font-black">{client.name || "Unnamed Lead"}</h3>
                <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                  {[client.service, client.city].filter(Boolean).join(" - ") || "No service"}
                </p>
              </button>
              <StatusBadge value={client.leadStatus} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <Info label="Phone" value={client.phone} />
              <Info label="Estimate" value={money(client.estimateAmount)} />
              <Info label="Lost Since" value={(client.updatedAt || client.createdAt || "").slice(0, 10) || "-"} />
              <Info label="Sales" value={client.assignedTo || "-"} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button onClick={() => quickAction(client, "remarket")} className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
                Reopen for Remarketing
              </button>
              <button onClick={() => openClient(client)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                Open
              </button>
              <button onClick={() => quickAction(client, "note")} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
                Add Note
              </button>
            </div>
          </article>
        ))}
      </div>

      {!clients.length && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
          No archived lost clients.
        </div>
      )}
    </section>
  );
}

function nextClientStep(client = {}) {
  if (client.leadStatus === "New Lead") return "New lead: call or text now, then set a follow-up.";
  if (client.leadStatus === "Follow-Up") return client.followUpDate ? `Follow up scheduled for ${client.followUpDate}.` : "Follow-up lead: choose a date and send a message.";
  if (client.leadStatus === "Estimate Booked") return "Estimate booked: confirm appointment and address.";
  if (client.leadStatus === "Estimate Sent") return "Estimate sent: follow up and ask if they want the next date.";
  if (client.leadStatus === "Won" && client.projectStatus === "Not Scheduled") return "Won job: schedule the start date.";
  if (client.projectStatus === "Completed" && client.paymentStatus !== "Paid") return "Completed job: collect balance or send invoice.";
  if (client.paymentStatus === "Balance Due") return "Balance due: follow up on payment.";
  return "Keep contact info updated and log the next client action.";
}

function ClientDetail({ client, savedInvoices = [], close, editClient, updateClient, changeStatus, quickAction, clearFollowUp, addCommunication }) {
  const attachedEstimates = getClientEstimates(client, savedInvoices);
  const invoiceSummary = summarizeClientInvoices(client, savedInvoices);
  const editField = (field, label, currentValue = "", displayValue = currentValue) => {
    const nextValue = window.prompt(`Edit ${label}`, String(currentValue || ""));
    if (nextValue === null) return;
    updateClient(
      client.id,
      { [field]: nextValue },
      makeTimelineEntry({
        type: "edit",
        content: `${label} changed from ${displayValue || "-"} to ${nextValue || "-"}.`,
        createdBy: "CRM",
      })
    );
  };

  return (
    <aside className="fixed inset-0 z-40 h-dvh overflow-hidden bg-slate-950/40 md:p-4">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-slate-100 shadow-2xl md:rounded-lg">
        <header className="shrink-0 border-b border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-slate-500">Client Detail</p>
              <h2 className="truncate text-xl font-black">{client.name || "Unnamed Client"}</h2>
              <p className="text-sm font-bold text-slate-600">{money(client.estimateAmount)} estimate</p>
            </div>
            <button onClick={close} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black">
              Close
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge label="Lead" value={client.leadStatus} />
            <PaymentBadge label="Payment" value={client.paymentStatus} />
            <ProjectBadge label="Job" value={client.projectStatus} />
          </div>
          <WorkflowWarnings client={client} />
        </header>

        <div className="flex-1 space-y-3 overflow-auto p-3">
          <CrmSection title="Daily Action" defaultOpen>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-black uppercase text-blue-900">Next best step</p>
              <p className="mt-1 text-sm font-bold text-blue-950">{nextClientStep(client)}</p>
            </div>
            <ClientActionGrid client={client} quickAction={quickAction} clearFollowUp={clearFollowUp} />
          </CrmSection>

          <CrmSection title="Contact Info" defaultOpen>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <EditableInfo label="Phone" value={client.phone} onEdit={() => editField("phone", "Phone", client.phone)} />
              <EditableInfo label="Email" value={client.email} onEdit={() => editField("email", "Email", client.email)} />
              <EditableInfo label="Address" value={client.address} onEdit={() => editField("address", "Address", client.address)} />
              <EditableInfo label="City" value={client.city} onEdit={() => editField("city", "City", client.city)} />
              <EditableInfo label="Source" value={client.source} onEdit={() => editField("source", "Source", client.source)} />
              <EditableInfo label="Assigned" value={client.assignedTo} onEdit={() => editField("assignedTo", "Assigned", client.assignedTo)} />
            </div>
            {(client.address || client.city) && (
              <a
                href={createGoogleMapsHref(client)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-900 md:w-auto"
              >
                Open Address in Google Maps
              </a>
            )}
          </CrmSection>

          <CrmSection title="Job Details">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <EditableInfo label="Service" value={client.service} onEdit={() => editField("service", "Service", client.service)} />
              <EditableInfo label="Square Footage" value={client.squareFootage} onEdit={() => editField("squareFootage", "Square Footage", client.squareFootage)} />
              <EditableInfo label="Work Needed" value={client.workNeeded} onEdit={() => editField("workNeeded", "Work Needed", client.workNeeded)} />
              <EditableInfo label="Ceiling Height" value={client.ceilingHeight} onEdit={() => editField("ceilingHeight", "Ceiling Height", client.ceilingHeight)} />
              <EditableInfo label="Asbestos" value={client.asbestosStatus} onEdit={() => editField("asbestosStatus", "Asbestos", client.asbestosStatus)} />
              <EditableInfo label="Start Date" value={client.startDate} onEdit={() => editField("startDate", "Start Date", client.startDate)} />
              <EditableInfo label="Completed" value={client.completedDate} onEdit={() => editField("completedDate", "Completed", client.completedDate)} />
            </div>
          </CrmSection>

          <CrmSection title="Estimate">
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-black uppercase text-amber-900">Next estimate step</p>
              <p className="mt-1 text-sm font-bold text-amber-950">
                Create the estimate first, then mark it sent after you send it to the client.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => quickAction(client, "estimate")} className="min-h-11 rounded-md bg-blue-700 px-3 py-2 text-sm font-black leading-tight text-white hover:bg-blue-800">
                  Create Estimate
                </button>
                <button onClick={() => quickAction(client, "estimateSent")} className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-black text-amber-900">
                  Mark Sent
                </button>
              </div>
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <EditableInfo label="Amount" value={money(client.estimateAmount)} onEdit={() => editField("estimateAmount", "Amount", client.estimateAmount, money(client.estimateAmount))} />
              <EditableInfo label="Estimate Date" value={client.estimateDate} onEdit={() => editField("estimateDate", "Estimate Date", client.estimateDate)} />
              <EditableInfo label="Sent At" value={client.estimateSentAt?.slice(0, 10)} onEdit={() => editField("estimateSentAt", "Sent At", client.estimateSentAt)} />
              <EditableInfo label="Accepted At" value={client.estimateAcceptedAt?.slice(0, 10)} onEdit={() => editField("estimateAcceptedAt", "Accepted At", client.estimateAcceptedAt)} />
            </div>
            <AttachedEstimates estimates={attachedEstimates} />
          </CrmSection>

          <CrmSection title="Status" defaultOpen>
            <div className="grid gap-2 md:grid-cols-3">
              <InlineStatus label="Lead Status" value={client.leadStatus} options={leadStatuses} onChange={(v) => changeStatus(client.id, "leadStatus", v)} />
              <InlineStatus label="Project Status" value={client.projectStatus} options={projectStatuses} onChange={(v) => changeStatus(client.id, "projectStatus", v)} />
              <InlineStatus label="Payment Status" value={client.paymentStatus} options={paymentStatuses} onChange={(v) => changeStatus(client.id, "paymentStatus", v)} />
              <DateInput label="Follow-Up Date" value={client.followUpDate} onChange={(v) => updateClient(client.id, { followUpDate: v }, makeTimelineEntry({ type: "status_change", content: `Follow-up date changed to ${v || "none"}` }))} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap">
              {communicationResults.map((result) => (
                <button key={result} onClick={() => addCommunication(client.id, result)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black">
                  {result}
                </button>
              ))}
            </div>
          </CrmSection>

          <CrmSection title="Payment">
            {invoiceSummary.attached.length > 0 && (
              <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black uppercase text-slate-500">Linked invoices</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {invoiceSummary.attached.length} invoice(s), {money(invoiceSummary.total)} total, {money(invoiceSummary.balance)} balance after recorded payments.
                </p>
              </div>
            )}
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <EditableInfo label="Deposit" value={money(client.depositAmount)} onEdit={() => editField("depositAmount", "Deposit", client.depositAmount, money(client.depositAmount))} />
              <EditableInfo label="Paid" value={money(client.paymentAmount)} onEdit={() => editField("paymentAmount", "Paid", client.paymentAmount, money(client.paymentAmount))} />
              <EditableInfo label="Balance" value={money(client.balanceDue)} onEdit={() => editField("balanceDue", "Balance", client.balanceDue, money(client.balanceDue))} />
            </div>
            {client.paymentStatus === "Paid" && (
              <button onClick={() => quickAction(client, "note")} className="mt-3 rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
                Request Review
              </button>
            )}
          </CrmSection>

          <CrmSection title="Timeline / Notes">
            {client.notes && <p className="mb-3 whitespace-pre-wrap rounded-md bg-white p-3 text-sm font-semibold text-slate-700">{client.notes}</p>}
            <Timeline entries={client.communicationLog || []} />
          </CrmSection>
        </div>

        <footer className="border-t border-slate-200 bg-white p-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <button onClick={() => editClient(client)} className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-black text-white">
            Edit Client
          </button>
        </footer>
      </div>
    </aside>
  );
}

function ClientForm({
  form,
  updateForm,
  saveClient,
  close,
  editing,
  mode,
  smartLeadText,
  setSmartLeadText,
  smartLeadParsed,
  applyParsedLead,
  savedInvoices = [],
}) {
  const isSmartMode = !editing && ["paste", "voicemail"].includes(mode);
  const isPhoneMode = !editing && mode === "phone";
  const attachedEstimates = editing ? getClientEstimates(form, savedInvoices) : [];
  const title = editing
    ? "Edit Client"
    : mode === "paste"
      ? "Paste Lead / Email"
      : mode === "voicemail"
        ? "Voicemail Lead"
        : mode === "phone"
          ? "Quick Phone Lead"
          : "Manual Lead";

  return (
    <aside className="fixed inset-0 z-50 h-dvh overflow-hidden bg-slate-950/40 p-2 md:p-4">
      <section className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl" style={{ maxHeight: "calc(100dvh - 2rem)" }}>
        <div className="shrink-0 border-b border-slate-200 p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-xl font-black">{title}</h2>
            <button onClick={close} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold">Close</button>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500">Required: name or phone. Service and city are optional.</p>
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-3 pb-24 md:p-4">
          {isSmartMode && (
            <FormGroup title={mode === "voicemail" ? "Voicemail / Call Notes" : "Paste Lead / Email"}>
              <textarea
                value={smartLeadText}
                onChange={(e) => setSmartLeadText(e.target.value)}
                className="min-h-44 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-700"
                placeholder={
                  mode === "voicemail"
                    ? "Hi this is Peter, my phone is 416..., I need popcorn ceiling removal in Oakville."
                    : "Name:\nPhone:\nEmail:\nCity:\nService:\nMessage:"
                }
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => applyParsedLead()} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800">
                  Extract Lead
                </button>
                {smartLeadParsed && (
                  <p className="rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                    Create lead from this information? Review fields below, then save.
                  </p>
                )}
              </div>
            </FormGroup>
          )}

          {isPhoneMode ? (
            <FormGroup title="Missed Call">
              <Input label="Phone" value={form.phone} onChange={(v) => updateForm("phone", v)} />
              <Input label="Name" value={form.name} onChange={(v) => updateForm("name", v)} />
              <label className="block text-sm font-bold">
                Note
                <textarea value={form.notes || ""} onChange={(e) => updateForm("notes", e.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-700" />
              </label>
            </FormGroup>
          ) : (
            <>
              <FormGroup title="Client">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Name" value={form.name} onChange={(v) => updateForm("name", v)} />
                  <Input label="Phone" value={form.phone} onChange={(v) => updateForm("phone", v)} />
                  <Input label="Email" value={form.email} onChange={(v) => updateForm("email", v)} />
                  <Input label="City" value={form.city} onChange={(v) => updateForm("city", v)} />
                </div>
              </FormGroup>

              <FormGroup title="Job">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Service" value={form.service} onChange={(v) => updateForm("service", v)} />
                  <Input label="Square Footage / Size" value={form.squareFootage} onChange={(v) => updateForm("squareFootage", v)} />
                  <AddressInput
                    label="Address"
                    value={form.address}
                    onChange={(v) => updateForm("address", v)}
                    onCityChange={(v) => updateForm("city", v)}
                  />
                  <DateInput label="Requested Date" value={form.requestedDate} onChange={(v) => updateForm("requestedDate", v)} />
                </div>
                <label className="mt-3 block text-sm font-black">
                  Notes
                  <textarea value={form.notes || ""} onChange={(e) => updateForm("notes", e.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-700" />
                </label>
              </FormGroup>

              <FormGroup title="Workflow / Payment">
                <div className="grid gap-3 md:grid-cols-3">
                  <Select label="Lead Status" value={form.leadStatus} options={leadStatuses} onChange={(v) => updateForm("leadStatus", v)} />
                  <Select label="Project Status" value={form.projectStatus} options={projectStatuses} onChange={(v) => updateForm("projectStatus", v)} />
                  <Select label="Payment Status" value={form.paymentStatus} options={paymentStatuses} onChange={(v) => updateForm("paymentStatus", v)} />
                  <Input label="Estimate Amount" value={form.estimateAmount} onChange={(v) => updateForm("estimateAmount", v)} />
                  <DateInput label="Follow-Up Date" value={form.followUpDate} onChange={(v) => updateForm("followUpDate", v)} />
                  <Select label="Source" value={form.source} options={sources} onChange={(v) => updateForm("source", v)} />
                </div>
                {form.estimateAmount && ["New Lead", "Contacted"].includes(form.leadStatus) && (
                  <button onClick={() => updateForm("leadStatus", "Estimate Sent")} className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-black text-amber-900">
                    Set status to Estimate Sent
                  </button>
                )}
              </FormGroup>

              {editing && (
                <FormGroup title="Saved Estimates">
                  <AttachedEstimates estimates={attachedEstimates} />
                </FormGroup>
              )}

              <details className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-black uppercase text-slate-500">More details</summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input label="Assigned To" value={form.assignedTo} onChange={(v) => updateForm("assignedTo", v)} />
                  <SuggestInput label="Work Needed" value={form.workNeeded} options={workNeededOptions} onChange={(v) => updateForm("workNeeded", v)} />
                  <Input label="Ceiling Height" value={form.ceilingHeight} onChange={(v) => updateForm("ceilingHeight", v)} />
                  <Input label="Asbestos Status" value={form.asbestosStatus} onChange={(v) => updateForm("asbestosStatus", v)} />
                  <DateInput label="Estimate Date" value={form.estimateDate} onChange={(v) => updateForm("estimateDate", v)} />
                  <DateInput label="Start Date" value={form.startDate} onChange={(v) => updateForm("startDate", v)} />
                  <DateInput label="Completed Date" value={form.completedDate} onChange={(v) => updateForm("completedDate", v)} />
                  <Input label="Deposit" value={form.depositAmount} onChange={(v) => updateForm("depositAmount", v)} />
                  <Input label="Paid" value={form.paymentAmount} onChange={(v) => updateForm("paymentAmount", v)} />
                  <Input label="Balance Due" value={form.balanceDue} onChange={(v) => updateForm("balanceDue", v)} />
                  <SuggestInput label="Payment Method" value={form.paymentMethod} options={paymentMethodOptions} onChange={(v) => updateForm("paymentMethod", v)} />
                </div>
              </details>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-white p-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <button onClick={close} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-bold">Cancel</button>
          <button onClick={saveClient} className="flex-1 rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">
            {editing ? "Update Client" : "Save Lead"}
          </button>
        </div>
      </section>
    </aside>
  );
}

function taskList(clients) {
  return clients
    .flatMap((client) => {
      const tasks = [];
      if (client.leadStatus === "New Lead") tasks.push({ client, label: "New lead needs contact" });
      if (client.leadStatus === "Contacted" && !client.estimateIds?.length) tasks.push({ client, label: "Create estimate or follow up" });
      if (client.leadStatus === "Estimate Booked") tasks.push({ client, label: "Estimate appointment booked" });
      if (client.followUpDate && client.followUpDate <= todayISO() && client.leadStatus !== "Lost") {
        tasks.push({ client, label: isFollowUpOverdue(client) ? "Follow-up overdue" : "Follow-up today" });
      }
      if (client.leadStatus === "Estimate Sent") tasks.push({ client, label: "Estimate waiting for response" });
      if (client.paymentStatus === "Balance Due") tasks.push({ client, label: "Balance due" });
      if (client.leadStatus === "Won" && client.projectStatus === "Not Scheduled") tasks.push({ client, label: "Won job not scheduled" });
      return tasks;
    })
    .sort((a, b) => (needsReminder(a.client) === needsReminder(b.client) ? 0 : needsReminder(a.client) ? -1 : 1));
}

function FollowUpTaskList({ tasks, openClient, quickAction }) {
  if (!tasks.length) return <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-500">No urgent tasks.</p>;
  return (
    <div className="mt-3 space-y-2">
      {tasks.map((task, index) => (
        <article key={`${task.client.id}-${task.label}-${index}`} className="rounded-md border border-slate-300 bg-white p-3 shadow-sm shadow-slate-200">
          <button onClick={() => openClient(task.client)} className="w-full text-left">
            <p className="font-black">{task.client.name || "Unnamed Lead"}</p>
            <p className="text-sm font-bold text-amber-700">{task.label}</p>
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => quickAction(task.client, "call")} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Call</button>
            <button onClick={() => quickAction(task.client, "text")} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-black">Text</button>
            <button onClick={() => quickAction(task.client, "estimate")} className="rounded-md border border-blue-700 bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Estimate</button>
            <button onClick={() => quickAction(task.client, "followUp")} className="rounded-md border border-blue-700 bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Follow Up</button>
            <button onClick={() => quickAction(task.client, "note")} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-black">Note</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function WorkflowWarnings({ client }) {
  const warnings = [];
  if (client.leadStatus === "Won" && client.projectStatus === "Not Scheduled") {
    warnings.push("Won job not scheduled.");
  }
  if (client.projectStatus === "Completed" && client.paymentStatus !== "Paid") {
    warnings.push("Balance due / invoice needed.");
  }
  if (!warnings.length) return null;

  return (
    <div className="mt-3 space-y-1">
      {warnings.map((warning) => (
        <p key={warning} className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
          {warning}
        </p>
      ))}
    </div>
  );
}

function ActionButton({ primary = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        primary
          ? "min-h-11 rounded-md border border-blue-700 bg-blue-700 px-3 py-2 text-center text-sm font-black leading-tight text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-45"
          : "min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-sm font-black leading-tight text-slate-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
      }
    >
      {children}
    </button>
  );
}

function LongPressFollowUpButton({ client, quickAction, clearFollowUp, className = "" }) {
  const timerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startLongPress() {
    longPressFiredRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      clearFollowUp?.(client);
    }, 650);
  }

  function endLongPress() {
    clearTimer();
  }

  function handleClick(event) {
    if (longPressFiredRef.current) {
      event.preventDefault();
      longPressFiredRef.current = false;
      return;
    }
    quickAction(client, "followUp");
  }

  return (
    <button
      type="button"
      onPointerDown={startLongPress}
      onPointerUp={endLongPress}
      onPointerCancel={endLongPress}
      onPointerLeave={endLongPress}
      onContextMenu={(event) => {
        event.preventDefault();
        clearTimer();
        clearFollowUp?.(client);
      }}
      onClick={handleClick}
      title="Tap to schedule. Long press to clear follow-up."
      className={`min-h-11 rounded-md border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800 ${className}`}
    >
      Follow Up
    </button>
  );
}

function ClientActionGrid({ client, quickAction, clearFollowUp }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <ActionButton primary disabled={!client.phone} onClick={() => quickAction(client, "call")}>
        Call
      </ActionButton>
      <ActionButton disabled={!client.phone} onClick={() => quickAction(client, "text")}>
        Text
      </ActionButton>
      <ActionButton primary onClick={() => quickAction(client, "estimate")}>
        Estimate
      </ActionButton>
      <LongPressFollowUpButton
        client={client}
        quickAction={quickAction}
        clearFollowUp={clearFollowUp}
        className="min-h-11 text-center leading-tight shadow-sm"
      />
      <ActionButton primary onClick={() => quickAction(client, "acceptInvoice")}>
        Accept + Invoice
      </ActionButton>
      <details className="relative col-span-2">
        <summary className="min-h-11 cursor-pointer list-none rounded-md border border-slate-300 bg-white px-3 py-3 text-center text-sm font-black leading-tight text-slate-900 shadow-sm">
          More
        </summary>
        <div className="absolute left-0 right-0 z-20 mt-2 grid gap-1 rounded-lg border border-slate-300 bg-white p-2 shadow-xl">
          <button
            type="button"
            disabled={!client.email}
            onClick={() => quickAction(client, "email")}
            className="rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => quickAction(client, "invoice")}
            className="rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100"
          >
            Invoice
          </button>
          <button
            type="button"
            onClick={() => quickAction(client, "note")}
            className="rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-slate-100"
          >
            Note
          </button>
        </div>
      </details>
    </div>
  );
}

function AttachedEstimates({ estimates = [] }) {
  if (!estimates.length) {
    return (
      <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-500">
        No saved estimate attached yet.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {estimates.map((estimate) => {
        const total = estimate.totals?.total || 0;
        const date = String(estimate.updatedAt || estimate.savedAt || estimate.createdAt || estimate.date || "").slice(0, 10);
        return (
          <article key={estimate.id} className="rounded-md border border-slate-300 bg-white p-3 shadow-sm shadow-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{estimate.quoteId || estimate.id || "Saved Estimate"}</p>
                <p className="mt-0.5 text-xs font-bold text-slate-500">
                  {date || "No date"} • {money(total)}
                </p>
              </div>
              <Link
                href={`/invoice-basic?id=${encodeURIComponent(estimate.id)}`}
                className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-xs font-black text-white"
              >
                Open / Print
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Timeline({ entries }) {
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (!sorted.length) return <p className="text-sm font-bold text-slate-500">No timeline entries yet.</p>;
  return (
    <div className="space-y-2">
      {sorted.map((entry, index) => (
        <article key={`${entry.id || "timeline"}-${index}`} className="rounded-md border border-slate-300 bg-white p-3 text-sm shadow-sm shadow-slate-200">
          <div className="flex items-center justify-between gap-2">
            <p className="font-black capitalize">{entry.type?.replace("_", " ") || "note"}</p>
            <p className="text-xs font-bold text-slate-500">{String(entry.date || "").slice(0, 16).replace("T", " ")}</p>
          </div>
          <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-700">{entry.content}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{entry.direction || "internal"} by {entry.createdBy || "CRM"}</p>
        </article>
      ))}
    </div>
  );
}

function CrmSection({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className={`rounded-lg p-3 ${crmPanelClass}`}>
      <summary className="cursor-pointer text-sm font-black uppercase text-slate-600">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function FormGroup({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-300 bg-slate-50 p-3">
      <h3 className="text-sm font-black uppercase text-slate-500">{title}</h3>
      <div className="mt-2 grid gap-2">{children}</div>
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block min-w-0 text-sm font-bold">
      {label}
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={label.toLowerCase().includes("address") ? "street-address" : undefined}
        className="mt-1 min-w-0 w-full rounded-md border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-700"
      />
    </label>
  );
}

function AddressInput({ label, value, onChange, onCityChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function initAutocomplete() {
      const input = inputRef.current;
      if (!input || input.dataset.googlePlacesReady === "yes") return;
      if (!window.google || !window.google.maps?.places) return;

      input.dataset.googlePlacesReady = "yes";
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        fields: ["address_components", "formatted_address"],
        componentRestrictions: { country: "ca" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const formattedAddress = place?.formatted_address || input.value;
        if (formattedAddress) onChange(formattedAddress);

        const components = place?.address_components || [];
        const city =
          components.find((part) => part.types?.includes("locality"))?.long_name ||
          components.find((part) => part.types?.includes("postal_town"))?.long_name ||
          components.find((part) => part.types?.includes("sublocality"))?.long_name ||
          components.find((part) => part.types?.includes("administrative_area_level_3"))?.long_name ||
          "";
        if (city && onCityChange) onCityChange(city);
      });
    }

    initAutocomplete();
    window.addEventListener("epf-google-places-ready", initAutocomplete);
    return () => window.removeEventListener("epf-google-places-ready", initAutocomplete);
  }, [onChange, onCityChange]);

  return (
    <label className="block min-w-0 text-sm font-bold">
      {label}
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="street-address"
        placeholder="Start typing and choose the Google address"
        className="mt-1 min-w-0 w-full rounded-md border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-700"
      />
    </label>
  );
}

function SuggestInput({ label, value, options, onChange }) {
  const listId = `crm-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        type="text"
        list={listId}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-700"
        placeholder="Choose or type custom work"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function DateInput({ label, value, onChange }) {
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : "";
  const shortcuts = [
    ["Today", todayISO()],
    ["Tomorrow", addDaysISO(1)],
    ["+2", addDaysISO(2)],
    ["+7", addDaysISO(7)],
  ];
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        type="date"
        value={dateValue || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-blue-700"
      />
      {value && !dateValue && <p className="mt-1 text-xs font-bold text-amber-700">Saved as text: {value}</p>}
      <div className="mt-1 flex flex-wrap gap-1">
        {shortcuts.map(([text, date]) => (
          <button
            key={`${label}-${text}`}
            type="button"
            onClick={() => onChange(date)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-black text-slate-700"
          >
            {text}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-black text-slate-500"
        >
          Clear
        </button>
      </div>
    </label>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-blue-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option || "-"}</option>
        ))}
      </select>
    </label>
  );
}

function Filter({ label, value, options, onChange }) {
  return (
    <label className="text-xs font-black uppercase text-slate-500">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm font-bold normal-case text-slate-800">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function InlineStatus({ label, value, options, onChange }) {
  return <Select label={label} value={value} options={options} onChange={onChange} />;
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-2 shadow-sm">
      <p className="text-[11px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-0.5 font-bold text-slate-900" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {value || "-"}
      </p>
    </div>
  );
}

function EditableInfo({ label, value, onEdit }) {
  const timerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startLongPress() {
    longPressFiredRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      onEdit?.();
    }, 600);
  }

  return (
    <button
      type="button"
      onPointerDown={startLongPress}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(event) => {
        event.preventDefault();
        clearTimer();
        onEdit?.();
      }}
      className="min-w-0 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-2 text-left shadow-sm"
      title="Long press to edit"
    >
      <p className="text-[11px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-0.5 font-bold text-slate-900" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {value || "-"}
      </p>
    </button>
  );
}

function StatusBadge({ value, label = "" }) {
  const classes = {
    "New Lead": "animate-pulse bg-red-50 text-red-800 ring-2 ring-red-400",
    Contacted: "bg-slate-100 text-slate-800",
    "Estimate Booked": "bg-indigo-50 text-indigo-800",
    "Estimate Sent": "bg-amber-50 text-amber-800",
    "Follow-Up": "bg-amber-100 text-amber-900",
    Won: "bg-sky-50 text-sky-800",
    Lost: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${classes[value] || "bg-slate-100 text-slate-700"}`}>
      {label ? `${label}: ` : ""}{value || "-"}
    </span>
  );
}

function PaymentBadge({ value, label = "" }) {
  const classes = {
    "No Invoice": "bg-slate-100 text-slate-700",
    "Deposit Due": "bg-amber-50 text-amber-800",
    "Deposit Paid": "bg-blue-50 text-blue-800",
    "Balance Due": "bg-red-50 text-red-700",
    Paid: "bg-cyan-50 text-cyan-800",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${classes[value] || "bg-slate-100 text-slate-700"}`}>
      {label ? `${label}: ` : ""}{value || "-"}
    </span>
  );
}

function ProjectBadge({ value, label = "" }) {
  const classes = {
    "Not Scheduled": "bg-slate-100 text-slate-700",
    Scheduled: "bg-indigo-50 text-indigo-800",
    "In Progress": "bg-blue-50 text-blue-800",
    Completed: "bg-sky-50 text-sky-800",  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${classes[value] || "bg-slate-100 text-slate-700"}`}>
      {label ? `${label}: ` : ""}{value || "-"}
    </span>
  );
}
