// Supabase Auth Hook for sending custom emails via Resend
// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />
import { Webhook } from "standardwebhooks";
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

const resend = new Resend(RESEND_API_KEY);

// Mapping of email action types to Resend template IDs and subjects
// You need to create these templates in your Resend dashboard
const EMAIL_TEMPLATES = {
  signup: "confirm-account", // Create this template in Resend
  recovery: "reset-password", // Create this template in Resend
  password_changed_notification: "password-changed-notification", // Create this template in Resend
};

// Types for the webhook payload
interface WebhookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: keyof typeof EMAIL_TEMPLATES;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  if (!RESEND_API_KEY || !HOOK_SECRET || !SENDER_EMAIL) {
    console.error("Missing required environment variables.");
    return new Response("Internal Server Error: Configuration missing", {
      status: 500,
    });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));

  try {
    // Verify the webhook signature and extract payload
    // We cast to unknown first then WebhookPayload because verify returns any
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as unknown as WebhookPayload;

    // Get the template configuration for this action
    const templateConfig = EMAIL_TEMPLATES[email_action_type];

    if (!templateConfig) {
      console.warn(`No template found for action type: ${email_action_type}`);
      // Fallback or return error depending on your preference.
      // Returning 200 to avoid retries if you don't want to handle this type.
      throw new Error(`Unsupported email action type: ${email_action_type}`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace("http://", "https://");
    
    // Using the raw URL as shown in your example (no encoding)
    const targetRedirect = redirect_to || site_url;
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${targetRedirect}`;

    // Send the email via Resend
    const { error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [user.email],
      template: {
        id: templateConfig,
        variables: {
          USER_EMAIL: user.email,
          CONFIRMATION_URL: confirmationUrl,
        },
      },
    });

    if (error) {
      throw error;
    }

    console.log(
      `Email sent successfully for ${email_action_type} to ${user.email}`
    );

    // Success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing email webhook:", error);

    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});