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

- Lead endpoint: `POST /api/crm/gpt`
- Custom GPT OpenAPI schema: `/api/crm/gpt/openapi`
- Auth: `Authorization: Bearer <CRM_API_TOKEN>`

Example request:

```bash
curl -X POST https://your-domain.com/api/crm/gpt \
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
