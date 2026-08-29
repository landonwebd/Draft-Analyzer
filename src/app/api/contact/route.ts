import { createHmac } from "node:crypto";
import { checkContactRateLimit } from "@/lib/supabase/contactRateLimit";
import { Resend } from "resend";

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function createContactRequestHash(request: Request): string {
  const rateLimitSecret = process.env.CONTACT_RATE_LIMIT_SECRET;

  if (!rateLimitSecret) {
    throw new Error("CONTACT_RATE_LIMIT_SECRET is not configured.");
  }

  const requestSource = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "local-development";

  return createHmac("sha256", rateLimitSecret).update(requestSource).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid contact-form request." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Invalid contact-form request." }, { status: 400 });
  }

  const requestBody = body as Record<string, unknown>;
  const name = typeof requestBody.name === "string" ? requestBody.name.trim() : "";
  const email = typeof requestBody.email === "string" ? requestBody.email.trim() : "";
  const message = typeof requestBody.message === "string" ? requestBody.message.trim() : "";
  const company = typeof requestBody.company === "string" ? requestBody.company.trim() : "";

  if (company !== "") {
    return Response.json({
      message: "Thanks! Your message has been sent.",
    });
  }

  if (name.length > 100) {
    return Response.json({ error: "Name must be 100 characters or fewer." }, { status: 400 });
  }

  if (email === "" || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (message.length < 10 || message.length > 5000) {
    return Response.json({ error: "Message must be between 10 and 5,000 characters." }, { status: 400 });
  }

  try {
    const requestHash = createContactRequestHash(request);
    const rateLimitResult = await checkContactRateLimit(requestHash);

    if (rateLimitResult === "burst_limit" || rateLimitResult === "daily_limit") {
      return Response.json(
        {
          error: "Too many messages have been sent. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult === "burst_limit" ? "600" : "86400",
          },
        },
      );
    }

    if (rateLimitResult !== "allowed") {
      console.error(`Unexpected contact-form rate-limit result: ${rateLimitResult}`);

      return Response.json({ error: "Unable to send your message. Please try again." }, { status: 503 });
    }
  } catch (error) {
    console.error("Unable to check contact-form rate limit:", error);

    return Response.json({ error: "Unable to send your message. Please try again." }, { status: 503 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const contactEmailTo = process.env.CONTACT_EMAIL_TO;

  if (!resendApiKey || !contactEmailTo) {
    console.error("Contact-form email configuration is missing.");

    return Response.json({ error: "Unable to send your message. Please try again." }, { status: 503 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const { error } = await resend.emails.send({
      from: "Draft Analyzer <no-reply@auth.landonmade.com>",
      to: contactEmailTo,
      replyTo: `Contact Form User <${email}>`,
      subject: "New Draft Analyzer contact message",
      text: [`Name: ${name || "Not provided"}`, `Email: ${email}`, "", "Message:", message].join("\n"),
    });

    if (error) {
      console.error("Resend could not send the contact message:", error);

      return Response.json({ error: "Unable to send your message. Please try again." }, { status: 502 });
    }
  } catch (error) {
    console.error("Unable to contact Resend:", error);

    return Response.json({ error: "Unable to send your message. Please try again." }, { status: 502 });
  }

  return Response.json({
    message: "Thanks! Your message has been sent.",
  });
}
