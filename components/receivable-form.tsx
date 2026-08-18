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

interface ReceivableFormProps {
  receivable?: {
    id: number;
    order_id?: number;
    order_reference?: string;
    client_id?: string;
    client_name?: string;
    client_cnpj?: string;
    amount: number;
    due_date: string;
    payment_date?: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
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
}

export function ReceivableForm({
  receivable,
  action,
  submitLabel,
  submitIcon,
  userUnitId,
  userUnitName,
  userId,
  userName,
  userEmail
}: ReceivableFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Form state
  const [orderReference, setOrderReference] = useState(receivable?.order_reference || '');
  const [clientName, setClientName] = useState(receivable?.client_name || '');
  const [clientCnpj, setClientCnpj] = useState(receivable?.client_cnpj || '');
  const [amountDisplay, setAmountDisplay] = useState(receivable ? formatCurrency(receivable.amount) : '');
  const [dueDate, setDueDate] = useState(receivable?.due_date || '');
  const [paymentDate, setPaymentDate] = useState(receivable?.payment_date || '');
  const [status, setStatus] = useState(receivable?.status || 'pending');
  const [observation, setObservation] = useState(receivable?.observation || '');

  function handleCurrencyInputChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const display = formatCurrencyFromCents(onlyDigits(e.target.value));
    setter(display);
    e.target.value = display;
  }

  async function handleSubmitForm(formData: FormData) {
    if (!clientName) {
      setSubmitError('Informe o nome do cliente.');
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

    setSubmitError('');
    setSuccessMessage('');

    startTransition(async () => {
      try {
        formData.append('order_reference', orderReference);
        formData.append('client_name', clientName);
        formData.append('client_cnpj', clientCnpj);
        formData.append('amount', (parseFloat(amountDisplay.replace(/[^\d,]/g, '').replace(',', '.')) || 0).toString());
        formData.append('due_date', dueDate);
        formData.append('payment_date', paymentDate);
        formData.append('status', status);
        formData.append('observation', observation);

        await action(formData);
        setSuccessMessage(receivable ? 'Conta atualizada com sucesso.' : 'Conta criada com sucesso.');

        if (!receivable) {
          formRef.current?.reset();
          setOrderReference('');
          setClientName('');
          setClientCnpj('');
          setAmountDisplay('');
          setDueDate('');
          setPaymentDate('');
          setStatus('pending');
          setObservation('');
        }

        router.refresh();
        
        setTimeout(() => {
          router.push('/admin/contas-receber');
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

      {receivable ? <input type="hidden" name="id" value={receivable.id.toString()} /> : null}
      {(userId || receivable?.user_id) && <input type="hidden" name="user_id" value={userId || receivable?.user_id || ''} />}
      {(userName || receivable?.user_name) && <input type="hidden" name="user_name" value={userName || receivable?.user_name || ''} />}
      {(userEmail || receivable?.user_email) && <input type="hidden" name="user_email" value={userEmail || receivable?.user_email || ''} />}
      {userUnitId && <input type="hidden" name="unit_id" value={userUnitId} />}
      {userUnitName && <input type="hidden" name="unit_name" value={userUnitName} />}

      {/* Order Reference */}
      <div className="grid gap-2">
        <Label htmlFor="order_reference">Referência do Pedido</Label>
        <Input
          id="order_reference"
          value={orderReference}
          onChange={(e) => setOrderReference(e.target.value)}
          placeholder="#123"
        />
      </div>

      {/* Client Name */}
      <div className="grid gap-2">
        <Label htmlFor="client_name">Nome do Cliente</Label>
        <Input
          id="client_name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Nome do cliente..."
        />
      </div>

      {/* Client CNPJ */}
      <div className="grid gap-2">
        <Label htmlFor="client_cnpj">CNPJ do Cliente</Label>
        <Input
          id="client_cnpj"
          value={clientCnpj}
          onChange={(e) => setClientCnpj(e.target.value)}
          placeholder="00.000.000/0000-00"
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

      <SubmitButton className="w-full" pendingLabel={receivable ? 'Salvando...' : 'Criando...'} forcePending={isPending}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
