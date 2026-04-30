"use client";
// @ts-nocheck

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DELETE_PASSWORD = "1234";
const CRM_STORAGE_KEY = "epf.crm.clients";
const CRM_AUTH_KEY = "epf.crm.unlocked";
const CRM_ACCESS_PIN = "1234";

const makeId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  googlePlaceId: "",
  neighborhood: "",
  city: "",
  service: "",
  approxSqft: "",
  ceilingCondition: "Unknown",
  customCondition: "",
  ceilingHeight: "",
  leadSource: "Email / Website Form",
  leadStatus: "New Lead",
  projectFlag: "Active",
  tag: "New Lead",
  priority: "Normal",
  estimateDate: "",
  estimateAmount: "",
  estimateSent: "No",
  followUpDate: "",
  bookedStartDate: "",
  projectCompletedDate: "",
  depositAmount: "",
  paymentAmount: "",
  balanceDue: "",
  paymentMethod: "",
  projectNotes: "",
  sourceEmailText: "",
  voiceNotes: [],
  activity: [],
  editHistory: [],
  updatedAt: "",
};

const flagOptions = [
  "Active",
  "Follow-Up",
  "No Response",
  "Balance Due",
  "Waiting",
  "Completed",
  "Lost",
];

const tagOptions = [
  "New Lead",
  "Needs Attention",
  "Follow-Up",
  "Called Client No Response",
  "Call Again",
  "Estimate Sent",
  "Booked",
  "Balance Due",
  "Paid",
  "Warranty",
  "Not Interested",
  "Hot Lead",
  "Need Photos",
  "Need Address",
  "Need Estimate",
];

const crmAssistantFields = [
  "name",
  "phone",
  "email",
  "address",
  "neighborhood",
  "city",
  "service",
  "approxSqft",
  "ceilingCondition",
  "customCondition",
  "ceilingHeight",
  "leadSource",
  "leadStatus",
  "projectFlag",
  "tag",
  "priority",
  "estimateDate",
  "estimateAmount",
  "estimateSent",
  "followUpDate",
  "bookedStartDate",
  "projectCompletedDate",
  "depositAmount",
  "paymentAmount",
  "balanceDue",
  "paymentMethod",
  "projectNotes",
];

const assistantFieldLabels = {
  name: ["name", "client"],
  phone: ["phone", "number", "mobile", "cell"],
  email: ["email"],
  address: ["address"],
  neighborhood: ["neighborhood", "neighbourhood", "area"],
  city: ["city"],
  service: ["service", "work", "job"],
  approxSqft: ["approx sqft", "square feet", "sqft", "sq ft"],
  ceilingCondition: ["condition", "ceiling condition"],
  customCondition: ["other condition", "custom condition"],
  ceilingHeight: ["ceiling height", "height"],
  leadSource: ["lead source", "source"],
  leadStatus: ["lead status"],
  projectFlag: ["status", "flag", "colour flag", "color flag"],
  tag: ["tag"],
  priority: ["priority"],
  estimateDate: ["estimate date"],
  estimateAmount: ["estimate", "estimate amount", "quote", "quote amount"],
  estimateSent: ["estimate sent", "quote sent"],
  followUpDate: ["follow up", "follow-up", "followup"],
  bookedStartDate: ["booked", "start date", "booked start"],
  projectCompletedDate: ["completed date", "completion date"],
  depositAmount: ["deposit"],
  paymentAmount: ["paid", "payment", "payment amount"],
  balanceDue: ["balance", "balance due"],
  paymentMethod: ["payment method"],
  projectNotes: ["note", "notes", "project notes"],
};

