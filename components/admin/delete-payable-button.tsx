'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { deletePayableAction } from '@/lib/actions';

export function DeletePayableButton({ payableId }: { payableId: number }) {
  const { pending } = useFormStatus();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
      e.preventDefault();
    }
  };

  return (
    <form action={deletePayableAction} onSubmit={handleSubmit} className="inline-block">
      <input type="hidden" name="id" value={payableId.toString()} />
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
