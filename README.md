This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## CRM GPT Intake API

Set `CRM_API_TOKEN` in the deployment environment before using the external CRM intake endpoint.

- Live CRM page: `https://epftoolbox.pages.dev/crm/`
- Lead endpoint: `POST https://epftoolbox.pages.dev/api/crm/gpt`
- Custom GPT OpenAPI schema: `https://raw.githubusercontent.com/alexpasek/epftoolbox/main/public/crm-gpt-openapi.json`
- Privacy policy: `https://epftoolbox.pages.dev/privacy-policy`
- Auth: `Authorization: Bearer <CRM_API_TOKEN>`

Available GPT actions:

- `listCrmClients`: search/list CRM clients and get client ids
- `createCrmLead`: create a new CRM client or lead, optionally with an attached printable quote
- `updateCrmClient`: edit client fields, statuses, payments, and notes by id or exact name
- `deleteCrmClient`: soft-delete a client by id or exact name

Custom GPT Action setup:

1. In GPT Builder, go to **Configure** -> **Actions**.
2. Click **Create new action**.
3. Click **Import from URL**.
4. Paste:

```text
https://raw.githubusercontent.com/alexpasek/epftoolbox/main/public/crm-gpt-openapi.json
```

5. Set authentication:

```text
Authentication: API Key
Auth Type: Bearer
API Key: <CRM_API_TOKEN>
```

6. Set privacy policy URL:

```text
https://epftoolbox.pages.dev/privacy-policy
```

Example request:

```bash
curl -X POST https://epftoolbox.pages.dev/api/crm/gpt \
  -H "Authorization: Bearer $CRM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "lead": {
      "name": "John Smith",
      "phone": "416-555-0199",
      "email": "john@example.com",
      "city": "Mississauga",
      "service": "Popcorn Ceiling Removal",
      "squareFootage": "1200 sqft",
      "notes": "Client wants an estimate next week."
    }
  }'
```

The endpoint also accepts `leadText` for raw website forms, emails, or voicemail transcripts and extracts basic contact/project fields.

Example GPT prompt for CRM + quote:

```text
Create a CRM lead and quote:
Name: Jane Lee
Phone: 905-555-0123
City: Burlington
Service: Popcorn Ceiling Removal
Quote amount: 5200
Quote notes: Popcorn removal, skim coat, prime, and cleanup.
```

When a `quote` object is included, the API saves a quote/invoice record, attaches it to the CRM client, and returns a printable quote link like `/invoice-basic?id=...`. Open that link and use **Print / Save PDF** to create the PDF.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