const startingClients = [
  {
    ...emptyForm,
    id: makeId(),
    name: "Laura Lewis",
    phone: "4036088822",
    email: "laura-lewis@live.com",
    neighborhood: "Silver Springs",
    city: "Calgary",
    service: "Popcorn Ceiling Removal",
    approxSqft: "1400",
    projectNotes: "Lead pasted from website/email form.",
    activity: ["Lead created from email form."],
    sourceEmailText:
      "Name: Laura Lewis\nPhone: 4036088822\nEmail: laura-lewis@live.com\nNeighborhood: Silver Springs\nService: Popcorn Ceiling Removal\nApprox SqFt: 1400",
  },
  {
    ...emptyForm,
    id: makeId(),
    name: "Completed Example Client",
    phone: "9055551111",
    email: "completed@example.com",
    city: "Mississauga",
    service: "Popcorn Ceiling Removal",
    approxSqft: "850",
    projectFlag: "Completed",
    tag: "Paid",
    leadStatus: "Completed",
    estimateAmount: "6400",
    paymentAmount: "6400",
    projectCompletedDate: new Date().toISOString().slice(0, 10),
    activity: ["Project completed and paid."],
  },
  {
    ...emptyForm,
    id: makeId(),
    name: "No Response Example",
    phone: "4165552222",
    email: "noresponse@example.com",
    city: "Oakville",
    service: "Interior Painting",
    projectFlag: "No Response",
    tag: "Follow-Up",
    followUpDate: new Date().toISOString().slice(0, 10),
    activity: ["Follow-up needed. No response yet."],
  },
];

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function cleanExtractedName(value) {
  return value
    .replace(/\b(thank you|thanks|bye|now|again|please|call|back)\b.*$/i, "")
    .replace(/[^a-zA-Z' -]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}

function extractNameFromText(text) {
  const patterns = [
    /\bmy name is\s+([a-zA-Z][a-zA-Z' -]{1,50})/i,
    /\bthis is\s+([a-zA-Z][a-zA-Z' -]{1,50})/i,
    /\bname is\s+([a-zA-Z][a-zA-Z' -]{1,50})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const name = cleanExtractedName(match[1]);
    if (name) return name;
  }

  return "";
}

function extractServiceFromText(text) {
  const lower = text.toLowerCase();
  const hasPopcorn = /\bpopcorn\b/.test(lower);
  const hasCeiling = /\b(ceiling|sealing)\b/.test(lower);
  const hasKnockdown = /\bknock\s*-?\s*down\b|\bknockdown\b/.test(lower);

  if (hasPopcorn && hasCeiling && hasKnockdown) {
    return "Popcorn Ceiling Removal / Knockdown Texture";
  }
  if (hasKnockdown) return "Knockdown Ceiling Texture";
  if (hasPopcorn && hasCeiling) return "Popcorn Ceiling Removal";
  if (hasPopcorn) return "Popcorn Ceiling Removal";

  return "";
}

function looksLikeVoicemail(text) {
  return /\b(call me|call back|cell phone|voicemail|voice mail|my name is|this is)\b/i.test(
    text
  );
}

function parseLeadEmail(text) {
  const fieldMap = {
    name: "name",
    fullname: "name",
    clientname: "name",
    phone: "phone",
    phonenumber: "phone",
    mobile: "phone",
    email: "email",
    emailaddress: "email",
    address: "address",
    streetaddress: "address",
    neighbourhood: "neighborhood",
    neighborhood: "neighborhood",
    area: "neighborhood",
    city: "city",
    service: "service",
    work: "service",
    approxsqft: "approxSqft",
    approximatesqft: "approxSqft",
    squarefeet: "approxSqft",
    sqft: "approxSqft",
    approxarea: "approxSqft",
    ceilingcondition: "ceilingCondition",
    condition: "ceilingCondition",
    ceilingheight: "ceilingHeight",
    height: "ceilingHeight",
    details: "projectNotes",
    message: "projectNotes",
    notes: "projectNotes",
  };

  const parsed = { sourceEmailText: text };

  text.split(/\n|\r/).forEach((line) => {
    const match = line.match(/^\s*([^:]+):\s*(.+?)\s*$/);
    if (!match) return;
    const formKey = fieldMap[normalizeKey(match[1])];
    if (formKey) parsed[formKey] = match[2].trim();
  });

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch && !parsed.email) parsed.email = emailMatch[0];

  const phoneMatch = text.match(
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
  );
  if (phoneMatch && !parsed.phone) parsed.phone = phoneMatch[0];

  if (!parsed.name) {
    const extractedName = extractNameFromText(text);
    if (extractedName) parsed.name = extractedName;
  }

  if (!parsed.service) {
    const extractedService = extractServiceFromText(text);
    if (extractedService) parsed.service = extractedService;
  }

  if (looksLikeVoicemail(text)) {
    parsed.leadSource = "Voicemail";
    parsed.tag = "Call Again";
    parsed.projectFlag = "Active";
    parsed.leadStatus = "New Lead";
    parsed.projectNotes = parsed.projectNotes || `Voicemail transcript:\n${text}`;

    if (/popcorn/i.test(text) && /knock\s*-?\s*down|knockdown/i.test(text)) {
      parsed.ceilingCondition = "Other";
      parsed.customCondition = "Popcorn ceiling to knockdown texture";
    }
  }

  return parsed;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAssistantText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findOptionInText(text, options) {
  const normalized = normalizeAssistantText(text);
  return options.find((option) => {
    const normalizedOption = normalizeAssistantText(option);
    return normalized === normalizedOption || normalized.includes(normalizedOption);
  });
}

function parseAssistantDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.includes("tomorrow")) return addDaysISO(1);
  if (lower.includes("today")) return todayISO();
  const daysMatch = lower.match(/in\s+(\d{1,3})\s+days?/);
  if (daysMatch) return addDaysISO(Number(daysMatch[1]));
  const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];
  return text;
}

function extractAssistantValue(command, labels) {
  const allLabels = Object.values(assistantFieldLabels).flat().map(escapeRegExp);
  const stopPattern = allLabels.join("|");

  for (const label of labels) {
    const pattern = new RegExp(
      `\\b${escapeRegExp(label)}\\b\\s*(?:is|to|as|=|:)?\\s*(.+?)(?=\\s+\\b(?:${stopPattern})\\b\\s*(?:is|to|as|=|:)?|$)`,
      "i"
    );
    const match = command.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/[,.]\s*$/, "").trim();
    }
  }

  return "";
}

function extractAssistantTargetName(command) {
  const text = String(command || "");
  const match = text.match(
    /\b(?:for|client|customer|open|opened card)\s+([a-zA-Z][a-zA-Z' -]{1,60}?)(?=\s+(?:set|change|update|mark|make|add|phone|email|address|city|service|status|flag|tag|note|notes|follow|estimate|quote|paid|payment|balance|deposit|priority|booked|completed)\b|[,.;]|$)/i
  );
  if (!match?.[1]) return "";
  return match[1]
    .replace(/\b(card|client|customer)\b/gi, "")
    .trim();
}

function parseAssistantUpdates(command) {
  const updates = {};
  const text = String(command || "");
  const lower = text.toLowerCase();

  crmAssistantFields.forEach((field) => {
    const rawValue = extractAssistantValue(text, assistantFieldLabels[field] || [field]);
    if (!rawValue) return;
    updates[field] = rawValue;
  });

  const parsedLead = parseLeadEmail(text);
  ["name", "phone", "email", "address", "neighborhood", "city", "service", "approxSqft"].forEach(
    (field) => {
      if (!updates[field] && parsedLead[field]) updates[field] = parsedLead[field];
    }
  );

  const flag = findOptionInText(text, flagOptions);
  if (flag) updates.projectFlag = flag;
  if (/\b(green|active)\b/i.test(text)) updates.projectFlag = "Active";
  if (/\b(no response|called.*no response|orange)\b/i.test(text)) {
    updates.projectFlag = "No Response";
    if (!updates.tag) updates.tag = "Called Client No Response";
  }
  if (/\b(balance due|owes|unpaid)\b/i.test(text)) updates.projectFlag = "Balance Due";
  if (/\b(complete|completed|done|finished|red)\b/i.test(text)) {
    updates.projectFlag = "Completed";
    updates.leadStatus = "Completed";
    updates.projectCompletedDate = updates.projectCompletedDate || todayISO();
  }
  if (/\b(lost|not interested)\b/i.test(text)) updates.projectFlag = "Lost";

  const tag = findOptionInText(text, tagOptions);
  if (tag) updates.tag = tag;
  if (/\bhot\b/i.test(text)) updates.tag = "Hot Lead";
  if (/\bneed photos\b/i.test(text)) updates.tag = "Need Photos";
  if (/\bneed address\b/i.test(text)) updates.tag = "Need Address";
  if (/\bneed estimate\b/i.test(text)) updates.tag = "Need Estimate";
  if (/\bestimate sent\b|\bquote sent\b/i.test(text)) {
    updates.tag = "Estimate Sent";
    updates.leadStatus = "Estimate Sent";
    updates.estimateSent = "Yes";
  }
  if (/\bbooked\b/i.test(text)) {
    updates.tag = "Booked";
    updates.leadStatus = "Booked";
    if (!updates.projectFlag) updates.projectFlag = "Active";
  }
  if (/\bpaid\b/i.test(text)) updates.tag = "Paid";

  const priority = findOptionInText(text, ["Low", "Normal", "High", "Urgent"]);
  if (priority) updates.priority = priority;

  if (updates.followUpDate) updates.followUpDate = parseAssistantDate(updates.followUpDate);
  if (updates.estimateDate) updates.estimateDate = parseAssistantDate(updates.estimateDate);
  if (updates.bookedStartDate) updates.bookedStartDate = parseAssistantDate(updates.bookedStartDate);
  if (updates.projectCompletedDate) {
    updates.projectCompletedDate = parseAssistantDate(updates.projectCompletedDate);
  }

  if (/\bfollow[- ]?up\b/i.test(text) && !updates.followUpDate) {
    updates.followUpDate = parseAssistantDate(text);
    updates.projectFlag = "Follow-Up";
    updates.tag = updates.tag || "Follow-Up";
  }

  const explicitNote = text.match(/\b(?:add note|note|notes)\b\s*(?:is|are|:)?\s*(.+)$/i);
  if (explicitNote?.[1]) updates.projectNotes = explicitNote[1].trim();

  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined && value !== "")
  );
}

function mergeAssistantUpdates(client, updates, mode) {
  const next = { ...client };
  const note = updates.projectNotes;
  Object.entries(updates).forEach(([field, value]) => {
    if (field === "projectNotes" && mode === "appendNote") return;
    next[field] = value;
  });
  if (note && mode === "appendNote") {
    next.projectNotes = `${client.projectNotes ? `${client.projectNotes}\n` : ""}${new Date().toLocaleDateString("en-CA")}: ${note}`;
  }
  return next;
}

function describeAssistantUpdates(updates) {
  return Object.entries(updates).map(([field, value]) => ({
    field,
    value: safeValue(value),
  }));
}

function timeStamp() {
  return new Date().toLocaleString("en-CA");
}

function money(value) {
  if (!value) return "—";
  const number = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!number) return value;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(number);
}

function safeValue(value) {
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function getChangedFields(before, after) {
  const skipFields = ["id", "activity", "editHistory", "updatedAt"];
  return Object.keys(emptyForm)
    .filter((key) => !skipFields.includes(key))
    .filter((key) => safeValue(before?.[key]) !== safeValue(after?.[key]))
    .map((key) => ({
      id: makeId(),
      date: timeStamp(),
      field: key,
      from: safeValue(before?.[key]),
      to: safeValue(after?.[key]),
    }));
}

function flagRank(flag) {
  const rank = {
    Active: 1,
    "Follow-Up": 2,
    "No Response": 3,
    "Balance Due": 4,
    Waiting: 5,
    Lost: 6,
    Completed: 7,
  };
  return rank[flag] || 99;
}

function flagClasses(flag) {
  if (flag === "Active")
    return "border-green-600 bg-green-100 text-green-950 shadow-green-100";
  if (flag === "Follow-Up")
    return "border-yellow-500 bg-yellow-100 text-yellow-950 shadow-yellow-100";
  if (flag === "No Response")
    return "border-orange-500 bg-orange-100 text-orange-950 shadow-orange-100";
  if (flag === "Balance Due")
    return "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-950 shadow-fuchsia-100";
  if (flag === "Waiting")
    return "border-blue-500 bg-blue-100 text-blue-950 shadow-blue-100";
  if (flag === "Completed")
    return "border-red-600 bg-red-100 text-red-950 shadow-red-100";
  if (flag === "Lost") return "border-slate-400 bg-slate-100 text-slate-700";
  return "border-slate-300 bg-white text-slate-900";
}

function getClientMonthKey(client) {
  const date =
    client.followUpDate ||
    client.estimateDate ||
    client.bookedStartDate ||
    client.projectCompletedDate;
  return date ? date.slice(0, 7) : "No Date";
}

function getUpdatedTime(client) {
  return client.updatedAt ? new Date(client.updatedAt).getTime() : 0;
}

function monthLabel(monthKey) {
  if (monthKey === "No Date") return "No Date";
  const [year, month] = monthKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-CA",
    { month: "long", year: "numeric" }
  );
}

function fileToVoiceNote(file) {
  return {
    id: makeId(),
    name: file.name || `Voice note ${timeStamp()}`,
    url: URL.createObjectURL(file),
    type: file.type || "audio/webm",
    createdAt: timeStamp(),
  };
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  return window["SpeechRecognition"] || window["webkitSpeechRecognition"] || null;
}

function getPreferredSpeechVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  return (
    voices.find((voice) => /samantha|ava|allison|google us english|microsoft aria/i.test(voice.name)) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-ca")) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-us")) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ||
    null
  );
}

