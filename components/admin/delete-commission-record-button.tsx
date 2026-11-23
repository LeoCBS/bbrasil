'use client';

import { FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Trash2 } from 'lucide-react';

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-label="Remover comissão" title="Remover comissão" className="rounded p-1 text-red-700 hover:bg-red-50 disabled:opacity-60">
      {pending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  );
}

export function DeleteCommissionRecordButton({ id, action }: { id: string; action: (formData: FormData) => Promise<void> }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Tem certeza que deseja remover este registro de comissão?')) event.preventDefault();
  }

  return <form action={action} onSubmit={confirmDelete}>
    <input type="hidden" name="id" value={id}/>
    <DeleteButton/>
  </form>;
}
