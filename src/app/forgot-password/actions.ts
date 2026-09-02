"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || email.trim() === "") {
    redirect("/forgot-password?error=Enter your email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not configured.");
    redirect("/forgot-password?error=Password recovery is temporarily unavailable.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: siteUrl,
  });

  if (error) {
    console.error("Unable to request password reset:", error);
    redirect("/forgot-password?error=Unable to send a password reset email. Please try again.");
  }

  redirect("/forgot-password?message=If an account exists for that email address, a password reset link has been sent. Check your inbox and spam folder.");
}
