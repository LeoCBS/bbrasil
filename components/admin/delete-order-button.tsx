'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { deleteOrderAction } from '@/lib/actions';

export function DeleteOrderButton({ orderId }: { orderId: number }) {
  const { pending } = useFormStatus();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteOrderAction} onSubmit={handleSubmit} className="inline-block shrink-0">
      <input type="hidden" name="id" value={orderId.toString()} />
      <button
        type="submit"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-red-50"
        disabled={pending}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : '🗑️'}
      </button>
    </form>
  );
}
