import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/auth';
import { getRevenueEvolution } from '@/lib/dashboard';

export async function GET(request: NextRequest) {
  await requireAdminUser();
  
  const searchParams = request.nextUrl.searchParams;
  const unitIdParam = searchParams.get('unitId');
  const unitId = unitIdParam && unitIdParam !== '' ? unitIdParam : undefined;
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const aggregation = (searchParams.get('aggregation') as 'daily' | 'weekly') || 'daily';
  
  const data = await getRevenueEvolution(
    new Date(startDate),
    new Date(endDate),
    aggregation,
    unitId
  );
  
  return NextResponse.json(data);
}
