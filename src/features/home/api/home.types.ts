import type { EventType } from "../../plant-event/components/plant-event.types";

export interface RecentEventSummary {
  id: string;
  eventType: EventType;
  note: string | null;
  targetType: "FARM" | "FARM_ZONE" | "PLANT" | null;
  completed: boolean;
  calculatedStartDate: string | null;
  createdAt: string | null;
}

export interface AgricultureStatsResponse {
  totalFarmPlots: number;
  totalFarmZones: number;
  totalAreaM2: number;
  totalPlants: number;
  activePlants: number;
  inactivePlants: number;
  archivedPlants: number;
  todayEvents: number;
  todayCompletedEvents: number;
  upcomingEvents7d: number;
  overdueEvents: number;
  totalCompletedEvents: number;
  totalPendingEvents: number;
  eventsByType: Record<string, number>;
  totalPlans: number;
  activePlanApplies: number;
  completedPlanApplies: number;
  recentEvents: RecentEventSummary[];
}
