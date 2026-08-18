'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface Quotation {
  id: number;
  client_name: string;
  client_cnpj: string;
  total_amount: number;
  status: string;
}

interface QuotationAutocompleteProps {
  onConvert: (quotationId: number) => void;
  disabled?: boolean;
}

export function QuotationAutocomplete({ onConvert, disabled = false }: QuotationAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Quotation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length >= 2) {
        setLoading(true);
        try {
          const response = await fetch(`/api/quotations/search?search=${encodeURIComponent(search)}&status=pending`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error('Erro ao buscar orçamentos:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setSearch(`#${quotation.id} - ${quotation.client_name}`);
    setShowSuggestions(false);
  };

  const handleConvert = () => {
    if (selectedQuotation) {
      onConvert(selectedQuotation.id);
    } else if (search) {
      // Tenta converter pelo ID se foi digitado diretamente
      const id = parseInt(search.replace('#', '').trim());
      if (!isNaN(id)) {
        onConvert(id);
      }
    }
  };

  const handleClear = () => {
    setSelectedQuotation(null);
    setSearch('');
    setSuggestions([]);
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    converted: 'Convertido'
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
              setSelectedQuotation(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar orçamento por cliente, CNPJ ou código..."
            className="pl-10"
            disabled={disabled}
          />
          
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              Buscando...
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((quotation) => (
                <div
                  key={quotation.id}
                  onClick={() => handleSelect(quotation)}
                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">#{quotation.id} - {quotation.client_name}</div>
                      <div className="text-sm text-slate-600">{quotation.client_cnpj}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">{formatCurrency(quotation.total_amount)}</div>
                      <div className="text-xs text-slate-600">
                        {statusLabels[quotation.status] || quotation.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showSuggestions && !loading && suggestions.length === 0 && search.length >= 2 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg p-4 text-center text-slate-600">
              Nenhum orçamento encontrado
            </div>
          )}
        </div>
        
        <Button 
          type="button" 
          onClick={handleConvert}
          disabled={disabled || (!selectedQuotation && !search)}
        >
          Converter
        </Button>
        
        {selectedQuotation && (
          <Button 
            type="button" 
            variant="ghost"
            onClick={handleClear}
            disabled={disabled}
          >
            Limpar
          </Button>
        )}
      </div>
      
      {selectedQuotation && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200 text-sm">
          <div className="font-medium">Orçamento selecionado: #{selectedQuotation.id}</div>
          <div className="text-slate-600">{selectedQuotation.client_name}</div>
          <div className="text-slate-600">{selectedQuotation.client_cnpj}</div>
          <div className="text-slate-600 font-medium">Total: {formatCurrency(selectedQuotation.total_amount)}</div>
        </div>
      )}
    </div>
  );
}
