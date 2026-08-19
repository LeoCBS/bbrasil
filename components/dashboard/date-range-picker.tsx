'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
}

export function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setTempStartDate(start);
    setTempEndDate(end);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50"
      >
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="text-slate-700">
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Seleção rápida</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickSelect(7)}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded"
              >
                7 dias
              </button>
              <button
                onClick={() => handleQuickSelect(30)}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded"
              >
                30 dias
              </button>
              <button
                onClick={() => handleQuickSelect(90)}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded"
              >
                90 dias
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data inicial</label>
            <input
              type="date"
              value={tempStartDate.toISOString().split('T')[0]}
              onChange={(e) => setTempStartDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data final</label>
            <input
              type="date"
              value={tempEndDate.toISOString().split('T')[0]}
              onChange={(e) => setTempEndDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
