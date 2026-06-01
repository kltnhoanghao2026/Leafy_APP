import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type {
  CameraCaptureRequest,
  DeviceCameraSchedule,
  DeviceCameraScheduleRequest,
  DiseaseDetectRequest,
  DisplayCameraSchedule,
  DisplayDeviceMediaEvent,
} from "../types";
import { withMediaDisplay, withScheduleDisplay } from "../utils/iotDisplay";
import { iotKeys } from "./useDevices";

type DeviceCaptureScheduleRequest = Omit<
  DeviceCameraScheduleRequest,
  "deviceUid" | "triggerType"
> & {
  deviceUid?: string;
  triggerType?: DeviceCameraScheduleRequest["triggerType"];
};

const getScheduleId = (schedule: DeviceCameraSchedule) =>
  schedule.scheduleId ?? schedule.id;

const updateScheduleCache = (
  current: unknown,
  updater: (schedules: DeviceCameraSchedule[]) => DeviceCameraSchedule[],
) => {
  if (Array.isArray(current)) {
    return updater(current);
  }

  if (current && typeof current === "object" && "data" in current) {
    const response = current as { data?: unknown };
    if (Array.isArray(response.data)) {
      return { ...response, data: updater(response.data) };
    }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      const envelope = response.data as { data?: unknown };
      if (Array.isArray(envelope.data)) {
        return { ...response, data: { ...envelope, data: updater(envelope.data) } };
      }
    }
  }

  return current;
};

const mapScheduleForCache = (schedule: DeviceCameraSchedule): DisplayCameraSchedule =>
  withScheduleDisplay(schedule);

const upsertScheduleCache = (
  current: unknown,
  incoming: DeviceCameraSchedule,
) =>
  updateScheduleCache(current, (schedules) => {
    const incomingId = getScheduleId(incoming);
    const hasExisting = schedules.some((schedule) => getScheduleId(schedule) === incomingId);
    const nextSchedules = hasExisting
      ? schedules.map((schedule) =>
          getScheduleId(schedule) === incomingId
            ? { ...schedule, ...incoming }
            : schedule,
        )
      : [incoming, ...schedules];

    return nextSchedules.map(mapScheduleForCache);
  });

const invalidateScheduleSideEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  deviceUid?: string,
  schedule?: DeviceCameraSchedule,
) => {
  const scheduleId = schedule ? getScheduleId(schedule) : undefined;
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
 * - GET /iot/devices/{deviceUid}/camera/capture-schedule -> useDeviceSchedules
 * - POST /iot/devices/{deviceUid}/camera/capture-schedule -> useCreateDeviceScheduleMutation
 * - PUT/DELETE /iot/devices/{deviceUid}/camera/capture-schedule/{scheduleId}
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
  return useQuery({
    ...deviceMediaQueryOptions(deviceId),
    select: (items): DisplayDeviceMediaEvent[] => items.map(withMediaDisplay),
  });
};

export const useDeviceCameraSchedules = (deviceUid?: string) => {
  return useQuery({
    ...deviceCameraSchedulesQueryOptions(deviceUid),
    select: (items): DisplayCameraSchedule[] => items.map(withScheduleDisplay),
  });
};

export const useDeviceSchedules = useDeviceCameraSchedules;

