import { unstable_noStore as noStore } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { getClients } from "@/lib/clients";

export type Visit = {
  id: string;
  client_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: "completed" | "pending" | "next";
  checkin_time?: string;
  notes?: string;
  created_at?: string;
};

export type Route = {
  id: string;
  seller_id: string;
  date: string;
  total_km: number;
  visits: Visit[];
  created_at?: string;
};

export type LogisticsMetrics = {
  total_visits: number;
  completed_visits: number;
  pending_visits: number;
  checkins: number;
  km_traveled: number;
};

const fallbackVisits: Visit[] = [
  {
    id: "visit-1",
    client_id: "demo-client-1",
    scheduled_date: "2025-05-12",
    scheduled_time: "08:30",
    status: "completed",
    checkin_time: "08:35"
  },
  {
    id: "visit-2",
    client_id: "demo-client-2",
    scheduled_date: "2025-05-12",
    scheduled_time: "09:30",
    status: "pending"
  }
];

const fallbackRoute: Route = {
  id: "route-1",
  seller_id: "demo-profile-1",
  date: "2025-05-12",
  total_km: 85,
  visits: fallbackVisits
};

export async function getTodayRoute(sellerId: string): Promise<Route | null> {
  noStore();
  const supabase = getSupabase();
  
  if (!supabase) {
    return fallbackRoute;
  }

  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("routes")
    .select(`
      *,
      visits (
        id,
        client_id,
        scheduled_date,
        scheduled_time,
        status,
        checkin_time,
        notes,
        created_at
      )
    `)
    .eq("seller_id", sellerId)
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error("Failed to load today's route:", error.message);
    return fallbackRoute;
  }

  return data as Route | null;
}

export async function getLogisticsMetrics(sellerId: string): Promise<LogisticsMetrics> {
  noStore();
  const route = await getTodayRoute(sellerId);
  
  if (!route) {
    return {
      total_visits: 0,
      completed_visits: 0,
      pending_visits: 0,
      checkins: 0,
      km_traveled: 0
    };
  }

  const completedVisits = route.visits.filter(v => v.status === "completed").length;
  const pendingVisits = route.visits.filter(v => v.status === "pending").length;
  const checkins = route.visits.filter(v => v.checkin_time).length;

  return {
    total_visits: route.visits.length,
    completed_visits: completedVisits,
    pending_visits: pendingVisits,
    checkins: checkins,
    km_traveled: route.total_km
  };
}

export async function getSellerClients(sellerId: string) {
  noStore();
  const clients = await getClients();
  return clients.filter(client => client.profile_id === sellerId);
}