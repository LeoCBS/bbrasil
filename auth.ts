import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const ACCESS_TOKEN_COOKIE = "bbrasil-supabase-access-token";
const REFRESH_TOKEN_COOKIE = "bbrasil-supabase-refresh-token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para usar o login.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function getSafeNextPath(value: FormDataEntryValue | string | null) {
  const next = String(value ?? "/admin/produtos");

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/admin/produtos";
  }

  return next;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login?next=/admin/produtos");
  }

  return user;
}

export async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = getSafeNextPath(formData.get("next"));

  if (!email || !password) {
    redirect(`/admin/login?error=missing&next=${encodeURIComponent(next)}`);
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
    ...cookieOptions,
    maxAge: data.session.expires_in
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30
  });

  redirect(next);
}

export async function logoutAction() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);

  redirect("/admin/login");
}
