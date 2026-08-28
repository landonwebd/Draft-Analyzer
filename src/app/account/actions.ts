"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function deleteAccount(formData: FormData) {
  const confirmation = formData.get("confirmation");
  const password = formData.get("password");

  if (confirmation !== "DELETE") {
    redirect("/account?error=Type DELETE to confirm account deletion.");
  }

  if (typeof password !== "string" || password === "") {
    redirect("/account?error=Enter your current password to delete your account.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?error=Your session has expired. Sign in and try again.");
  }

  if (typeof data.user.email !== "string") {
    redirect("/account?error=Unable to verify your account email.");
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: data.user.email,
    password,
  });

  if (passwordError) {
    redirect("/account?error=Your current password is incorrect.");
  }

  const adminSupabase = createAdminClient();

  const { error: deletionError } = await adminSupabase.auth.admin.deleteUser(data.user.id);

  if (deletionError) {
    console.error("Unable to delete Supabase user:", deletionError);
    redirect("/account?error=Unable to delete your account. Please try again.");
  }

  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");
  redirect("/login?message=Your account and cloud-saved data have been permanently deleted.");
}
