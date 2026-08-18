'use client';

import { useState } from 'react';
import { convertQuotationToOrderAction } from '@/lib/actions';
import { QuotationAutocomplete } from '@/components/quotation-autocomplete';

export function QuotationConverter() {
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConvert = async (quotationId: number) => {
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
      setMessage({ type: 'error', text: 'Erro ao converter orçamento. Tente novamente.' });
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
      <h3 className="font-semibold text-blue-900 mb-2">Converter Orçamento em Pedido</h3>
      
      {message && (
        <div className={`mb-3 p-2 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <QuotationAutocomplete onConvert={handleConvert} disabled={converting} />
    </div>
  );
}
