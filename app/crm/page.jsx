"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DELETE_PASSWORD = "1234";
const CRM_STORAGE_KEY = "epf.crm.clients";

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
  const addressInputRef = useRef(null);
  const addressAutocompleteRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      updateClientList((current) => [
        {
          ...form,
          id: makeId(),
          updatedAt: new Date().toISOString(),
          activity: [`${timeStamp()}: Client saved.`, ...(form.activity || [])],
          editHistory: form.editHistory || [],
        },
        ...current,
      ]);
    }

    resetForm();
  }

  function editClient(client) {
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
            </div>
          </div>
          {copyMessage && (
            <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white">
              {copyMessage}
            </p>
          )}
        </header>

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
                <label className="block text-sm font-bold">
                  Paste email / form / voicemail text
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="mt-1 min-h-52 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
                  placeholder={"Name: Laura Lewis\nPhone: 4036088822\nEmail: laura-lewis@live.com\nNeighborhood: Silver Springs\nService: Popcorn Ceiling Removal\nApprox SqFt: 1400\n\nOr paste voicemail text: My name is Bash. Call me back at 403-835-6535. I want to change popcorn ceiling to knockdown."}
                />
                <button
                  onClick={autoFillFromPaste}
                  className="mt-2 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                >
                  Auto-Fill From Paste
                </button>

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

          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isHistoryOpen={openHistoryId === client.id}
              toggleHistory={() => setOpenHistoryId(openHistoryId === client.id ? null : client.id)}
              quickFlag={quickFlag}
              editClient={editClient}
              deleteClient={deleteClient}
            />
          ))}

          {filteredClients.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No clients found.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ClientCard({ client, isHistoryOpen, toggleHistory, quickFlag, editClient, deleteClient }) {
  const dueToday =
    client.followUpDate && client.followUpDate <= todayISO() && client.projectFlag !== "Completed";

  return (
    <article className={`rounded-2xl border-4 p-4 shadow-md ${flagClasses(client.projectFlag)}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black text-slate-950">
              {client.name || "Unnamed Client"}
            </h3>
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
