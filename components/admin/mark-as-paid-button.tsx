'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { markAsPaidReceivableAction, markAsPaidPayableAction } from '@/lib/actions';

interface MarkAsPaidButtonProps {
  type: 'receivable' | 'payable';
  id: number;
}

export function MarkAsPaidButton({ type, id }: MarkAsPaidButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('id', id.toString());
      formData.append('payment_date', new Date().toISOString().split('T')[0]);
      
      if (type === 'receivable') {
        await markAsPaidReceivableAction(formData);
      } else {
        await markAsPaidPayableAction(formData);
      }
      
      setMessage({ type: 'success', text: 'Marcado como pago com sucesso!' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      setMessage({ type: 'error', text: 'Erro ao marcar como pago.' });
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {message && (
        <div className={`absolute right-0 bottom-full mb-2 p-2 rounded-md text-sm whitespace-nowrap z-10 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleMarkAsPaid}>
        <button
          type="submit"
          disabled={loading}
          className="text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors p-1 rounded hover:bg-green-50"
          title={loading ? 'Processando...' : 'Marcar como pago'}
        >
          {loading ? '...' : <CheckCircle className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
