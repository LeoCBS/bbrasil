import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/auth';
import { getRevenueByMonth } from '@/lib/dashboard';

export async function GET(request: NextRequest) {
  await requireAdminUser();
  
  const searchParams = request.nextUrl.searchParams;
  const unitIdParam = searchParams.get('unitId');
  const unitId = unitIdParam && unitIdParam !== '' ? unitIdParam : undefined;
  
  const data = await getRevenueByMonth(unitId);
  
  return NextResponse.json(data);
}