function speakText(message) {
  if (typeof window === "undefined" || !window.speechSynthesis || !message) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "en-CA";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  const voice = getPreferredSpeechVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}

export default function CrmPage() {
  const [clients, setClients] = useState(startingClients);
  const [form, setForm] = useState(emptyForm);
  const [pasteText, setPasteText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [copyMessage, setCopyMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [recording, setRecording] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [syncStatus, setSyncStatus] = useState("Loading shared CRM...");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessPin, setAccessPin] = useState("");
  const [accessError, setAccessError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [activeView, setActiveView] = useState("Today");
  const [assistantCommand, setAssistantCommand] = useState("");
  const [assistantStatus, setAssistantStatus] = useState(
    "Ask me to add a client, edit the open card, or update a client by name."
  );
  const [pendingAssistantAction, setPendingAssistantAction] = useState(null);
  const [voiceTarget, setVoiceTarget] = useState(null);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [voiceAgentMode, setVoiceAgentMode] = useState(true);
  const [voiceAutoApply, setVoiceAutoApply] = useState(false);
  const addressInputRef = useRef(null);
  const addressAutocompleteRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);

  const saveLocalClients = useCallback((nextClients) => {
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(nextClients));
    } catch {}
  }, []);

  const syncClients = useCallback(
    async (nextClients) => {
      saveLocalClients(nextClients);
      setSyncStatus("Saving shared CRM...");
      try {
        const res = await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clients: nextClients }),
        });
        if (!res.ok) throw new Error("CRM sync failed");
        setSyncStatus(`Shared CRM saved ${new Date().toLocaleTimeString("en-CA")}`);
      } catch {
        setSyncStatus("Saved on this device only. Cloud sync is not configured.");
      }
    },
    [saveLocalClients]
  );

  useEffect(() => {
    try {
      setIsUnlocked(window.localStorage.getItem(CRM_AUTH_KEY) === "yes");
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const cached = window.localStorage.getItem(CRM_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && !cancelled) setClients(parsed);
        }
      } catch {}

      try {
        const res = await fetch("/api/crm", { cache: "no-store" });
        if (!res.ok) throw new Error("CRM load failed");
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (cancelled) return;
        setClients(items);
        saveLocalClients(items);
        setSyncStatus(`Shared CRM loaded ${new Date().toLocaleTimeString("en-CA")}`);
      } catch {
        if (!cancelled) {
          setSyncStatus("Using this device's CRM. Cloud sync is not configured.");
        }
      }
    }

    loadClients();
    return () => {
      cancelled = true;
    };
  }, [saveLocalClients]);

  const initAddressAutocomplete = useCallback(() => {
    const input = addressInputRef.current;
    if (!input || !window.google || !window.google.maps?.places) return;
    if (addressAutocompleteRef.current?.input === input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      fields: ["formatted_address", "place_id", "address_components"],
      componentRestrictions: { country: "ca" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      const cityComponent = place.address_components?.find((component) =>
        component.types.some((type) =>
          ["locality", "postal_town", "administrative_area_level_3"].includes(type)
        )
      );

      setForm((current) => ({
        ...current,
        address: place.formatted_address || input.value || current.address,
        googlePlaceId: place.place_id || current.googlePlaceId,
        city: cityComponent?.long_name || current.city,
      }));
    });

    addressAutocompleteRef.current = { input, autocomplete };
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const timer = window.setTimeout(initAddressAutocomplete, 0);
    return () => window.clearTimeout(timer);
  }, [showForm, initAddressAutocomplete]);

  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.abort?.();
    };
  }, []);

  const monthOptions = useMemo(() => {
    return [...new Set(clients.map(getClientMonthKey))].sort((a, b) => {
      if (a === "No Date") return 1;
      if (b === "No Date") return -1;
      return b.localeCompare(a);
    });
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const haystack = [
          client.name,
          client.phone,
          client.email,
          client.address,
          client.neighborhood,
          client.city,
          client.service,
          client.projectFlag,
          client.leadStatus,
          client.tag,
          client.projectNotes,
        ]
          .join(" ")
          .toLowerCase();
        return (
          haystack.includes(search.toLowerCase()) &&
          (flagFilter === "All" || client.projectFlag === flagFilter) &&
          (tagFilter === "All" || client.tag === tagFilter) &&
          (monthFilter === "All" || getClientMonthKey(client) === monthFilter)
        );
      })
      .sort((a, b) => {
        const today = todayISO();
        const aDue =
          a.followUpDate && a.followUpDate <= today && a.projectFlag !== "Completed";
        const bDue =
          b.followUpDate && b.followUpDate <= today && b.projectFlag !== "Completed";
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        if (a.projectFlag === "Active" && b.projectFlag !== "Active") return -1;
        if (a.projectFlag !== "Active" && b.projectFlag === "Active") return 1;
        const editedSort = getUpdatedTime(b) - getUpdatedTime(a);
        if (editedSort !== 0) return editedSort;
        return flagRank(a.projectFlag) - flagRank(b.projectFlag);
      });
  }, [clients, search, flagFilter, tagFilter, monthFilter]);

  const todayClients = useMemo(() => {
    const today = todayISO();
    return clients
      .filter((client) => {
        const balance = Number(String(client.balanceDue || "").replace(/[^0-9.]/g, ""));
        return (
          (client.followUpDate && client.followUpDate <= today && client.projectFlag !== "Completed") ||
          client.projectFlag === "No Response" ||
          client.tag === "Hot Lead" ||
          client.tag === "Need Photos" ||
          client.tag === "Need Address" ||
          client.projectFlag === "Balance Due" ||
          balance > 0
        );
      })
      .sort((a, b) => {
        const today = todayISO();
        const aDue = a.followUpDate && a.followUpDate <= today;
        const bDue = b.followUpDate && b.followUpDate <= today;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        return getUpdatedTime(b) - getUpdatedTime(a);
      });
  }, [clients]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const visibleClients = activeView === "Today" ? todayClients : filteredClients;

  const stats = useMemo(() => {
    const today = todayISO();
    return {
      total: clients.length,
      active: clients.filter((c) => c.projectFlag === "Active").length,
      noResponse: clients.filter((c) => c.projectFlag === "No Response").length,
      followUp: clients.filter(
        (c) => c.followUpDate && c.followUpDate <= today && c.projectFlag !== "Completed"
      ).length,
      balanceDue: clients.filter(
        (c) =>
          c.projectFlag === "Balance Due" ||
          Number(String(c.balanceDue || "").replace(/[^0-9.]/g, "")) > 0
      ).length,
      paidCount: clients.filter(
        (c) =>
          c.tag === "Paid" ||
          Number(String(c.paymentAmount || "").replace(/[^0-9.]/g, "")) > 0
      ).length,
      completed: clients.filter((c) => c.projectFlag === "Completed").length,
      paid: clients.reduce((sum, c) => {
        const value = Number(String(c.paymentAmount || "").replace(/[^0-9.]/g, ""));
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    };
  }, [clients]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addActivity(message) {
    setForm((current) => ({
      ...current,
      activity: [`${timeStamp()}: ${message}`, ...(current.activity || [])],
    }));
  }

  function updateClientList(mutator) {
    setClients((current) => {
      const nextClients = mutator(current);
      syncClients(nextClients);
      return nextClients;
    });
  }

  function unlockCrm(event) {
    event.preventDefault();
    if (accessPin !== CRM_ACCESS_PIN) {
      setAccessError("Wrong CRM PIN.");
      return;
    }
    try {
      window.localStorage.setItem(CRM_AUTH_KEY, "yes");
    } catch {}
    setIsUnlocked(true);
    setAccessError("");
    setAccessPin("");
  }

  function lockCrm() {
    try {
      window.localStorage.removeItem(CRM_AUTH_KEY);
    } catch {}
    setIsUnlocked(false);
  }

  function getVoicePrompt(target) {
    if (target === "paste") {
      return "Dictate the voicemail or lead message. Include name, phone, service, city, and anything the client said.";
    }
    if (showForm && editingId) {
      return "Say the change for this open card. For example, set tag hot lead, follow up tomorrow, or add note client wants evening call.";
    }
    if (showForm) {
      return "Say new client details. Include name, phone, email, city, service, estimate, status, tag, or follow up date.";
    }
    return "Say add client with name and phone, or say set client name, then status, tag, note, follow up, estimate, payment, or balance.";
  }

  function startVoiceText(target) {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setAssistantStatus("Voice typing is not available in this browser.");
      return;
    }

    setAssistantStatus(`${getVoicePrompt(target)} Listening now.`);
    speechRecognitionRef.current?.abort?.();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-CA";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setVoiceInterim(interimText.trim());
      const transcript = finalText.trim();
      if (!transcript) return;

      if (target === "paste") {
        setPasteText((current) => `${current ? `${current}\n` : ""}${transcript}`);
        setAssistantStatus("Voice text added to the voicemail box.");
      } else {
        setAssistantCommand((current) => `${current ? `${current} ` : ""}${transcript}`);
        if (voiceAgentMode) {
          setAssistantStatus(
            voiceAutoApply
              ? `Heard: "${transcript}". Agent is applying it...`
              : `Heard: "${transcript}". Agent is preparing a change for review...`
          );
          processAssistantCommand(transcript, { autoApply: voiceAutoApply });
        } else {
          setAssistantStatus("Voice command added. Review it, then run assistant.");
        }
      }
    };

    recognition.onerror = () => {
      setAssistantStatus("Voice typing stopped. Check microphone permission.");
      setVoiceTarget(null);
      setVoiceInterim("");
    };
    recognition.onend = () => {
      setVoiceTarget(null);
      setVoiceInterim("");
    };

    speechRecognitionRef.current = recognition;
    setVoiceTarget(target);
    try {
      recognition.start();
    } catch {
      setVoiceTarget(null);
    }
  }

  function stopVoiceText() {
    speechRecognitionRef.current?.stop?.();
    setVoiceTarget(null);
  }

  function findClientByAssistantName(name) {
    const query = normalizeAssistantText(name);
    if (!query) return null;
    return (
      clients.find((client) => normalizeAssistantText(client.name) === query) ||
      clients.find((client) => normalizeAssistantText(client.name).includes(query)) ||
      clients.find((client) =>
        [client.phone, client.email, client.address]
          .filter(Boolean)
          .some((value) => normalizeAssistantText(value).includes(query))
      ) ||
      null
    );
  }

  function updatesFromAiChanges(changes) {
    return Object.fromEntries(
      (Array.isArray(changes) ? changes : [])
        .filter((change) => change?.field && change.value !== undefined)
        .map((change) => [change.field, String(change.value)])
    );
  }

  function applyAssistantActionObject(action) {
    if (!action) return;

    if (action.type === "create") {
      updateClientList((current) => [action.client, ...current]);
      setSelectedClientId(action.client.id);
      setAssistantStatus(`Added ${action.client.name || action.client.phone || action.client.email}.`);
      if (voiceReplies) speakText(`Added ${action.client.name || "client"}.`);
    }

    if (action.type === "form") {
      setForm((current) => {
        const nextForm = mergeAssistantUpdates(
          current,
          action.updates,
          action.appendNote ? "appendNote" : "replace"
        );
        return {
          ...nextForm,
          activity: [
            `${timeStamp()}: CRM assistant changed ${Object.keys(action.updates).join(", ")}.`,
            ...(current.activity || []),
          ],
        };
      });
      setAssistantStatus("Applied to the open card. Save the client when ready.");
      if (voiceReplies) speakText("Applied.");
    }

    if (action.type === "update") {
      updateClientList((current) =>
        current.map((client) => {
          if (client.id !== action.clientId) return client;
          const nextClient = mergeAssistantUpdates(
            client,
            action.updates,
            action.appendNote ? "appendNote" : "replace"
          );
          nextClient.updatedAt = new Date().toISOString();
          const changes = getChangedFields(client, nextClient);
          return {
            ...nextClient,
            activity: [
              `${timeStamp()}: CRM assistant changed ${Object.keys(action.updates).join(", ")}.`,
              ...(nextClient.activity || []),
            ],
            editHistory: [...changes, ...(client.editHistory || [])],
          };
        })
      );
      setSelectedClientId(action.clientId);
      setAssistantStatus(`Updated ${action.clientName}.`);
      if (voiceReplies) speakText(`Updated ${action.clientName}.`);
    }
  }

  function stageAssistantAction({
    type,
    updates,
    appendNote,
    targetName,
    message,
    autoApply = false,
    sourceCommand = assistantCommand,
  }) {
    const normalizedUpdates = updates || {};

    if (type === "create") {
      const nextClient = {
        ...emptyForm,
        ...normalizedUpdates,
        id: makeId(),
        name: normalizedUpdates.name || targetName || "",
        sourceEmailText: sourceCommand,
        updatedAt: new Date().toISOString(),
        activity: [`${timeStamp()}: Client created by CRM assistant.`],
        editHistory: [],
      };

      if (!nextClient.name && !nextClient.phone && !nextClient.email) {
        setAssistantStatus("I need at least a name, phone, or email to add a client.");
        return false;
      }

      const action = {
        type: "create",
        client: nextClient,
        summary: message || `Create ${nextClient.name || nextClient.phone || nextClient.email}`,
        changes: describeAssistantUpdates(normalizedUpdates),
      };
      if (autoApply) {
        applyAssistantActionObject(action);
        setPendingAssistantAction(null);
        return true;
      }
      setPendingAssistantAction(action);
      setAssistantStatus("Review the new client action, then apply it.");
      return true;
    }

    if (!Object.keys(normalizedUpdates).length) {
      setAssistantStatus(
        message ||
          "I could not find a CRM change in that command. Try status, tag, phone, email, note, follow-up, estimate, paid, balance, service, city, or address."
      );
      return false;
    }

    if (type === "form") {
      const action = {
        type: "form",
        updates: normalizedUpdates,
        appendNote,
        summary: message || "Update the open card",
        changes: describeAssistantUpdates(normalizedUpdates),
      };
      if (autoApply) {
        applyAssistantActionObject(action);
        setPendingAssistantAction(null);
        return true;
      }
      setPendingAssistantAction(action);
      setAssistantStatus("Review the open-card action, then apply it.");
      return true;
    }

    const targetClient = findClientByAssistantName(targetName);
    if (!targetClient) {
      setAssistantStatus(
        targetName
          ? `I could not find a client named "${targetName}".`
          : "Tell me which client to update, or open a card first."
      );
      return false;
    }

    const action = {
      type: "update",
      clientId: targetClient.id,
      clientName: targetClient.name || "client",
      updates: normalizedUpdates,
      appendNote,
      summary: message || `Update ${targetClient.name || "client"}`,
      changes: describeAssistantUpdates(normalizedUpdates),
    };
    if (autoApply) {
      applyAssistantActionObject(action);
      setPendingAssistantAction(null);
      return true;
    }
    setPendingAssistantAction(action);
    setAssistantStatus("Review the client update, then apply it.");
    return true;
  }

  function stageLocalAssistantAction(command, options = {}) {
    if (!command) {
      setAssistantStatus("Type what you want changed first.");
      return false;
    }

    const lower = command.toLowerCase();
    const isAddCommand = /\b(?:add|create|new)\s+(?:a\s+|new\s+)?(?:client|lead|customer)\b/.test(
      lower
    );
    const wantsOpenCard =
      /\b(open card|opened card|this card|current card|this client)\b/.test(lower) ||
      (showForm && editingId && !extractAssistantTargetName(command));
    const appendNote = /\b(add note|note|notes)\b/i.test(command);
    const updates = parseAssistantUpdates(command);

    if (isAddCommand) {
      return stageAssistantAction({
        type: "create",
        updates,
        appendNote,
        targetName: extractAssistantTargetName(command),
        autoApply: options.autoApply,
        sourceCommand: command,
      });
    }

    if (!Object.keys(updates).length) {
      setAssistantStatus(
        "I could not find a CRM change in that command. Try status, tag, phone, email, note, follow-up, estimate, paid, balance, service, city, or address."
      );
      return false;
    }

    if (wantsOpenCard && showForm) {
      return stageAssistantAction({
        type: "form",
        updates,
        appendNote,
        autoApply: options.autoApply,
        sourceCommand: command,
      });
    }

    const targetName = extractAssistantTargetName(command);
    return stageAssistantAction({
      type: "update",
      targetName,
      updates,
      appendNote,
      autoApply: options.autoApply,
      sourceCommand: command,
    });
  }

  async function processAssistantCommand(rawCommand, options = {}) {
    const command = String(rawCommand || "").trim();
    if (!command) {
      setAssistantStatus("Type what you want changed first.");
      return;
    }

    setAssistantStatus("Asking AI assistant...");
    setPendingAssistantAction(null);

    try {
      const res = await fetch("/api/crm/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          clients,
          openClient: editingId
            ? { ...form, id: editingId }
            : selectedClient || null,
        }),
      });

      if (!res.ok) throw new Error("AI assistant unavailable");
      const data = await res.json();
      const action = data?.action;
      if (!action || action.type === "noop") {
        setAssistantStatus(action?.message || "AI did not find a CRM change.");
        return;
      }

      const updates = updatesFromAiChanges(action.changes);
      const didStage = stageAssistantAction({
        type: action.type,
        updates,
        appendNote: action.appendNote,
        targetName: action.targetName,
        message: action.message,
        autoApply: options.autoApply,
        sourceCommand: command,
      });

      if (didStage) return;
    } catch {
      setAssistantStatus("AI unavailable. Using local assistant.");
    }

    stageLocalAssistantAction(command, options);
  }

  async function runCrmAssistant() {
    await processAssistantCommand(assistantCommand);
  }

  function applyAssistantAction() {
    const action = pendingAssistantAction;
    if (!action) return;
    applyAssistantActionObject(action);
    setPendingAssistantAction(null);
    setAssistantCommand("");
  }

  function cancelAssistantAction() {
    setPendingAssistantAction(null);
    setAssistantStatus("Action cancelled.");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setPasteText("");
    setShowForm(false);
    setRecording(false);
  }

  function startNewClient() {
    setEditingId(null);
    setForm(emptyForm);
    setPasteText("");
    setShowForm(true);
    setTimeout(
      () => document.getElementById("client-form")?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  }

  function autoFillFromPaste() {
    const parsed = parseLeadEmail(pasteText);
    setForm((current) => ({
      ...current,
      ...parsed,
      projectFlag: current.projectFlag || "Active",
      activity: [`${timeStamp()}: Lead pasted and auto-filled.`, ...(current.activity || [])],
    }));
  }

  function saveClient() {
    if (!form.name && !form.phone && !form.email) {
      alert("Please add at least a name, phone, or email.");
      return;
    }

    if (editingId) {
      updateClientList((current) =>
        current.map((client) => {
          if (client.id !== editingId) return client;
          const nextClient = { ...client, ...form, updatedAt: new Date().toISOString() };
          const changes = getChangedFields(client, nextClient);
          return {
            ...nextClient,
            activity: [
              `${timeStamp()}: Client updated.`,
              ...(changes.length
                ? [`${timeStamp()}: ${changes.length} field(s) changed.`]
                : []),
              ...(nextClient.activity || []),
            ],
            editHistory: [...changes, ...(client.editHistory || [])],
          };
        })
      );
    } else {
      const nextId = makeId();
      updateClientList((current) => [
        {
          ...form,
          id: nextId,
          updatedAt: new Date().toISOString(),
          activity: [`${timeStamp()}: Client saved.`, ...(form.activity || [])],
          editHistory: form.editHistory || [],
        },
        ...current,
      ]);
      setSelectedClientId(nextId);
    }

    resetForm();
  }

  function openClient(client) {
    setSelectedClientId(client.id);
  }

  function editClient(client) {
    setSelectedClientId(null);
    setEditingId(client.id);
    setForm({
      ...emptyForm,
      ...client,
      voiceNotes: client.voiceNotes || [],
      activity: client.activity || [],
      editHistory: client.editHistory || [],
    });
    setPasteText(client.sourceEmailText || "");
    setShowForm(true);
    setTimeout(
      () => document.getElementById("client-form")?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  }

  function deleteClient(id) {
    const password = window.prompt("Enter delete password");
    if (password !== DELETE_PASSWORD) {
      alert("Wrong password. Client was not deleted.");
      return;
    }
    updateClientList((current) => current.filter((client) => client.id !== id));
    if (selectedClientId === id) setSelectedClientId(null);
  }

  function quickFlag(id, flag) {
    updateClientList((current) =>
      current.map((client) => {
        if (client.id !== id) return client;
        const update = {
          projectFlag: flag,
          updatedAt: new Date().toISOString(),
          activity: [`${timeStamp()}: Flag changed to ${flag}.`, ...(client.activity || [])],
        };
        if (flag === "Active") update.tag = "Needs Attention";
        if (flag === "No Response") {
          update.tag = "Called Client No Response";
          update.activity = [
            `${timeStamp()}: Called client, no response.`,
            ...update.activity,
          ];
        }
        if (flag === "Follow-Up") update.tag = "Follow-Up";
        if (flag === "Balance Due") update.tag = "Balance Due";
        if (flag === "Completed") {
          update.tag = client.paymentAmount ? "Paid" : "Balance Due";
          update.leadStatus = "Completed";
          update.projectCompletedDate = client.projectCompletedDate || todayISO();
        }
        return { ...client, ...update };
      })
    );
  }

  function quickTag(tag) {
    updateField("tag", tag);
    addActivity(`Tag changed to ${tag}.`);
  }

  function setFollowUpInDays(days) {
    updateField("followUpDate", addDaysISO(days));
    updateField("projectFlag", "Follow-Up");
    updateField("tag", "Follow-Up");
    addActivity(
      days === 1 ? "Follow-up set for tomorrow." : `Follow-up set for ${days} days later.`
    );
  }

  function setCustomFollowUpDate(value) {
    updateField("followUpDate", value);
    updateField("projectFlag", "Follow-Up");
    updateField("tag", "Follow-Up");
    if (value) addActivity(`Follow-up date set to ${value}.`);
  }

  function handleVoiceFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) =>
      file.type.startsWith("audio/")
    );
    if (!files.length) return;
    const notes = files.map(fileToVoiceNote);
    setForm((current) => ({
      ...current,
      voiceNotes: [...(current.voiceNotes || []), ...notes],
      activity: [`${timeStamp()}: Added ${notes.length} voice note(s).`, ...(current.activity || [])],
    }));
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("Microphone recording is not available in this browser. You can still upload a voice file.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const note = {
          id: makeId(),
          name: `Recorded note ${timeStamp()}`,
          url: URL.createObjectURL(blob),
          type: "audio/webm",
          createdAt: timeStamp(),
        };
        setForm((current) => ({
          ...current,
          voiceNotes: [...(current.voiceNotes || []), note],
          activity: [`${timeStamp()}: Recorded voice note.`, ...(current.activity || [])],
        }));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch {
      alert("Microphone recording is not available in this browser. You can still upload a voice file.");
      setRecording(false);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function removeVoiceNote(id) {
    setForm((current) => ({
      ...current,
      voiceNotes: (current.voiceNotes || []).filter((note) => note.id !== id),
      activity: [`${timeStamp()}: Removed voice note.`, ...(current.activity || [])],
    }));
  }

  async function copyEmails() {
    const emails = [
      ...new Set(
        clients
          .map((c) => c.email)
          .filter(Boolean)
          .map((email) => email.trim().toLowerCase())
      ),
    ].join(", ");

    try {
      await navigator.clipboard.writeText(emails);
      setCopyMessage("Emails copied.");
    } catch {
      setCopyMessage(emails || "No emails to copy.");
    }
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Address",
      "Google Place ID",
      "Neighborhood",
      "City",
      "Service",
      "Approx SqFt",
      "Ceiling Condition",
      "Other Condition",
      "Ceiling Height",
      "Lead Source",
      "Lead Status",
      "Flag",
      "Tag",
      "Priority",
      "Estimate Date",
      "Estimate Amount",
      "Estimate Sent",
      "Follow Up Date",
      "Booked Start Date",
      "Completed Date",
      "Deposit",
      "Paid",
      "Balance Due",
      "Payment Method",
      "Voice Notes names",
      "Notes",
    ];

    const rows = clients.map((c) => [
      c.name,
      c.phone,
      c.email,
      c.address,
      c.googlePlaceId,
      c.neighborhood,
      c.city,
      c.service,
      c.approxSqft,
      c.ceilingCondition,
      c.customCondition,
      c.ceilingHeight,
      c.leadSource,
      c.leadStatus,
      c.projectFlag,
      c.tag,
      c.priority,
      c.estimateDate,
      c.estimateAmount,
      c.estimateSent,
      c.followUpDate,
      c.bookedStartDate,
      c.projectCompletedDate,
      c.depositAmount,
      c.paymentAmount,
      c.balanceDue,
      c.paymentMethod,
      (c.voiceNotes || []).map((note) => note.name).join(" | "),
      c.projectNotes,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client-crm.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
        <form onSubmit={unlockCrm} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-bold text-slate-500">EPF Client CRM</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Enter CRM PIN</h1>
          <input
            type="password"
            value={accessPin}
            onChange={(e) => setAccessPin(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
            autoFocus
          />
          {accessError && <p className="mt-2 text-sm font-bold text-red-600">{accessError}</p>}
          <button className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            Unlock CRM
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-900 md:p-6">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""
        }&libraries=places`}
        strategy="lazyOnload"
        onLoad={initAddressAutocomplete}
      />
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="text-sm font-bold text-green-300 hover:underline">
                Back to menu
              </Link>
              <p className="mt-4 text-sm text-slate-300">EPF Client CRM</p>
              <h1 className="mt-1 text-3xl font-bold md:text-5xl">
                Client & Project Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Add leads, paste email text, track follow-ups, estimates, payments, and voice notes.
              </p>
              <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">
                {syncStatus}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={startNewClient}
                className="rounded-2xl bg-green-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/30"
              >
                + Add New Client
              </button>
              <button
                onClick={copyEmails}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950"
              >
                Copy Emails
              </button>
              <button
                onClick={exportCSV}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950"
              >
                Export CSV
              </button>
              <button
                onClick={lockCrm}
                className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-bold text-white"
              >
                Lock
              </button>
            </div>
          </div>
          {copyMessage && (
            <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white">
              {copyMessage}
            </p>
          )}
        </header>

        {!showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <p className="text-sm font-black text-slate-950">CRM Assistant</p>
              <input
                value={assistantCommand}
                onChange={(e) => setAssistantCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runCrmAssistant();
                }}
                className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="Add client, or update by name..."
              />
              <div className="flex gap-2">
                <VoiceTextButton
                  active={voiceTarget === "assistant"}
                  start={() => startVoiceText("assistant")}
                  stop={stopVoiceText}
                />
                <button
                  onClick={runCrmAssistant}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                >
                  Run
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">{assistantStatus}</p>
            <VoiceReplyToggle enabled={voiceReplies} setEnabled={setVoiceReplies} />
            <VoiceAgentControls
              agentMode={voiceAgentMode}
              setAgentMode={setVoiceAgentMode}
              autoApply={voiceAutoApply}
              setAutoApply={setVoiceAutoApply}
            />
            <VoiceHelp
              editing={false}
              setCommand={setAssistantCommand}
            />
            {voiceTarget === "assistant" && (
              <p className="mt-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
                {voiceInterim || "Listening now. Say the client name and what to change."}
              </p>
            )}
            <AssistantActionPreview
              action={pendingAssistantAction}
              apply={applyAssistantAction}
              cancel={cancelAssistantAction}
            />
          </section>
        )}


        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Stat label="Total" value={stats.total} />
          <Stat label="Active" value={stats.active} />
          <Stat label="No Response" value={stats.noResponse} />
          <Stat label="Due Follow-Up" value={stats.followUp} />
          <Stat label="Balance Due" value={stats.balanceDue} />
          <Stat label="Paid Clients" value={stats.paidCount} />
          <Stat label="Completed" value={stats.completed} />
          <Stat label="Total Paid $" value={money(stats.paid)} />
        </section>

        <section className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex rounded-2xl bg-slate-100 p-1">
              {["Today", "All"].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`rounded-xl px-4 py-2 text-sm font-black ${
                    activeView === view
                      ? "bg-slate-950 text-white"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  {view === "Today" ? `Today (${todayClients.length})` : "All Clients"}
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-500">
              Today shows due follow-ups, no response, hot leads, missing info, and balances.
            </p>
          </div>
        </section>

        {!showForm && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Projects List</h2>
                <p className="text-sm text-slate-500">
                  Due follow-ups and active clients stay on top.
                </p>
              </div>
              <button
                onClick={startNewClient}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white"
              >
                + Add New Client
              </button>
            </div>
          </section>
        )}

        {showForm && (
          <section id="client-form" className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Client" : "Add New Client"}
                </h2>
                <p className="text-sm text-slate-500">
                  Paste email, auto-fill, add details, then save.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
              <div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-950">CRM Assistant</h3>
                      <p className="text-xs font-bold text-slate-500">{assistantStatus}</p>
                    </div>
                    <VoiceTextButton
                      active={voiceTarget === "assistant"}
                      start={() => startVoiceText("assistant")}
                      stop={stopVoiceText}
                    />
                  </div>
                  <textarea
                    value={assistantCommand}
                    onChange={(e) => setAssistantCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runCrmAssistant();
                    }}
                    className="mt-2 min-h-20 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900"
                    placeholder={
                      editingId
                        ? "Say or type: change opened card tag Hot Lead follow up tomorrow"
                        : "Say or type: add client Mike Jones phone 403-555-1212 service popcorn ceiling removal"
                    }
                  />
                  {voiceTarget === "assistant" && (
                    <p className="mt-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
                      {voiceInterim || "Listening now. Say the details or changes."}
                    </p>
                  )}
                  <VoiceReplyToggle enabled={voiceReplies} setEnabled={setVoiceReplies} />
                  <VoiceAgentControls
                    agentMode={voiceAgentMode}
                    setAgentMode={setVoiceAgentMode}
                    autoApply={voiceAutoApply}
                    setAutoApply={setVoiceAutoApply}
                  />
                  <VoiceHelp
                    editing={Boolean(editingId)}
                    setCommand={setAssistantCommand}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={runCrmAssistant}
                      className="flex-1 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                    >
                      Run Assistant
                    </button>
                    <button
                      onClick={() =>
                        setAssistantCommand(
                          editingId
                            ? "change opened card status to Follow-Up tag Follow-Up follow up tomorrow"
                            : "add client Mike Jones phone 403-555-1212 service popcorn ceiling removal"
                        )
                      }
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                    >
                      Example
                    </button>
                  </div>
                  <AssistantActionPreview
                    action={pendingAssistantAction}
                    apply={applyAssistantAction}
                    cancel={cancelAssistantAction}
                  />
                </div>

                <label className="mt-4 block text-sm font-bold">
                  Paste email / form / voicemail text
                </label>
                <div className="mt-1 flex gap-2">
                  <VoiceTextButton
                    active={voiceTarget === "paste"}
                    start={() => startVoiceText("paste")}
                    stop={stopVoiceText}
                    label="Voice Text"
                  />
                  <button
                    onClick={autoFillFromPaste}
                    className="flex-1 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  >
                    Auto-Fill From Text
                  </button>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="mt-2 min-h-44 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
                  placeholder={"Name: Laura Lewis\nPhone: 4036088822\nEmail: laura-lewis@live.com\nNeighborhood: Silver Springs\nService: Popcorn Ceiling Removal\nApprox SqFt: 1400\n\nOr paste voicemail text: My name is Bash. Call me back at 403-835-6535. I want to change popcorn ceiling to knockdown."}
                />
                {voiceTarget === "paste" && (
                  <p className="mt-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
                    {voiceInterim || "Listening now. Dictate the voicemail or lead message."}
                  </p>
                )}

                <VoiceNotesPanel
                  form={form}
                  recording={recording}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  handleVoiceFiles={handleVoiceFiles}
                  removeVoiceNote={removeVoiceNote}
                />
              </div>

              <div>
                <FormTitle title="Client Info" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Name" value={form.name} onChange={(v) => updateField("name", v)} />
                  <Input label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} />
                  <Input label="Email" value={form.email} onChange={(v) => updateField("email", v)} />
                  <GoogleAddressInput
                    inputRef={addressInputRef}
                    value={form.address}
                    onChange={(v) => updateField("address", v)}
                  />
                  <Input label="Neighborhood" value={form.neighborhood} onChange={(v) => updateField("neighborhood", v)} />
                  <Input label="City" value={form.city} onChange={(v) => updateField("city", v)} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {form.phone && <ActionLink href={`tel:${form.phone}`}>Call Client</ActionLink>}
                  {form.phone && <ActionLink href={`sms:${form.phone}`}>Text Client</ActionLink>}
                  {form.email && <ActionLink href={`mailto:${form.email}`}>Email Client</ActionLink>}
                  <button onClick={() => setFollowUpInDays(1)} className="rounded-2xl border-2 border-yellow-500 bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-900">
                    Follow-Up Tomorrow
                  </button>
                  <button onClick={() => setFollowUpInDays(2)} className="rounded-2xl border-2 border-yellow-500 bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-900">
                    Follow-Up in 2 Days
                  </button>
                </div>

                <FormTitle title="Project" />
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="Service" value={form.service} onChange={(v) => updateField("service", v)} />
                  <Input label="Approx SqFt" value={form.approxSqft} onChange={(v) => updateField("approxSqft", v)} />
                  <Input label="Ceiling Height" value={form.ceilingHeight} onChange={(v) => updateField("ceilingHeight", v)} />
                  <Select label="Condition" value={form.ceilingCondition} onChange={(v) => updateField("ceilingCondition", v)} options={["Unknown", "Unpainted Popcorn", "Painted Popcorn", "Stipple / Texture", "Smooth Ceiling", "Water Damage", "Repair Only", "Other"]} />
                  {form.ceilingCondition === "Other" && <Input label="Other Condition" value={form.customCondition} onChange={(v) => updateField("customCondition", v)} />}
                </div>

                <FormTitle title="CRM" />
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="Lead Source" value={form.leadSource} onChange={(v) => updateField("leadSource", v)} />
                  <Select label="Lead Status" value={form.leadStatus} onChange={(v) => updateField("leadStatus", v)} options={["New Lead", "Contacted", "Estimate Sent", "Booked", "Completed", "Lost"]} />
                  <Select label="Colour Flag" value={form.projectFlag} onChange={(v) => updateField("projectFlag", v)} options={flagOptions} />
                  <Select label="Tag" value={form.tag} onChange={(v) => updateField("tag", v)} options={tagOptions} />
                  <Select label="Priority" value={form.priority} onChange={(v) => updateField("priority", v)} options={["Low", "Normal", "High", "Urgent"]} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {["Hot Lead", "Called Client No Response", "Need Photos", "Need Address", "Need Estimate", "Estimate Sent", "Booked", "Balance Due", "Paid"].map((tag) => (
                    <button key={tag} onClick={() => quickTag(tag)} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800">
                      {tag}
                    </button>
                  ))}
                </div>

                <FormTitle title="Estimate / Payment" />
                <div className="grid gap-3 md:grid-cols-4">
                  <Input type="date" label="Estimate Date" value={form.estimateDate} onChange={(v) => updateField("estimateDate", v)} />
                  <Input label="Estimate Amount" value={form.estimateAmount} onChange={(v) => updateField("estimateAmount", v)} />
                  <Select label="Estimate Sent" value={form.estimateSent} onChange={(v) => updateField("estimateSent", v)} options={["No", "Yes"]} />
                  <Input type="date" label="Follow-Up Date" value={form.followUpDate} onChange={setCustomFollowUpDate} />
                  <Input type="date" label="Booked Start Date" value={form.bookedStartDate} onChange={(v) => updateField("bookedStartDate", v)} />
                  <Input type="date" label="Completed Date" value={form.projectCompletedDate} onChange={(v) => updateField("projectCompletedDate", v)} />
                  <Input label="Deposit" value={form.depositAmount} onChange={(v) => updateField("depositAmount", v)} />
                  <Input label="Paid" value={form.paymentAmount} onChange={(v) => updateField("paymentAmount", v)} />
                  <Input label="Balance Due" value={form.balanceDue} onChange={(v) => updateField("balanceDue", v)} />
                  <Select label="Payment Method" value={form.paymentMethod} onChange={(v) => updateField("paymentMethod", v)} options={["", "Cash", "Cheque", "E-transfer", "Credit Card", "Other"]} />
                </div>

                <label className="mt-3 block text-sm font-bold">Project Notes</label>
                <textarea
                  value={form.projectNotes}
                  onChange={(e) => updateField("projectNotes", e.target.value)}
                  className="mt-1 min-h-24 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
                  placeholder="Estimate sent, call Friday, client wants level 5, balance due..."
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {["Called client, no answer.", "Sent estimate.", "Client asked for lower price.", "Waiting for photos.", "Waiting for start date.", "Payment received."].map((note) => (
                    <button
                      key={note}
                      onClick={() => {
                        updateField(
                          "projectNotes",
                          `${form.projectNotes ? `${form.projectNotes}\n` : ""}${new Date().toLocaleDateString("en-CA")}: ${note}`
                        );
                        addActivity(`Quick note added: ${note}`);
                      }}
                      className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800"
                    >
                      {note}
                    </button>
                  ))}
                </div>

                <LogPanel title="Activity" items={form.activity || []} />
                <HistoryPanel items={form.editHistory || []} />

                <div className="mt-4 flex gap-2">
                  <button onClick={saveClient} className="flex-1 rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white">
                    {editingId ? "Update Client" : "Save Client"}
                  </button>
                  <button onClick={resetForm} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
                placeholder="Search name, phone, email, city, service, tag, notes..."
              />
              <FilterSelect value={flagFilter} onChange={setFlagFilter} options={["All", ...flagOptions]} />
              <FilterSelect value={tagFilter} onChange={setTagFilter} options={["All", ...tagOptions]} />
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="rounded-2xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900">
                <option value="All">All Months</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isSelected={selectedClientId === client.id}
              isHistoryOpen={openHistoryId === client.id}
              toggleHistory={() => setOpenHistoryId(openHistoryId === client.id ? null : client.id)}
              openClient={openClient}
              quickFlag={quickFlag}
              editClient={editClient}
              deleteClient={deleteClient}
            />
          ))}

          {visibleClients.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              {activeView === "Today" ? "No priority clients for today." : "No clients found."}
            </div>
          )}
        </section>

        {selectedClient && (
          <ClientDrawer
            client={selectedClient}
            close={() => setSelectedClientId(null)}
            editClient={editClient}
            quickFlag={quickFlag}
          />
        )}
      </div>
    </main>
  );
}

