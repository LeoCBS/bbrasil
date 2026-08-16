'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/alert';
import { Unit } from '@/lib/units';
import { Profile } from '@/lib/users';
import React from 'react';

export function UserForm({ user, units, action, submitLabel, submitIcon }: {
  user?: Profile;
  units: Unit[];
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  submitIcon: React.ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = React.useTransition();

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      setSuccess('Perfil salvo com sucesso.');
      if (!user) formRef.current?.reset();
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      {success ? <Alert variant="success" message={success} onClose={() => setSuccess('')} /> : null}
      {error ? <Alert variant="error" message={error} onClose={() => setError('')} /> : null}

      {user ? <input type="hidden" name="id" value={user.id} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`email-${user?.id ?? 'new'}`}>Email</Label>
          <Input id={`email-${user?.id ?? 'new'}`} name="email" defaultValue={user?.email ?? ''} placeholder="usuario@exemplo.com" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`name-${user?.id ?? 'new'}`}>Nome</Label>
          <Input id={`name-${user?.id ?? 'new'}`} name="name" defaultValue={user?.name ?? ''} placeholder="Nome completo" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`unit_id-${user?.id ?? 'new'}`}>Unidade</Label>
        <select id={`unit_id-${user?.id ?? 'new'}`} name="unit_id" defaultValue={user?.unit_id ?? ''} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Sem unidade</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`role-${user?.id ?? 'new'}`}>Role</Label>
          <select id={`role-${user?.id ?? 'new'}`} name="role" defaultValue={user?.role ?? 'vendedor'} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`active-${user?.id ?? 'new'}`}>Ativo</Label>
          <div className="mt-2">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" id={`active-${user?.id ?? 'new'}`} name="active" defaultChecked={user?.active ?? true} className="h-4 w-4 rounded border-input accent-brand-green" />
              Ativo
            </label>
          </div>
        </div>

        <div className="grid gap-2" />
      </div>

      <SubmitButton className="w-full" pendingLabel={user ? 'Salvando...' : 'Criando...'} forcePending={isPending}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
