import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type {
  PageParams,
  PageResponse,
  PlantEventCreateRequest,
  PlantEventResponse,
  PlantEventUpdateRequest,
} from "../components/plant-event.types";

export const plantEventApi = {
  getEventsByPlant: (plantId: string, params: PageParams) =>
    apiClient.get<ApiResponse<PageResponse<PlantEventResponse>>>(
      API_ENDPOINTS.PLANT_EVENTS.BY_PLANT(plantId),
      { params },
    ),

  getEventsByPlantAndType: (
    plantId: string,
    eventType: string,
    params: PageParams,
  ) =>
    apiClient.get<ApiResponse<PageResponse<PlantEventResponse>>>(
      API_ENDPOINTS.PLANT_EVENTS.BY_PLANT_TYPE(plantId, eventType),
      { params },
    ),

  getEventsByPlantAndPlanned: (
    plantId: string,
    isPlanned: boolean,
    params: PageParams,
  ) =>
    apiClient.get<ApiResponse<PageResponse<PlantEventResponse>>>(
      API_ENDPOINTS.PLANT_EVENTS.BY_PLANT_PLANNED(plantId),
      { params: { ...params, isPlanned } },
    ),

  getEventById: (eventId: string) =>
    apiClient.get<ApiResponse<PlantEventResponse>>(
      API_ENDPOINTS.PLANT_EVENTS.ITEM(eventId),
    ),

  createEvent: (body: PlantEventCreateRequest) =>
    apiClient.post<ApiResponse<PlantEventResponse>>(
      API_ENDPOINTS.PLANT_EVENTS.CREATE,
      body,
    ),

  updateEvent: (eventId: string, body: PlantEventUpdateRequest) =>
    apiClient.put<ApiResponse<PlantEventResponse>>(
      API_ENDPOINTS.PLANT_EVENTS.ITEM(eventId),
      body,
    ),

  getEventsByFarmPlot: (farmPlotId: string, params: PageParams) =>
    apiClient.get<ApiResponse<PageResponse<PlantEventResponse>>>(
      API_ENDPOINTS.PLANT_EVENTS.BY_FARM_PLOT(farmPlotId),
      { params },
    ),

  getEventsByFarmZone: (farmZoneId: string, params: PageParams) =>
    apiClient.get<ApiResponse<PageResponse<PlantEventResponse>>>(
      API_ENDPOINTS.PLANT_EVENTS.BY_FARM_ZONE(farmZoneId),
      { params },
    ),

  deleteEvent: (eventId: string) =>
    apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.PLANT_EVENTS.ITEM(eventId),
    ),
};