function AssistantActionPreview({ action, apply, cancel }) {
  if (!action) return null;
  return (
    <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-black text-amber-950">{action.summary}</p>
          <div className="mt-2 grid gap-1 text-amber-900 md:grid-cols-2">
            {(action.changes || []).map((change) => (
              <p key={`${change.field}-${change.value}`} className="break-words">
                <b>{change.field}:</b> {change.value}
              </p>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={apply} className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-black text-white">
            Apply
          </button>
          <button onClick={cancel} className="rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-950">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceHelp({ editing, setCommand }) {
  const examples = editing
    ? [
        "set tag Hot Lead",
        "follow up tomorrow",
        "add note client wants evening call",
        "mark completed paid 6400",
      ]
    : [
        "add client Mike Jones phone 403-555-1212",
        "set client Laura Lewis tag Hot Lead",
        "add note for Laura Lewis call today",
        "mark Laura Lewis no response",
      ];

  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-slate-500">
        Voice can add: name, phone, email, city, service, status, tag, notes, follow-up, estimate, paid, balance.
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setCommand(example)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-slate-400"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceReplyToggle({ enabled, setEnabled }) {
  return (
    <label className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        className="h-4 w-4"
      />
      Voice confirmations
    </label>
  );
}

function VoiceAgentControls({ agentMode, setAgentMode, autoApply, setAutoApply }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <label className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-900">
        <input
          type="checkbox"
          checked={agentMode}
          onChange={(e) => setAgentMode(e.target.checked)}
          className="h-4 w-4"
        />
        Voice agent runs after I talk
      </label>
      <label className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-900">
        <input
          type="checkbox"
          checked={autoApply}
          onChange={(e) => setAutoApply(e.target.checked)}
          className="h-4 w-4"
        />
        Auto apply voice changes
      </label>
    </div>
  );
}

function ClientDrawer({ client, close, editClient, quickFlag }) {
  const timeline = [
    ...(client.activity || []).map((item, index) => ({
      id: `activity-${index}`,
      title: item,
      type: "Activity",
    })),
    ...(client.editHistory || []).map((item) => ({
      id: item.id,
      title: `${item.field}: ${item.from} -> ${item.to}`,
      type: item.date,
    })),
  ];

  return (
    <aside className="fixed inset-0 z-40 bg-slate-950/40 p-2 md:p-4">
      <div className="ml-auto flex h-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Client Detail</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {client.name || "Unnamed Client"}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {[client.service, client.city].filter(Boolean).join(" - ") || "No service or city"}
              </p>
            </div>
            <button onClick={close} className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-black">
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border-2 px-3 py-1 text-xs font-black ${flagClasses(client.projectFlag)}`}>
              {client.projectFlag || "No Flag"}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-800">
              {client.tag || "No Tag"}
            </span>
            {client.followUpDate && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-950">
                Follow-up {client.followUpDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-auto p-3">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <Info label="Phone" value={client.phone} />
            <Info label="Email" value={client.email} />
            <Info label="Address" value={client.address} />
            <Info label="Area" value={[client.neighborhood, client.city].filter(Boolean).join(", ")} />
            <Info label="Estimate" value={`${client.estimateDate || "No date"} - ${money(client.estimateAmount)}`} />
            <Info label="Payment" value={`Paid ${money(client.paymentAmount)} - Balance ${money(client.balanceDue)}`} />
          </div>

          <div className="flex flex-wrap gap-2">
            {client.phone && <ActionLink href={`tel:${client.phone}`}>Call</ActionLink>}
            {client.phone && <ActionLink href={`sms:${client.phone}`}>Text</ActionLink>}
            {client.email && <ActionLink href={`mailto:${client.email}`}>Email</ActionLink>}
            <button onClick={() => editClient(client)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
              Edit Full Card
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <FlagButton flag="Active" clientId={client.id} quickFlag={quickFlag}>Active</FlagButton>
            <FlagButton flag="No Response" clientId={client.id} quickFlag={quickFlag}>No Response</FlagButton>
            <FlagButton flag="Follow-Up" clientId={client.id} quickFlag={quickFlag}>Follow-Up</FlagButton>
            <FlagButton flag="Balance Due" clientId={client.id} quickFlag={quickFlag}>Balance Due</FlagButton>
            <FlagButton flag="Completed" clientId={client.id} quickFlag={quickFlag}>Completed</FlagButton>
          </div>

          {client.projectNotes && (
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <p className="font-black">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{client.projectNotes}</p>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-3 text-sm">
            <p className="font-black">Timeline</p>
            {!timeline.length ? (
              <p className="mt-2 text-slate-500">No timeline entries yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {timeline.slice(0, 20).map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-2">
                    <p className="text-xs font-bold text-slate-500">{item.type}</p>
                    <p className="mt-1 text-slate-800">{item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function ClientCard({ client, isSelected, isHistoryOpen, toggleHistory, openClient, quickFlag, editClient, deleteClient }) {
  const dueToday =
    client.followUpDate && client.followUpDate <= todayISO() && client.projectFlag !== "Completed";

  return (
    <article className={`rounded-xl border-2 p-3 shadow-sm ${isSelected ? "ring-4 ring-slate-900/20" : ""} ${flagClasses(client.projectFlag)}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openClient(client)}
              className="text-left text-xl font-black text-slate-950 hover:underline"
            >
              {client.name || "Unnamed Client"}
            </button>
            <span className={`rounded-full border-2 px-3 py-1 text-xs font-black ${flagClasses(client.projectFlag)}`}>
              {client.projectFlag || "—"}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-800">
              {client.tag || "—"}
            </span>
            {dueToday && <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">DUE TODAY</span>}
            {(client.voiceNotes || []).length > 0 && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800">
                Voice: {(client.voiceNotes || []).length}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-slate-700">
            {client.service || "No service"} {client.approxSqft ? `- ${client.approxSqft} sq ft` : ""}
          </p>

          <div className="flex flex-wrap gap-2">
            {client.phone && <ActionLink href={`tel:${client.phone}`}>Call Client</ActionLink>}
            {client.phone && <ActionLink href={`sms:${client.phone}`}>Text Client</ActionLink>}
            {client.email && <ActionLink href={`mailto:${client.email}`}>Email Client</ActionLink>}
          </div>

          <div className="grid gap-2 text-sm md:grid-cols-3">
            <Info label="Phone" value={client.phone} />
            <Info label="Email" value={client.email} />
            <Info label="Area" value={[client.neighborhood, client.city].filter(Boolean).join(", ")} />
            <Info label="Estimate" value={`${client.estimateDate || "No date"} - ${money(client.estimateAmount)}`} />
            <Info label="Follow-Up" value={client.followUpDate} />
            <Info label="Completed" value={client.projectCompletedDate} />
          </div>

          <div className="rounded-2xl bg-white/80 p-3 text-sm">
            <p>
              <b>Condition:</b>{" "}
              {client.ceilingCondition === "Other"
                ? client.customCondition || "Other"
                : client.ceilingCondition || "—"}
            </p>
            <p>
              <b>Payment:</b> Deposit {money(client.depositAmount)} - Paid{" "}
              {money(client.paymentAmount)} - Balance {money(client.balanceDue)}{" "}
              {client.paymentMethod ? `- ${client.paymentMethod}` : ""}
            </p>
            {client.projectNotes && (
              <p className="mt-2 whitespace-pre-wrap">
                <b>Notes:</b> {client.projectNotes}
              </p>
            )}
          </div>

          {(client.voiceNotes || []).length > 0 && (
            <div className="space-y-2 rounded-2xl bg-white/80 p-3 text-sm">
              <p className="font-black">Voice Notes</p>
              {client.voiceNotes.map((note) => (
                <div key={note.id}>
                  <p className="mb-1 text-xs font-bold text-slate-600">{note.name}</p>
                  <audio controls src={note.url} className="w-full" />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <FlagButton flag="Active" clientId={client.id} quickFlag={quickFlag}>Green Active</FlagButton>
            <FlagButton flag="No Response" clientId={client.id} quickFlag={quickFlag}>Orange No Response</FlagButton>
            <FlagButton flag="No Response" clientId={client.id} quickFlag={quickFlag}>Called Client No Response</FlagButton>
            <FlagButton flag="Follow-Up" clientId={client.id} quickFlag={quickFlag}>Follow-Up</FlagButton>
            <FlagButton flag="Balance Due" clientId={client.id} quickFlag={quickFlag}>Balance Due</FlagButton>
            <FlagButton flag="Completed" clientId={client.id} quickFlag={quickFlag}>Red Completed</FlagButton>
          </div>

          <button onClick={toggleHistory} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800">
            {isHistoryOpen ? "Hide Edit History" : "Show Edit History"}
          </button>
          {isHistoryOpen && <HistoryPanel items={client.editHistory || []} />}
        </div>

        <div className="flex gap-2 md:flex-col">
          <button onClick={() => openClient(client)} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900">
            Open
          </button>
          <button onClick={() => editClient(client)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
            Edit
          </button>
          <button onClick={() => deleteClient(client.id)} className="rounded-2xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function VoiceNotesPanel({ form, recording, startRecording, stopRecording, handleVoiceFiles, removeVoiceNote }) {
  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-600">Voice Notes</h3>
      <p className="mt-1 text-sm text-slate-500">Record a quick note or upload an audio file.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!recording ? (
          <button onClick={startRecording} className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-black text-white">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white">
            Stop Recording
          </button>
        )}
        <label className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black">
          Upload Voice File
          <input type="file" accept="audio/*" multiple className="hidden" onChange={(e) => handleVoiceFiles(e.target.files)} />
        </label>
      </div>

      <div
        onDrop={(e) => {
          e.preventDefault();
          handleVoiceFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500"
      >
        Drop voice files here
      </div>

      {(form.voiceNotes || []).length > 0 && (
        <div className="mt-3 space-y-2">
          {form.voiceNotes.map((note) => (
            <div key={note.id} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{note.name}</p>
                  <p className="text-xs text-slate-500">{note.createdAt}</p>
                </div>
                <button onClick={() => removeVoiceNote(note.id)} className="rounded-xl border border-red-200 px-2 py-1 text-xs font-bold text-red-700">
                  Remove
                </button>
              </div>
              <audio controls src={note.url} className="mt-2 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlagButton({ flag, clientId, quickFlag, children }) {
  return (
    <button onClick={() => quickFlag(clientId, flag)} className={`rounded-2xl border-2 bg-white px-3 py-2 text-sm font-black ${flagClasses(flag)}`}>
      {children}
    </button>
  );
}

function VoiceTextButton({ active, start, stop, label = "Voice" }) {
  return (
    <button
      type="button"
      onClick={active ? stop : start}
      className={`rounded-2xl px-4 py-2 text-sm font-black ${
        active
          ? "bg-red-600 text-white"
          : "border border-slate-300 bg-white text-slate-900"
      }`}
    >
      {active ? "Listening" : label}
    </button>
  );
}

function ActionLink({ href, children }) {
  return (
    <a href={href} className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-900">
      {children}
    </a>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function FormTitle({ title }) {
  return (
    <h3 className="mt-5 border-t border-slate-200 pt-4 text-sm font-black uppercase tracking-wide text-slate-500">
      {title}
    </h3>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="mt-3 block text-sm font-bold">
      {label}
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function GoogleAddressInput({ inputRef, value, onChange }) {
  return (
    <label className="mt-3 block text-sm font-bold">
      Address
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
        placeholder="Start typing street or city"
        autoComplete="off"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="mt-3 block text-sm font-bold">
      {label}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}

function LogPanel({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm">
      <p className="font-black">{title}</p>
      <div className="mt-2 max-h-36 space-y-1 overflow-auto text-slate-600">
        {items.map((item, index) => (
          <p key={`${item}-${index}`}>- {item}</p>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ items }) {
  return (
    <div className="mt-4 rounded-2xl bg-white/80 p-3 text-sm">
      <p className="font-black">Edit History</p>
      {!items.length ? (
        <p className="mt-2 text-slate-500">No edits recorded yet.</p>
      ) : (
        <div className="mt-2 max-h-48 space-y-2 overflow-auto">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-2">
              <p className="text-xs font-bold text-slate-500">{item.date}</p>
              <p className="font-bold">{item.field}</p>
              <p className="break-words text-slate-600">
                {item.from} {" -> "} {item.to}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
