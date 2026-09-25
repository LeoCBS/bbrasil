'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quotation } from '@/lib/quotations';
import { exportQuotationToPDF } from '@/lib/pdf-export';

interface ExportQuotationButtonProps {
  quotation: Quotation;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportQuotationButton({ quotation, size = 'default' }: ExportQuotationButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportQuotationToPDF(quotation);
    } catch (error) {
      console.error('Erro ao exportar orçamento:', error);
      alert('Erro ao exportar orçamento. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      size={size}
      variant="outline"
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exportando...' : 'Exportar PDF'}
    </Button>
  );
}