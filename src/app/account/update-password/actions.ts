"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (typeof password !== "string" || typeof passwordConfirmation !== "string" || password === "" || passwordConfirmation === "") {
    redirect("/account/update-password?error=Enter and confirm your new password.");
  }

  if (password.length < 8) {
    redirect("/account/update-password?error=Choose a password with at least 8 characters.");
  }

  if (password !== passwordConfirmation) {
    redirect("/account/update-password?error=The passwords do not match.");
  }

  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/forgot-password?error=Your password reset session is invalid or has expired.");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("Unable to update password:", error);
    redirect("/account/update-password?error=Unable to update password.");
  }

  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");

  redirect("/login?message=Your password has been updated. Sign in with your new password.");
}
