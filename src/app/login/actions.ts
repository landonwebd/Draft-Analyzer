"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || email.trim() === "" || password === "") {
    redirect("/login?error=Enter an email address and password.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    redirect("/login?error=Unable to sign in with those credentials.");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || email.trim() === "" || password === "") {
    redirect("/login?mode=signup&error=Enter an email address and password.");
  }

  if (password.length < 8) {
    redirect("/login?mode=signup&error=Choose a password with at least 8 characters.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    redirect("/login?mode=signup&error=Unable to create an account.");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
