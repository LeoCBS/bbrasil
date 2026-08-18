'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatCurrencyFromCents } from '@/lib/format';
import { onlyDigits } from '@/lib/text';

interface PayableFormProps {
  payable?: {
    id: number;
    supplier_name: string;
    supplier_cnpj?: string;
    supplier_address?: string;
    description: string;
    amount: number;
    due_date: string;
    payment_date?: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    category?: string;
    payment_method?: string;
    unit_id: string;
    unit_name: string;
    observation?: string;
    user_id?: string;
    user_name?: string;
    user_email?: string;
  };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  submitIcon: React.ReactNode;
  userUnitId?: string;
  userUnitName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  units?: { id: string; name: string }[];
}

export function PayableForm({
  payable,
  action,
  submitLabel,
  submitIcon,
  userUnitId,
  userUnitName,
  userId,
  userName,
  userEmail,
  units = []
}: PayableFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Form state
  const [supplierName, setSupplierName] = useState(payable?.supplier_name || '');
  const [supplierCnpj, setSupplierCnpj] = useState(payable?.supplier_cnpj || '');
  const [supplierAddress, setSupplierAddress] = useState(payable?.supplier_address || '');
  const [description, setDescription] = useState(payable?.description || '');
  const [amountDisplay, setAmountDisplay] = useState(payable ? formatCurrency(payable.amount) : '');
  const [dueDate, setDueDate] = useState(payable?.due_date || '');
  const [paymentDate, setPaymentDate] = useState(payable?.payment_date || '');
  const [status, setStatus] = useState(payable?.status || 'pending');
  const [category, setCategory] = useState(payable?.category || '');
  const [paymentMethod, setPaymentMethod] = useState(payable?.payment_method || '');
  const [selectedUnitId, setSelectedUnitId] = useState(payable?.unit_id || userUnitId || '');
  const [selectedUnitName, setSelectedUnitName] = useState(payable?.unit_name || userUnitName || '');
  const [observation, setObservation] = useState(payable?.observation || '');

  function handleCurrencyInputChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const display = formatCurrencyFromCents(onlyDigits(e.target.value));
    setter(display);
    e.target.value = display;
  }

  function handleUnitChange(unitId: string) {
    setSelectedUnitId(unitId);
    const unit = units.find(u => u.id === unitId);
    setSelectedUnitName(unit?.name || '');
  }

  async function handleSubmitForm(formData: FormData) {
    if (!supplierName) {
      setSubmitError('Informe o nome do fornecedor.');
      return;
    }

    if (!description) {
      setSubmitError('Informe a descrição da conta.');
      return;
    }

    if (!amountDisplay) {
      setSubmitError('Informe o valor da conta.');
      return;
    }

    if (!dueDate) {
      setSubmitError('Informe a data de vencimento.');
      return;
    }

    if (!selectedUnitId) {
      setSubmitError('Informe a unidade.');
      return;
    }

    setSubmitError('');
    setSuccessMessage('');

    startTransition(async () => {
      try {
        formData.append('supplier_name', supplierName);
        formData.append('supplier_cnpj', supplierCnpj);
        formData.append('supplier_address', supplierAddress);
        formData.append('description', description);
        formData.append('amount', (parseFloat(amountDisplay.replace(/[^\d,]/g, '').replace(',', '.')) || 0).toString());
        formData.append('due_date', dueDate);
        formData.append('payment_date', paymentDate);
        formData.append('status', status);
        formData.append('category', category);
        formData.append('payment_method', paymentMethod);
        formData.append('unit_id', selectedUnitId);
        formData.append('unit_name', selectedUnitName);
        formData.append('observation', observation);

        await action(formData);
        setSuccessMessage(payable ? 'Conta atualizada com sucesso.' : 'Conta criada com sucesso.');

        if (!payable) {
          formRef.current?.reset();
          setSupplierName('');
          setSupplierCnpj('');
          setSupplierAddress('');
          setDescription('');
          setAmountDisplay('');
          setDueDate('');
          setPaymentDate('');
          setStatus('pending');
          setCategory('');
          setPaymentMethod('');
          setSelectedUnitId(userUnitId || '');
          setSelectedUnitName(userUnitName || '');
          setObservation('');
        }

        router.refresh();
        
        setTimeout(() => {
          router.push('/admin/contas-pagar');
        }, 1500);
      } catch (reason) {
        console.error('Falha ao salvar a conta:', reason);
        setSubmitError(reason instanceof Error ? reason.message : 'Não foi possível salvar a conta.');
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');
    const fd = new FormData(formRef.current as HTMLFormElement);
    void handleSubmitForm(fd);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
      {successMessage && (
        <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {submitError && (
        <Alert variant="error" message={submitError} onClose={() => setSubmitError('')} />
      )}

      {payable ? <input type="hidden" name="id" value={payable.id.toString()} /> : null}
      {(userId || payable?.user_id) && <input type="hidden" name="user_id" value={userId || payable?.user_id || ''} />}
      {(userName || payable?.user_name) && <input type="hidden" name="user_name" value={userName || payable?.user_name || ''} />}
      {(userEmail || payable?.user_email) && <input type="hidden" name="user_email" value={userEmail || payable?.user_email || ''} />}

      {/* Supplier Name */}
      <div className="grid gap-2">
        <Label htmlFor="supplier_name">Nome do Fornecedor</Label>
        <Input
          id="supplier_name"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          placeholder="Nome do fornecedor..."
        />
      </div>

      {/* Supplier CNPJ */}
      <div className="grid gap-2">
        <Label htmlFor="supplier_cnpj">CNPJ do Fornecedor</Label>
        <Input
          id="supplier_cnpj"
          value={supplierCnpj}
          onChange={(e) => setSupplierCnpj(e.target.value)}
          placeholder="00.000.000/0000-00"
        />
      </div>

      {/* Supplier Address */}
      <div className="grid gap-2">
        <Label htmlFor="supplier_address">Endereço do Fornecedor</Label>
        <Input
          id="supplier_address"
          value={supplierAddress}
          onChange={(e) => setSupplierAddress(e.target.value)}
          placeholder="Endereço..."
        />
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da conta..."
          rows={2}
        />
      </div>

      {/* Amount */}
      <div className="grid gap-2">
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          value={amountDisplay}
          onChange={(e) => handleCurrencyInputChange(e, setAmountDisplay)}
          placeholder="R$ 0,00"
        />
      </div>

      {/* Due Date */}
      <div className="grid gap-2">
        <Label htmlFor="due_date">Data de Vencimento</Label>
        <Input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* Payment Date */}
      <div className="grid gap-2">
        <Label htmlFor="payment_date">Data de Pagamento</Label>
        <Input
          id="payment_date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'pending' | 'paid' | 'overdue' | 'cancelled')}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Category */}
      <div className="grid gap-2">
        <Label htmlFor="category">Categoria</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Aluguel, Fornecedor, Serviços..."
        />
      </div>

      {/* Payment Method */}
      <div className="grid gap-2">
        <Label htmlFor="payment_method">Método de Pagamento</Label>
        <select
          id="payment_method"
          name="payment_method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Selecione...</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="boleto">Boleto</option>
          <option value="cartao_credito">Cartão de Crédito</option>
          <option value="cartao_debito">Cartão de Débito</option>
          <option value="transferencia">Transferência</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      {/* Unit */}
      <div className="grid gap-2">
        <Label htmlFor="unit_id">Unidade</Label>
        <select
          id="unit_id"
          name="unit_id"
          value={selectedUnitId}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Selecione uma unidade</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      {/* Observation */}
      <div className="grid gap-2">
        <Label htmlFor="observation">Observação</Label>
        <Textarea
          id="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Observações sobre a conta..."
          rows={3}
        />
      </div>

      <SubmitButton className="w-full" pendingLabel={payable ? 'Salvando...' : 'Criando...'} forcePending={isPending}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
