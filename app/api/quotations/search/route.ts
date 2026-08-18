import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/auth';
import { getPaginatedQuotations } from '@/lib/quotations';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    // Buscar orçamentos com filtro
    const { quotations } = await getPaginatedQuotations({
      search,
      status: status as 'pending' | 'approved' | 'rejected' | 'converted' | undefined,
      page: 1,
      pageSize: 10
    });
    
    // Retornar apenas os dados necessários para o autocomplete
    const results = quotations.map(q => ({
      id: q.id,
      client_name: q.client_name,
      client_cnpj: q.client_cnpj,
      total_amount: q.total_amount,
      status: q.status
    }));
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}
