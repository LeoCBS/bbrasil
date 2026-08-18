'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Client } from '@/lib/clients';
import { Product } from '@/lib/products';
import { Quotation } from '@/lib/quotations';
import { Profile } from '@/lib/users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCurrencyFromCents } from '@/lib/format';
import { onlyDigits } from '@/lib/text';
import { Search, Trash2, Edit2 } from 'lucide-react';

interface QuotationFormItem {
  id: number;
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function QuotationForm({
  quotation,
  action,
  clients,
  products,
  profiles,
  submitLabel,
  submitIcon,
  userUnitId,
  userUnitName,
  userId,
  userName,
  userEmail
}: {
  quotation?: Quotation;
  action: (formData: FormData) => Promise<void>;
  clients: Client[];
  products: Product[];
  profiles: Profile[];
  submitLabel: string;
  submitIcon: React.ReactNode;
  userUnitId?: string;
  userUnitName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Client search
  const [clientSearch, setClientSearch] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    quotation ? clients.find(c => c.id === quotation.client_id) || null : null
  );

  // Salesperson selection
  const [selectedSalesperson, setSelectedSalesperson] = useState<Profile | null>(
    quotation?.client_salesperson_id ? profiles.find(p => p.id === quotation.client_salesperson_id) || null : null
  );

  // Quotation items
  const [quotationItems, setQuotationItems] = useState<QuotationFormItem[]>(
    quotation?.items?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_code: item.product_code || undefined,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    })) || []
  );

  // Product search for adding items
  const [productSearch, setProductSearch] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);

  // Editing item
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Observation
  const [observation, setObservation] = useState<string>(quotation?.observation || '');

  // Valid until
  const [validUntil, setValidUntil] = useState<string>(
    quotation?.valid_until ? new Date(quotation.valid_until).toISOString().split('T')[0] : ''
  );

  // Order ID display (read-only)
  const orderId = quotation?.order_id;

  // Currency display states
  const [unitPriceDisplay, setUnitPriceDisplay] = useState<string>('');

  useEffect(() => {
    if (clientSearch) {
      const search = clientSearch.toLowerCase();
      setFilteredClients(clients.filter(c => 
        c.corporate_name.toLowerCase().includes(search) || 
        c.cnpj.includes(search)
      ));
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearch, clients]);

  useEffect(() => {
    if (productSearch) {
      const search = productSearch.toLowerCase();
      setFilteredProducts(products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        (p.code && p.code.toLowerCase().includes(search))
      ));
    } else {
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  function handleCurrencyInputChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const display = formatCurrencyFromCents(onlyDigits(e.target.value));
    setter(display);
    e.target.value = display;
  }

  function handleClientSelect(client: Client) {
    setSelectedClient(client);
    setClientSearch(client.corporate_name);
    
    // Sugerir o vendedor associado ao cliente
    if (client.profile_id) {
      const suggestedSalesperson = profiles.find(p => p.id === client.profile_id);
      if (suggestedSalesperson) {
        setSelectedSalesperson(suggestedSalesperson);
      }
    }
  }

  function handleAddProduct(product: Product) {
    const newItem: QuotationFormItem = {
      id: Date.now(), // ID temporário para o frontend
      product_id: product.id,
      product_name: product.name,
      product_code: product.code || undefined,
      quantity: newItemQuantity,
      unit_price: product.price || 0,
      total_price: (product.price || 0) * newItemQuantity
    };
    setQuotationItems([...quotationItems, newItem]);
    setProductSearch('');
    setSelectedProduct(null);
    setNewItemQuantity(1);
    setShowProductDropdown(false);
  }

  function handleRemoveItem(index: number) {
    setQuotationItems(quotationItems.filter((_, i) => i !== index));
  }

  function handleEditItem(index: number) {
    setEditingItemIndex(index);
    const item = quotationItems[index];
    setUnitPriceDisplay(formatCurrency(item.unit_price));
  }

  function handleSaveItem(index: number) {
    const item = quotationItems[index];
    const updatedItems = [...quotationItems];
    updatedItems[index] = {
      ...item,
      total_price: item.quantity * item.unit_price
    };
    setQuotationItems(updatedItems);
    setEditingItemIndex(null);
  }

  function handleCancelEdit() {
    setEditingItemIndex(null);
    setUnitPriceDisplay('');
  }

  function handleQuantityChange(index: number, quantity: number) {
    const item = quotationItems[index];
    const updatedItems = [...quotationItems];
    updatedItems[index] = {
      ...item,
      quantity,
      total_price: quantity * item.unit_price
    };
    setQuotationItems(updatedItems);
  }

  function handleUnitPriceChange(index: number, price: number) {
    const item = quotationItems[index];
    const updatedItems = [...quotationItems];
    updatedItems[index] = {
      ...item,
      unit_price: price,
      total_price: item.quantity * price
    };
    setQuotationItems(updatedItems);
  }

  const totalAmount = quotationItems.reduce((sum, item) => sum + item.total_price, 0);

  async function handleSubmitForm(formData: FormData) {
    if (!selectedClient) {
      setSubmitError('Selecione um cliente para o orçamento.');
      return;
    }

    if (quotationItems.length === 0) {
      setSubmitError('Adicione pelo menos um produto ao orçamento.');
      return;
    }

    setSubmitError('');
    setSuccessMessage('');

    startTransition(async () => {
      try {
        formData.append('client_id', selectedClient.id);
        formData.append('client_name', selectedClient.corporate_name);
        formData.append('client_cnpj', selectedClient.cnpj);
        formData.append('client_salesperson_id', selectedSalesperson?.id || '');
        formData.append('client_salesperson_name', selectedSalesperson?.name || selectedSalesperson?.email || '');
        formData.append('items', JSON.stringify(quotationItems));
        formData.append('total_amount', totalAmount.toString());
        formData.append('observation', observation);
        formData.append('valid_until', validUntil);

        await action(formData);
        setSuccessMessage(quotation ? 'Orçamento atualizado com sucesso.' : 'Orçamento criado com sucesso.');

        if (!quotation) {
          formRef.current?.reset();
          setQuotationItems([]);
          setSelectedClient(null);
          setClientSearch('');
          setObservation('');
          setValidUntil('');
        }

        router.refresh();
        
        // Redirecionar após sucesso
        setTimeout(() => {
          router.push('/admin/orcamentos');
        }, 1500);
      } catch (reason) {
        console.error('Falha ao salvar o orçamento:', reason);
        setSubmitError(reason instanceof Error ? reason.message : 'Não foi possível salvar o orçamento.');
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

      {quotation ? <input type="hidden" name="id" value={quotation.id.toString()} /> : null}
      {(userId || quotation?.user_id) && <input type="hidden" name="user_id" value={userId || quotation?.user_id || ''} />}
      {(userName || quotation?.user_name) && <input type="hidden" name="user_name" value={userName || quotation?.user_name || ''} />}
      {(userEmail || quotation?.user_email) && <input type="hidden" name="user_email" value={userEmail || quotation?.user_email || ''} />}
      {userUnitId && <input type="hidden" name="unit_id" value={userUnitId} />}
      {userUnitName && <input type="hidden" name="unit_name" value={userUnitName} />}

      {/* Client Selection */}
      <div className="grid gap-2">
        <Label htmlFor="client">Cliente</Label>
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="client"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar cliente por nome ou CNPJ..."
              className="pl-10"
            />
          </div>
          {clientSearch && filteredClients.length > 0 && !selectedClient && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="font-medium">{client.corporate_name}</div>
                  <div className="text-sm text-slate-600">{client.cnpj}</div>
                </div>
              ))}
            </div>
          )}
          {selectedClient && (
            <div className="mt-2 p-3 bg-slate-50 rounded-md border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{selectedClient.corporate_name}</div>
                  <div className="text-sm text-slate-600">{selectedClient.cnpj}</div>
                  <div className="text-sm text-slate-600">{selectedClient.city} - {selectedClient.state}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch('');
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salesperson Selection */}
      <div className="grid gap-2">
        <Label htmlFor="salesperson">Vendedor</Label>
        <select
          id="salesperson"
          name="salesperson_id"
          value={selectedSalesperson?.id || ''}
          onChange={(e) => {
            const selected = profiles.find(p => p.id === e.target.value);
            setSelectedSalesperson(selected || null);
          }}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Selecione um vendedor</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name || profile.email}
            </option>
          ))}
        </select>
      </div>

      {/* Quotation Items */}
      <div className="grid gap-2">
        <Label>Produtos do Orçamento</Label>
        
        {/* Add Product */}
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              placeholder="Adicionar produto..."
              className="pl-10"
              onFocus={() => setShowProductDropdown(true)}
            />
          </div>
          {showProductDropdown && filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setProductSearch(product.name);
                    setShowProductDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-slate-600">{product.code || 'Sem código'}</div>
                    </div>
                    <div className="text-sm font-medium">
                      {product.price ? formatCurrency(product.price) : 'Preço não definido'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Quantity input when product is selected */}
          {selectedProduct && (
            <div className="mt-2 flex gap-2 items-center">
              <div className="flex-1">
                <Label htmlFor="quantity" className="text-sm">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                onClick={() => selectedProduct && handleAddProduct(selectedProduct)}
                className="mt-5"
              >
                Adicionar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductSearch('');
                  setNewItemQuantity(1);
                }}
                className="mt-5"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Items List */}
        {quotationItems.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Produto</th>
                  <th className="text-right p-3 text-sm font-medium w-24">Qtd</th>
                  <th className="text-right p-3 text-sm font-medium w-32">VL. Unit</th>
                  <th className="text-right p-3 text-sm font-medium w-32">Total</th>
                  <th className="text-right p-3 text-sm font-medium w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quotationItems.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-slate-600">{item.product_code || ''}</div>
                    </td>
                    <td className="p-3 text-right">
                      {editingItemIndex === index ? (
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          className="w-20 text-right"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingItemIndex === index ? (
                        <Input
                          type="text"
                          value={unitPriceDisplay}
                          onChange={(e) => {
                            handleCurrencyInputChange(e, setUnitPriceDisplay);
                            handleUnitPriceChange(index, parseFloat(unitPriceDisplay.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
                          }}
                          className="w-28 text-right"
                        />
                      ) : (
                        formatCurrency(item.unit_price)
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(item.total_price)}
                    </td>
                    <td className="p-3 text-right">
                      {editingItemIndex === index ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveItem(index)}
                          >
                            ✓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(index)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total */}
        {quotationItems.length > 0 && (
          <div className="flex justify-end p-4 bg-slate-50 rounded-md border">
            <div className="text-lg font-bold">
              Total: {formatCurrency(totalAmount)}
            </div>
          </div>
        )}
      </div>

      {/* Valid Until */}
      <div className="grid gap-2">
        <Label htmlFor="valid_until">Válido até</Label>
        <Input
          id="valid_until"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={quotation?.status || 'pending'}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
          <option value="converted">Convertido</option>
        </select>
      </div>

      {/* Order ID (read-only, shown when converted) */}
      {orderId && (
        <div className="grid gap-2">
          <Label htmlFor="order_id">Pedido Associado</Label>
          <div className="flex items-center gap-2">
            <Input
              id="order_id"
              value={`#${orderId}`}
              readOnly
              className="bg-slate-50 text-slate-600"
            />
            <Link 
              href={`/admin/pedidos/${orderId}/edit`}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Ver pedido
            </Link>
          </div>
        </div>
      )}

      {/* Observation */}
      <div className="grid gap-2">
        <Label htmlFor="observation">Observação</Label>
        <Textarea
          id="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Observações sobre o orçamento..."
          rows={3}
        />
      </div>

      <SubmitButton className="w-full" pendingLabel={quotation ? 'Salvando...' : 'Criando...'} forcePending={isPending}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
