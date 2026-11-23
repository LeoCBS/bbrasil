'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { deleteReceivableAction } from '@/lib/actions';

export function DeleteReceivableButton({ receivableId }: { receivableId: number }) {
  const { pending } = useFormStatus();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm('Tem certeza que deseja excluir esta conta a receber?')) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteReceivableAction} onSubmit={handleSubmit} className="inline-block">
      <input type="hidden" name="id" value={receivableId.toString()} />
      <button
        type="submit"
        className="text-destructive"
        disabled={pending}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : '🗑️'}
      </button>
    </form>
  );
}
