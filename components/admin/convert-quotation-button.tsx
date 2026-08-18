'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { convertQuotationToOrderAction } from '@/lib/actions';

interface ConvertQuotationButtonProps {
  quotationId: number;
  size?: 'icon' | 'default';
}

export function ConvertQuotationButton({ quotationId, size = 'icon' }: ConvertQuotationButtonProps) {
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setConverting(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('id', quotationId.toString());
      await convertQuotationToOrderAction(formData);
      setMessage({ type: 'success', text: 'Orçamento convertido em pedido com sucesso!' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao converter orçamento:', error);
      setMessage({ type: 'error', text: 'Erro ao converter orçamento.' });
    } finally {
      setConverting(false);
    }
  };

  if (size === 'default') {
    return (
      <div>
        {message && (
          <div className={`mb-3 p-2 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleConvert}>
          <button
            type="submit"
            disabled={converting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {converting ? 'Convertendo...' : 'Converter em Pedido'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {message && (
        <div className={`absolute right-0 bottom-full mb-2 p-2 rounded-md text-sm whitespace-nowrap z-10 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleConvert}>
        <button
          type="submit"
          disabled={converting}
          className="text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors p-1 rounded hover:bg-green-50"
          title="Converter em pedido"
        >
          {converting ? '...' : <ShoppingCart className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
