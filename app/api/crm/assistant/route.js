import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const allowedFields = [
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
  "notes",
  "projectNotes",
];

const actionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: ["create", "update", "form", "noop"],
    },
    targetName: {
      type: "string",
      description: "Client name to update. Empty for create, form, or noop.",
    },
    appendNote: {
      type: "boolean",
      description: "True when projectNotes should be appended as a dated note.",
    },
    message: {
      type: "string",
      description: "Short plain-English explanation of what the action will do.",
    },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: {
            type: "string",
            enum: allowedFields,
          },
          value: {
            type: "string",
          },
        },
        required: ["field", "value"],
      },
    },
  },
  required: ["type", "targetName", "appendNote", "message", "changes"],
};

function compactClient(client) {
  const lastContact = (client?.communicationLog || []).find((item) =>
    ["call", "text", "email", "note"].includes(item?.type)
  );

  return {
    name: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    city: client?.city || "",
    service: client?.service || "",
    projectFlag: client?.projectFlag || "",
    tag: client?.tag || "",
    followUpDate: client?.followUpDate || "",
    balanceDue: client?.balanceDue || "",
    notes: client?.notes || client?.projectNotes || "",
    lastContactDate: lastContact?.date?.slice(0, 10) || "",
  };
}

function getApiKey() {
  try {
    return process.env.OPENAI_API_KEY || "";
  } catch {
    return "";
  }
}

function parseResponseJson(data) {
  if (typeof data?.output_text === "string") return JSON.parse(data.output_text);

  const text = data?.output
    ?.flatMap((item) => item.content || [])
    ?.map((content) => content.text || "")
    ?.join("");

  if (!text) return null;
  return JSON.parse(text);
}

export async function POST(req) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 501 }
    );
  }

  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const command = String(payload?.command || "").trim();
  if (!command) {
    return NextResponse.json({ error: "Missing assistant command" }, { status: 400 });
  }

  const clients = Array.isArray(payload?.clients) ? payload.clients : [];
  const openClient = payload?.openClient || null;
  const today = new Date().toISOString().slice(0, 10);

  const system = [
    "You are a CRM command parser for a renovation contractor.",
    "Return JSON only through the supplied schema.",
    "Do not invent facts. Only extract changes explicitly requested by the user.",
    "Use type form when the user says opened card, current card, this client, or this card.",
    "Use type update when the user names an existing client.",
    "Use type create only when the user clearly asks to add/create/new client/lead/customer.",
    "Use type noop if the command is unclear or no CRM change is requested.",
    `Today is ${today}. Convert today/tomorrow/in N days to YYYY-MM-DD where relevant.`,
    "For add note/note/notes, set field notes and appendNote true.",
    "For completed/done/finished, set projectFlag Completed, leadStatus Completed, and projectCompletedDate if not supplied.",
    "For no response, set projectFlag No Response and tag Called Client No Response.",
    "For estimate sent/quote sent, set estimateSent Yes, leadStatus Estimate Sent, and tag Estimate Sent.",
    "For booked, set leadStatus Booked and tag Booked.",
    "For paid, set tag Paid and paymentAmount only if an amount is provided.",
  ].join("\n");

  const userContext = {
    command,
    openClient: openClient ? compactClient(openClient) : null,
    existingClients: clients.slice(0, 80).map(compactClient),
    allowedFields,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CRM_MODEL || "gpt-5.4",
        input: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(userContext) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "crm_action",
            strict: true,
            schema: actionSchema,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("OpenAI CRM assistant failed", data);
      return NextResponse.json(
        { error: "AI assistant request failed", detail: data?.error?.message || "" },
        { status: 502 }
      );
    }

    const action = parseResponseJson(data);
    if (!action) {
      return NextResponse.json({ error: "AI assistant returned no action" }, { status: 502 });
    }

    return NextResponse.json({ action });
  } catch (err) {
    console.warn("OpenAI CRM assistant error", err);
    return NextResponse.json({ error: "AI assistant unavailable" }, { status: 502 });
  }
}
