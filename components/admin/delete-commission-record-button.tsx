'use client';

import { FormEvent } from 'react';
import { Trash2 } from 'lucide-react';

export function DeleteCommissionRecordButton({ id, action }: { id: string; action: (formData: FormData) => Promise<void> }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Tem certeza que deseja remover este registro de comissão?')) event.preventDefault();
  }

  return <form action={action} onSubmit={confirmDelete}>
    <input type="hidden" name="id" value={id}/>
    <button type="submit" aria-label="Remover comissão" title="Remover comissão" className="rounded p-1 text-red-700 hover:bg-red-50">
      <Trash2 size={18}/>
    </button>
  </form>;
}
