import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const receiptCategories = ["Materials", "Tools", "Subcontractor", "Dump / Disposal", "Parking", "Fuel", "Other"];

const receiptSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    vendor: { type: "string" },
    date: { type: "string", description: "Receipt date as YYYY-MM-DD, or empty if unknown." },
    amount: { type: "string", description: "Grand total including tax, numbers only when known." },
    hst: { type: "string", description: "Sales tax/HST amount, numbers only when known." },
    category: { type: "string", enum: receiptCategories },
    notes: { type: "string", description: "Short useful note with invoice number or uncertain fields." },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["vendor", "date", "amount", "hst", "category", "notes", "confidence"],
};

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

function fileInputFor(fileData = "", fileType = "", fileName = "receipt") {
  const type = String(fileType || "").toLowerCase();
  if (type.includes("pdf") || String(fileName).toLowerCase().endsWith(".pdf")) {
    return {
      type: "input_file",
      filename: fileName || "receipt.pdf",
      file_data: fileData,
    };
  }

  return {
    type: "input_image",
    image_url: fileData,
  };
}

export async function POST(req) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 501 });
  }

  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fileData = String(payload?.fileData || "");
  const ocrText = String(payload?.text || "");
  if (!fileData && !ocrText) {
    return NextResponse.json({ error: "Missing receipt file or text." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const system = [
    "You extract renovation contractor receipt data for bookkeeping.",
    "Return JSON only through the supplied schema.",
    "Use the grand total including tax as amount.",
    "Use HST/GST/PST/sales tax as hst when visible.",
    "If a field is unreadable, return an empty string and set confidence low or medium.",
    `Today is ${today}. Do not invent dates.`,
  ].join("\n");

  const userContent = [
    {
      type: "input_text",
      text: JSON.stringify({
        task: "Extract receipt fields.",
        allowedCategories: receiptCategories,
        pastedText: ocrText,
        fileName: payload?.fileName || "",
      }),
    },
  ];

  if (fileData) {
    userContent.push(fileInputFor(fileData, payload?.fileType || "", payload?.fileName || "receipt"));
  }

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECEIPT_MODEL || process.env.OPENAI_CRM_MODEL || "gpt-5.4",
        input: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt_ocr",
            strict: true,
            schema: receiptSchema,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("Receipt OCR failed", data);
      return NextResponse.json(
        { error: "Receipt OCR request failed", detail: data?.error?.message || "" },
        { status: 502 }
      );
    }

    const receipt = parseResponseJson(data);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt OCR returned no result" }, { status: 502 });
    }

    return NextResponse.json({ receipt });
  } catch (err) {
    console.warn("Receipt OCR unavailable", err);
    return NextResponse.json({ error: "Receipt OCR unavailable" }, { status: 502 });
  }
}