export const useAllDeviceCameraSchedules = () => {
  return useQuery({
    ...allDeviceCameraSchedulesQueryOptions(),
    select: (items): DisplayCameraSchedule[] => items.map(withScheduleDisplay),
  });
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
      const previous = queryClient.getQueryData(
        iotKeys.deviceCameraSchedules(targetDeviceUid),
      );
      const previousAll = queryClient.getQueryData(iotKeys.deviceCameraSchedules());
      const optimisticSchedule: DeviceCameraSchedule = {
        scheduleId: `optimistic-${Date.now()}`,
        deviceUid: targetDeviceUid,
        enabled: schedule.enabled ?? true,
        triggerType: schedule.triggerType ?? "SCHEDULED",
        timeOfDay: schedule.timeOfDay,
        recurrence: schedule.recurrence,
        resolution: schedule.resolution,
        quality: schedule.quality,
        uploadEndpoint: schedule.uploadEndpoint,
      };
      queryClient.setQueryData(iotKeys.deviceCameraSchedules(targetDeviceUid), (current) => {
        const updated = updateScheduleCache(current, (schedules) => [
          withScheduleDisplay(optimisticSchedule),
          ...schedules,
        ]);
        return updated === current ? [withScheduleDisplay(optimisticSchedule)] : updated;
      });
      queryClient.setQueryData(iotKeys.deviceCameraSchedules(), (current) => {
        const updated = updateScheduleCache(current, (schedules) => [
          withScheduleDisplay(optimisticSchedule),
          ...schedules,
        ]);
        return updated === current ? current : updated;
      });
      return { previous, previousAll, deviceUid: targetDeviceUid };
    },
    onError: (_error, _schedule, context) => {
      const targetDeviceUid = context?.deviceUid ?? _schedule.deviceUid ?? deviceUid;
      if (targetDeviceUid && context?.previous !== undefined) {
        queryClient.setQueryData(
          iotKeys.deviceCameraSchedules(targetDeviceUid),
          context.previous,
        );
        queryClient.setQueryData(iotKeys.deviceCameraSchedules(), context.previousAll);
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
      const previous = queryClient.getQueryData(
        iotKeys.deviceCameraSchedules(deviceUid),
      );
      const previousAll = queryClient.getQueryData(iotKeys.deviceCameraSchedules());
      queryClient.setQueryData(
        iotKeys.deviceCameraSchedules(deviceUid),
        (current) =>
          updateScheduleCache(current, (schedules) =>
            schedules.map((schedule) =>
              getScheduleId(schedule) === scheduleId
                ? withScheduleDisplay({ ...schedule, ...updates })
                : schedule,
            ),
          ),
      );
      queryClient.setQueryData(
        iotKeys.deviceCameraSchedules(),
        (current) =>
          updateScheduleCache(current, (schedules) =>
            schedules.map((schedule) =>
              getScheduleId(schedule) === scheduleId
                ? withScheduleDisplay({ ...schedule, ...updates })
                : schedule,
            ),
          ),
      );
      return { previous, previousAll };
    },
    onError: (_error, _variables, context) => {
      if (deviceUid && context?.previous !== undefined) {
        queryClient.setQueryData(
          iotKeys.deviceCameraSchedules(deviceUid),
          context.previous,
        );
        queryClient.setQueryData(iotKeys.deviceCameraSchedules(), context.previousAll);
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
      const previous = queryClient.getQueryData(
        iotKeys.deviceCameraSchedules(deviceUid),
      );
      const previousAll = queryClient.getQueryData(iotKeys.deviceCameraSchedules());
      queryClient.setQueryData(
        iotKeys.deviceCameraSchedules(deviceUid),
        (current) =>
          updateScheduleCache(current, (schedules) =>
            schedules.filter((schedule) => getScheduleId(schedule) !== scheduleId),
          ),
      );
      queryClient.setQueryData(
        iotKeys.deviceCameraSchedules(),
        (current) =>
          updateScheduleCache(current, (schedules) =>
            schedules.filter((schedule) => getScheduleId(schedule) !== scheduleId),
          ),
      );
      return { previous, previousAll };
    },
    onError: (_error, _scheduleId, context) => {
      if (deviceUid && context?.previous !== undefined) {
        queryClient.setQueryData(
          iotKeys.deviceCameraSchedules(deviceUid),
          context.previous,
        );
        queryClient.setQueryData(iotKeys.deviceCameraSchedules(), context.previousAll);
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
      queryClient.setQueryData(iotKeys.deviceCameraSchedules(nextDeviceUid), (current) =>
        upsertScheduleCache(current, schedule),
      );
      if (nextDeviceUid) {
        queryClient.setQueryData(iotKeys.deviceCameraSchedules(), (current) =>
          upsertScheduleCache(current, schedule),
        );
      }
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
      const targetDeviceUid = schedule.deviceUid ?? nextDeviceUid ?? deviceUid;
      queryClient.setQueryData(iotKeys.deviceCameraSchedules(targetDeviceUid), (current) =>
        upsertScheduleCache(current, schedule),
      );
      if (targetDeviceUid) {
        queryClient.setQueryData(iotKeys.deviceCameraSchedules(), (current) =>
          upsertScheduleCache(current, schedule),
        );
      }
      invalidateScheduleSideEffects(
        queryClient,
        targetDeviceUid,
        schedule,
      );
    },
  });
};
