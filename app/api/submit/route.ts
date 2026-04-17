import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as postmark from "postmark";
import { buildUserMessage, FormData } from "@/lib/build-user-message";
import { generatePdf } from "@/lib/generate-pdf";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const maxDuration = 300;

// Initialise clients at module level so env vars are captured on server start,
// not inside the after() callback where Turbopack may not expose process.env.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const postmarkClient = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!);

const REQUIRED: (keyof FormData)[] = [
  "f-name",
  "f-email",
  "f-age",
  "f-situation",
  "f-concern",
  "f-background",
  "f-skills",
  "f-interests",
  "f-runway",
  "f-blocker",
  "f-vision",
];

function validateForm(
  body: unknown
): { valid: true; data: FormData } | { valid: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;
  for (const field of REQUIRED) {
    if (
      !b[field] ||
      typeof b[field] !== "string" ||
      !(b[field] as string).trim()
    ) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  if (
    typeof b["f-email"] === "string" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b["f-email"])
  ) {
    return { valid: false, error: "Invalid email address" };
  }
  return { valid: true, data: b as unknown as FormData };
}

async function sendAlertEmail(subject: string, body: string) {
  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail) return;
  try {
    await postmarkClient.sendEmail({
      From: `GoReinvent <${alertEmail}>`,
      To: alertEmail,
      Subject: subject,
      TextBody: body,
    });
  } catch {
    console.error("[alert] Failed to send alert email");
  }
}

async function generateReport(form: FormData): Promise<string> {
  const userMessage = buildUserMessage(form);

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS_MS = [5000, 10000];

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
      console.log(`[claude] Retrying (attempt ${attempt + 1})...`);
    }
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1800,
        temperature: 0.7 as never,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = response.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") {
        throw new Error("No text content in Claude response");
      }
      return block.text;
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (status && status < 500) throw err;
      console.error(
        `[claude] Attempt ${attempt + 1} failed (status ${status}):`,
        err
      );
    }
  }
  throw lastError;
}

async function sendReportEmail(
  toEmail: string,
  toName: string,
  pdfBuffer: Buffer
) {
  const fromEmail = process.env.ALERT_EMAIL!;

  await postmarkClient.sendEmail({
    From: `GoReinvent <${fromEmail}>`,
    ReplyTo: fromEmail,
    To: toEmail,
    Subject: "Your Reinvention Readiness Report: GoReinvent",
    TextBody: `Hi ${toName},

Your Reinvention Readiness Report is attached.

It was written specifically for you, based on what you shared. Read it when you have 20 minutes without distraction.

When you get to Section 3, pay particular attention to the two questions it closes with. They are the ones that matter most for what comes next.

John Thwaites
GoReinvent`,
    HtmlBody: `<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#000;">Hi ${toName},</p>
<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#000;">Your Reinvention Readiness Report is attached.</p>
<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#000;">It was written specifically for you, based on what you shared. Read it when you have 20 minutes without distraction.</p>
<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#000;">When you get to Section 3, pay particular attention to the two questions it closes with. They are the ones that matter most for what comes next.</p>
<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#000;">John Thwaites<br>GoReinvent</p>`,
    Attachments: [
      {
        Name: "reinvention-readiness-report.pdf",
        Content: pdfBuffer.toString("base64"),
        ContentType: "application/pdf",
        ContentID: "",
      },
    ],
  });
}

async function addToGetResponse(email: string, name: string) {
  const apiKey = process.env.GETRESPONSE_API_KEY!;
  const campaignId = process.env.GETRESPONSE_CAMPAIGN_ID!;
  const headers = {
    "Content-Type": "application/json",
    "X-Auth-Token": `api-key ${apiKey}`,
  };

  const res = await fetch("https://api.getresponse.com/v3/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, name, campaign: { campaignId } }),
  });

  if (res.status === 409) {
    const search = await fetch(
      `https://api.getresponse.com/v3/contacts?query[email]=${encodeURIComponent(email)}&fields=contactId,name`,
      { headers }
    );
    if (search.ok) {
      const contacts = (await search.json()) as Array<{
        contactId: string;
        name: string;
      }>;
      if (contacts.length > 0) {
        await fetch(
          `https://api.getresponse.com/v3/contacts/${contacts[0].contactId}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ name }),
          }
        );
      }
    }
    return;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("[getresponse] Failed to add contact:", res.status, text);
  }
}

async function runPipeline(form: FormData) {
  const email = form["f-email"];
  const name = form["f-name"];

  try {
    console.log("[pipeline] Calling Claude API...");
    const reportText = await generateReport(form);
    console.log("[pipeline] Report generated, length:", reportText.length);

    console.log("[pipeline] Generating PDF...");
    const pdfBuffer = await generatePdf(reportText);
    console.log("[pipeline] PDF generated, size:", pdfBuffer.length);

    // Wait 90 seconds before sending (deliberate delivery delay)
    console.log("[pipeline] Waiting 90 seconds before sending...");
    await new Promise((r) => setTimeout(r, 90 * 1000));

    console.log("[pipeline] Sending report email...");
    await sendReportEmail(email, name, pdfBuffer);
    console.log("[pipeline] Email sent to:", email);

    console.log("[pipeline] Adding to GetResponse...");
    await addToGetResponse(email, name).catch((err) => {
      console.error("[pipeline] GetResponse error (non-fatal):", err);
    });
    console.log("[pipeline] Done.");
  } catch (err) {
    console.error("[pipeline] Fatal error:", err);
    await sendAlertEmail(
      `⚠️ Reinvention Readiness Report: report failed for ${email}`,
      `A report failed to generate or send.\n\nProspect: ${name} <${email}>\n\nError: ${
        err instanceof Error ? err.message : String(err)
      }\n\nPlease follow up manually.`
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateForm(body);
  if (!validation.valid) {
    return Response.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  after(() => runPipeline(validation.data));

  return Response.json({ ok: true });
}
