import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type {
  PageParams,
  PageResponse,
  PlantCreateRequest,
  PlantFilterParams,
  PlantResponse,
  PlantUpdateRequest,
  SpeciesResponse,
} from "../components/plant.types";

export const plantApi = {
  getPlants: (params: PageParams & PlantFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<PlantResponse>>>(
      API_ENDPOINTS.PLANTS.ME,
      { params },
    ),

  getPlantsByFarmPlot: (farmPlotId: string, params: PageParams & PlantFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<PlantResponse>>>(
      API_ENDPOINTS.PLANTS.BY_FARM_PLOT(farmPlotId),
      { params },
    ),

  getPlantById: (id: string) =>
    apiClient.get<ApiResponse<PlantResponse>>(API_ENDPOINTS.PLANTS.ITEM(id)),

  createPlant: (body: PlantCreateRequest) =>
    apiClient.post<ApiResponse<PlantResponse>>(API_ENDPOINTS.PLANTS.LIST, body),

  updatePlant: (id: string, body: PlantUpdateRequest) =>
    apiClient.put<ApiResponse<PlantResponse>>(
      API_ENDPOINTS.PLANTS.ITEM(id),
      body,
    ),

  deletePlant: (id: string) =>
    apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.PLANTS.ITEM(id)),

  getSpecies: (params: PageParams) =>
    apiClient.get<ApiResponse<PageResponse<SpeciesResponse>>>(
      API_ENDPOINTS.SPECIES.LIST,
      { params },
    ),

  bulkUpdateStatus: (payload: { plantIds: string[]; newStatus: string }) =>
    apiClient.patch<ApiResponse<{ count: number }>>(
      API_ENDPOINTS.PLANTS.BULK_STATUS,
      payload,
    ),

  bulkDeletePlants: (payload: { plantIds: string[] }) =>
    apiClient.delete<ApiResponse<{ count: number }>>(
      API_ENDPOINTS.PLANTS.BULK_DELETE,
      { data: payload },
    ),
};
