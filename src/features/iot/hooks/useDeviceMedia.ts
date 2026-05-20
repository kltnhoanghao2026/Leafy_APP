import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type {
  CameraCaptureRequest,
  DeviceCameraSchedule,
  DeviceCameraScheduleRequest,
  DiseaseDetectRequest,
} from "../types";
import { iotKeys } from "./useDevices";

type DeviceCaptureScheduleRequest = Omit<
  DeviceCameraScheduleRequest,
  "deviceUid" | "triggerType"
> & {
  deviceUid?: string;
  triggerType?: DeviceCameraScheduleRequest["triggerType"];
};

const invalidateScheduleSideEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  deviceUid?: string,
  schedule?: DeviceCameraSchedule,
) => {
  const scheduleId = schedule?.scheduleId ?? schedule?.id;
  queryClient.invalidateQueries({
    queryKey: iotKeys.deviceCameraSchedules(deviceUid),
  });
  if (deviceUid) {
    queryClient.invalidateQueries({
      queryKey: iotKeys.deviceCameraSchedules(),
    });
  }
  queryClient.invalidateQueries({
    queryKey: iotKeys.deviceCameraSchedule(scheduleId),
  });

  if (schedule?.deviceId) {
    queryClient.invalidateQueries({
      queryKey: iotKeys.deviceDetail(schedule.deviceId),
    });
    queryClient.invalidateQueries({
      queryKey: iotKeys.deviceMedia(schedule.deviceId),
    });
  }
};

/**
 * Media/camera endpoint map:
 * - GET /iot/devices/{deviceId}/media -> useDeviceMedia
 * - POST /iot/devices/{deviceId}/camera/capture -> useCaptureDeviceImageMutation
 * - POST /iot/devices/{deviceUid}/camera/detect?force=true -> useDetectCameraDiseaseMutation
 * - GET /iot/devices/{deviceUid}/camera/schedules -> useDeviceSchedules
 * - POST /iot/devices/{deviceUid}/camera/schedules -> useCreateDeviceScheduleMutation
 * - PUT/DELETE /iot/devices/{deviceUid}/camera/schedules/{scheduleId}
 * - POST /iot/devices/{deviceUid}/camera/run-scheduled/{scheduleId}
 * - GET /iot/camera-schedules -> useAllDeviceCameraSchedules
 * - POST /admin/camera/run-scheduled/{deviceUid}
 *
 * Example:
 * const mediaQuery = useDeviceMedia(deviceId);
 * const captureMutation = useCaptureDeviceImageMutation(deviceId);
 * await captureMutation.mutateAsync({ quality: "MEDIUM", resolution: "VGA" });
 *
 * const schedulesQuery = useDeviceCameraSchedules(deviceUid);
 * const createSchedule = useCreateDeviceCameraScheduleMutation(deviceUid);
 */

export const deviceMediaQueryOptions = (deviceId?: string) =>
  queryOptions({
    queryKey: iotKeys.deviceMedia(deviceId),
    queryFn: () => collectorApi.getDeviceMedia(deviceId as string),
    enabled: Boolean(deviceId),
    staleTime: 15_000,
  });

export const deviceCameraSchedulesQueryOptions = (deviceUid?: string) =>
  queryOptions({
    queryKey: iotKeys.deviceCameraSchedules(deviceUid),
    queryFn: () => collectorApi.getDeviceCameraSchedules(deviceUid),
    enabled: Boolean(deviceUid),
    retry: 2,
    staleTime: 30_000,
  });

export const allDeviceCameraSchedulesQueryOptions = () =>
  queryOptions({
    queryKey: iotKeys.deviceCameraSchedules(),
    queryFn: () => collectorApi.getDeviceCameraSchedules(),
    retry: 2,
    staleTime: 30_000,
  });

export const useDeviceMedia = (deviceId?: string) => {
  return useQuery(deviceMediaQueryOptions(deviceId));
};

export const useDeviceCameraSchedules = (deviceUid?: string) => {
  return useQuery(deviceCameraSchedulesQueryOptions(deviceUid));
};

export const useDeviceSchedules = useDeviceCameraSchedules;

export const useAllDeviceCameraSchedules = () => {
  return useQuery(allDeviceCameraSchedulesQueryOptions());
};

export const useCaptureDeviceImageMutation = (deviceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request?: CameraCaptureRequest) =>
      collectorApi.captureDeviceImage(deviceId as string, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceMedia(deviceId) });
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceDetail(deviceId) });
    },
  });
};

export const useDetectCameraDiseaseMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request?: DiseaseDetectRequest) =>
      collectorApi.detectCameraDisease(deviceUid as string, {
        force: true,
        ...request,
      }),
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({
        queryKey: iotKeys.deviceCameraSchedules(deviceUid),
      });
      if (analysis.mediaEventId) {
        queryClient.invalidateQueries({ queryKey: iotKeys.all });
      }
    },
  });
};

export const useCreateDeviceCameraScheduleMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedule: DeviceCaptureScheduleRequest) => {
      const targetDeviceUid = schedule.deviceUid ?? deviceUid;
      const { deviceUid: _deviceUid, ...payload } = schedule;
      return collectorApi.createDeviceCaptureSchedule(targetDeviceUid as string, payload);
    },
    onMutate: async (schedule) => {
      const targetDeviceUid = schedule.deviceUid ?? deviceUid;
      if (!targetDeviceUid) return undefined;
      await queryClient.cancelQueries({
        queryKey: iotKeys.deviceCameraSchedules(targetDeviceUid),
      });
      const previous = queryClient.getQueryData<DeviceCameraSchedule[]>(
        iotKeys.deviceCameraSchedules(targetDeviceUid),
      );
      queryClient.setQueryData<DeviceCameraSchedule[]>(
        iotKeys.deviceCameraSchedules(targetDeviceUid),
        [
          {
            scheduleId: `optimistic-${Date.now()}`,
            deviceUid: targetDeviceUid,
            enabled: schedule.enabled ?? true,
            triggerType: schedule.triggerType ?? "SCHEDULED",
            timeOfDay: schedule.timeOfDay,
            recurrence: schedule.recurrence,
            resolution: schedule.resolution,
            quality: schedule.quality,
            uploadEndpoint: schedule.uploadEndpoint,
          },
          ...(previous ?? []),
        ],
      );
      return { previous };
    },
    onError: (_error, _schedule, context) => {
      const targetDeviceUid = _schedule.deviceUid ?? deviceUid;
      if (targetDeviceUid && context?.previous) {
        queryClient.setQueryData(
          iotKeys.deviceCameraSchedules(targetDeviceUid),
          context.previous,
        );
      }
    },
    onSuccess: (schedule) => {
      invalidateScheduleSideEffects(queryClient, schedule.deviceUid ?? deviceUid, schedule);
    },
  });
};

export const useCreateDeviceScheduleMutation =
  useCreateDeviceCameraScheduleMutation;

export const useUpdateDeviceCameraScheduleMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      updates,
    }: {
      scheduleId: string;
      updates: Partial<DeviceCameraScheduleRequest>;
    }) =>
      collectorApi.updateDeviceCameraSchedule(scheduleId, {
        ...updates,
        deviceUid,
      }),
    onMutate: async ({ scheduleId, updates }) => {
      if (!deviceUid) return undefined;
      await queryClient.cancelQueries({
        queryKey: iotKeys.deviceCameraSchedules(deviceUid),
      });
      const previous = queryClient.getQueryData<DeviceCameraSchedule[]>(
        iotKeys.deviceCameraSchedules(deviceUid),
      );
      queryClient.setQueryData<DeviceCameraSchedule[]>(
        iotKeys.deviceCameraSchedules(deviceUid),
        (current = []) =>
          current.map((schedule) =>
            (schedule.scheduleId ?? schedule.id) === scheduleId
              ? { ...schedule, ...updates }
              : schedule,
          ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (deviceUid && context?.previous) {
        queryClient.setQueryData(
          iotKeys.deviceCameraSchedules(deviceUid),
          context.previous,
        );
      }
    },
    onSuccess: (schedule) => {
      invalidateScheduleSideEffects(queryClient, deviceUid, schedule);
    },
  });
};

export const useUpdateDeviceScheduleMutation =
  useUpdateDeviceCameraScheduleMutation;

export const useDeleteDeviceCameraScheduleMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) =>
      collectorApi.deleteDeviceCameraSchedule(scheduleId, deviceUid),
    onMutate: async (scheduleId) => {
      if (!deviceUid) return undefined;
      await queryClient.cancelQueries({
        queryKey: iotKeys.deviceCameraSchedules(deviceUid),
      });
      const previous = queryClient.getQueryData<DeviceCameraSchedule[]>(
        iotKeys.deviceCameraSchedules(deviceUid),
      );
      queryClient.setQueryData<DeviceCameraSchedule[]>(
        iotKeys.deviceCameraSchedules(deviceUid),
        (current = []) =>
          current.filter((schedule) => (schedule.scheduleId ?? schedule.id) !== scheduleId),
      );
      return { previous };
    },
    onError: (_error, _scheduleId, context) => {
      if (deviceUid && context?.previous) {
        queryClient.setQueryData(
          iotKeys.deviceCameraSchedules(deviceUid),
          context.previous,
        );
      }
    },
    onSuccess: (_result, scheduleId) => {
      queryClient.invalidateQueries({
        queryKey: iotKeys.deviceCameraSchedules(deviceUid),
      });
      if (deviceUid) {
        queryClient.invalidateQueries({
          queryKey: iotKeys.deviceCameraSchedules(),
        });
      }
      queryClient.invalidateQueries({
        queryKey: iotKeys.deviceCameraSchedule(scheduleId),
      });
    },
  });
};

export const useDeleteDeviceScheduleMutation =
  useDeleteDeviceCameraScheduleMutation;

export const useRunCameraScheduleNowMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: string | { scheduleId: string; deviceUid?: string },
    ) => {
      const scheduleId = typeof input === "string" ? input : input.scheduleId;
      const nextDeviceUid = typeof input === "string" ? deviceUid : input.deviceUid ?? deviceUid;
      return collectorApi.runCameraScheduleNow(scheduleId, nextDeviceUid);
    },
    onSuccess: (schedule, input) => {
      const nextDeviceUid =
        typeof input === "string" ? deviceUid : input.deviceUid ?? deviceUid;
      invalidateScheduleSideEffects(queryClient, nextDeviceUid, schedule);
    },
    retry: 1,
  });
};

export const useRunScheduledCameraMutation = useRunCameraScheduleNowMutation;

export const useRunScheduledCameraForDeviceMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextDeviceUid?: string) =>
      collectorApi.runScheduledCameraForDevice(nextDeviceUid ?? (deviceUid as string)),
    onSuccess: (schedule, nextDeviceUid) => {
      invalidateScheduleSideEffects(
        queryClient,
        schedule.deviceUid ?? nextDeviceUid ?? deviceUid,
        schedule,
      );
    },
  });
};
