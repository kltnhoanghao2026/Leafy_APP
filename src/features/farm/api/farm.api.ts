import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";

import type { FarmPlotResponse, FarmZoneResponse } from "../types";

const unwrapApiData = <T>(payload: T | ApiResponse<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
};

export const farmApi = {
  async getPlotsByOwner(ownerProfileId: string): Promise<FarmPlotResponse[]> {
    const response = await apiClient.get<
      ApiResponse<FarmPlotResponse[]> | FarmPlotResponse[]
    >(API_ENDPOINTS.FARMS.PLOTS, { params: { ownerProfileId } });

    return unwrapApiData(response.data);
  },

  async getZonesByPlot(plotId: string): Promise<FarmZoneResponse[]> {
    const response = await apiClient.get<
      ApiResponse<FarmZoneResponse[]> | FarmZoneResponse[]
    >(API_ENDPOINTS.FARMS.PLOT_ZONES(plotId));

    return unwrapApiData(response.data);
  },
};
