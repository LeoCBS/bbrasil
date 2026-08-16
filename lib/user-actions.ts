"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/auth";
import { createProfile, updateProfile, deleteProfile } from "@/lib/users";

function parseBoolean(formData: FormData, name: string) {
  return formData.get(name) === 'on';
}

function parseProfile(formData: FormData) {
  return {
    user_id: String(formData.get('user_id') ?? '').trim() || null,
    email: String(formData.get('email') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim() || null,
    unit_id: String(formData.get('unit_id') ?? '').trim() || null,
    role: (String(formData.get('role') ?? 'vendedor') as 'admin' | 'vendedor'),
    active: parseBoolean(formData, 'active')
  };
}

export async function createProfileAction(formData: FormData) {
  await requireAdminUser('/admin/usuarios');
  const profile = parseProfile(formData);
  if (!profile.email) throw new Error('Informe um e-mail válido.');
  await createProfile(profile);
  revalidatePath('/admin/usuarios');
}

export async function updateProfileAction(formData: FormData) {
  await requireAdminUser('/admin/usuarios');
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('ID do perfil ausente');
  const profile = parseProfile(formData);
  await updateProfile(id, profile);
  revalidatePath('/admin/usuarios');
}

export async function deleteProfileAction(formData: FormData) {
  await requireAdminUser('/admin/usuarios');
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('ID do perfil ausente');
  await deleteProfile(id);
  revalidatePath('/admin/usuarios');
}
