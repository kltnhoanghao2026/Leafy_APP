import { apiClient } from "@/src/lib/axios";
import { type ApiResponse } from "@/src/shared/api";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type {
  FarmPlotResponse,
  FarmZoneResponse,
  CreateFarmPlotRequest,
  UpdateFarmPlotRequest,
  CreateFarmZoneRequest,
  UpdateFarmZoneRequest,
} from "../components/farm.types";

export const farmApi = {
  // ── Farm Plots ──────────────────────────────────────
  getPlotsByOwner: (ownerProfileId: string) =>
    apiClient.get<ApiResponse<FarmPlotResponse[]>>(API_ENDPOINTS.FARMS.PLOTS, {
      params: { ownerProfileId },
    }),

  getPlotById: (id: string) =>
    apiClient.get<ApiResponse<FarmPlotResponse>>(API_ENDPOINTS.FARMS.PLOT(id)),

  createPlot: (body: CreateFarmPlotRequest) =>
    apiClient.post<ApiResponse<FarmPlotResponse>>(
      API_ENDPOINTS.FARMS.PLOTS,
      body,
    ),

  updatePlot: (id: string, body: UpdateFarmPlotRequest) =>
    apiClient.put<ApiResponse<FarmPlotResponse>>(
      API_ENDPOINTS.FARMS.PLOT(id),
      body,
    ),

  deletePlot: (id: string) =>
    apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.FARMS.PLOT(id)),

  // ── Farm Zones ──────────────────────────────────────
  getZonesByPlot: (plotId: string) =>
    apiClient.get<ApiResponse<FarmZoneResponse[]>>(
      API_ENDPOINTS.FARMS.PLOT_ZONES(plotId),
    ),

  getZoneById: (id: string) =>
    apiClient.get<ApiResponse<FarmZoneResponse>>(API_ENDPOINTS.FARMS.ZONE(id)),

  createZone: (plotId: string, body: CreateFarmZoneRequest) =>
    apiClient.post<ApiResponse<FarmZoneResponse>>(
      API_ENDPOINTS.FARMS.PLOT_ZONES(plotId),
      body,
    ),

  updateZone: (id: string, body: UpdateFarmZoneRequest) =>
    apiClient.put<ApiResponse<FarmZoneResponse>>(
      API_ENDPOINTS.FARMS.ZONE(id),
      body,
    ),

  deleteZone: (id: string) =>
    apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.FARMS.ZONE(id)),
};
