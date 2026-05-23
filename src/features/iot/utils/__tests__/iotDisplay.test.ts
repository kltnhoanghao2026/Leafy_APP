import { initializeI18n } from "@/src/i18n";

import {
  mapEnumToLocalized,
  withAlertDisplay,
  withMediaDisplay,
  withRuleDisplay,
  withScheduleDisplay,
} from "../iotDisplay";

describe("iotDisplay", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("maps media event raw status, analysis, timestamps, and technical IDs", () => {
    const rawMedia = {
      id: "media-event-id-123",
      requestId: "request-id-456",
      fileId: "file-id-789",
      deviceUid: "leafy-prototype-001",
      status: "UPLOADED",
      triggerType: "SCHEDULED",
      sizeBytes: 2048,
      width: 640,
      height: 480,
      createdAt: "2026-05-23T08:30:00.000Z",
      uploadedAt: "2026-05-23T08:31:00.000Z",
      analysis: {
        id: "analysis-id-1",
        mediaEventId: "media-event-id-123",
        fileId: "file-id-789",
        deviceUid: "leafy-prototype-001",
        status: "DISEASE_DETECTED",
        analysisStatus: "DISEASE_DETECTED",
        diseaseDetected: true,
        severity: "HIGH",
        diseaseType: "Leaf spot",
        analyzedAt: "2026-05-23T08:32:00.000Z",
      },
    } as any;

    const result = withMediaDisplay(rawMedia);

    expect(result.display.statusLabel).toBeTruthy();
    expect(result.display.statusLabel).not.toBe("UPLOADED");
    expect(result.display.analysis.statusLabel).not.toBe("DISEASE_DETECTED");
    expect(result.display.analysis.severityLabel).not.toBe("HIGH");
    expect(result.display.timestampLabel).not.toBe("2026-05-23T08:31:00.000Z");
    expect(result.display.technical.requestId).toBeTruthy();
    expect(result.display.technical.fileId).toBeTruthy();
  });

  it("maps camera schedule enums, time, endpoint, and technical IDs", () => {
    const rawSchedule = {
      id: "schedule-db-id",
      scheduleId: "schedule-id-123",
      deviceUid: "leafy-prototype-001",
      enabled: true,
      timeOfDay: "08:30:00",
      recurrence: "DAILY",
      resolution: "VGA",
      quality: "MEDIUM",
      uploadEndpoint: "http://192.168.1.10:8084/internal/files/upload",
      nextRunAt: "2026-05-24T08:30:00.000Z",
      lastRunAt: "2026-05-23T08:30:00.000Z",
    } as any;

    const result = withScheduleDisplay(rawSchedule);

    expect(result.display.timeLabel).toBe("08:30");
    expect(result.display.recurrenceLabel).not.toBe("DAILY");
    expect(result.display.resolutionLabel).not.toBe("VGA");
    expect(result.display.qualityLabel).not.toBe("MEDIUM");
    expect(result.display.endpointLabel).not.toContain("http://192.168.1.10");
    expect(result.display.technical.deviceUid).toBeTruthy();
    expect(result.display.technical.scheduleId).toBeTruthy();
  });

  it("maps alert event labels without exposing raw location IDs", () => {
    const rawAlert = {
      id: "alert-id-123",
      deviceId: "device-db-id-123",
      zoneId: "zone-db-id-123",
      farmPlotId: "farm-db-id-123",
      severity: "CRITICAL",
      status: "OPEN",
      openedAt: "2026-05-23T08:30:00.000Z",
      thresholdMin: 10,
      thresholdMax: 35,
      triggerValue: 42,
      sensorCode: "AIR_TEMP",
    } as any;

    const result = withAlertDisplay(rawAlert);

    expect(result.display.severityLabel).not.toBe("CRITICAL");
    expect(result.display.statusLabel).not.toBe("OPEN");
    expect(result.display.deviceLabel).not.toBe("device-db-id-123");
    expect(result.display.zoneLabel).not.toBe("zone-db-id-123");
    expect(result.display.thresholdLabel).toContain("10");
    expect(result.display.thresholdLabel).toContain("35");
    expect(result.display.technical.alertId).toBeTruthy();
  });

  it("maps alert rule labels while keeping rule ID technical", () => {
    const rawRule = {
      id: "rule-db-id",
      ruleId: "rule-id-123",
      name: "Temperature guard",
      sensorType: "AIR_TEMP",
      severity: "HIGH",
      thresholdMin: 10,
      thresholdMax: 35,
      enabled: true,
    } as any;

    const result = withRuleDisplay(rawRule);

    expect(result.display.sensorLabel).not.toBe("AIR_TEMP");
    expect(result.display.severityLabel).not.toBe("HIGH");
    expect(result.display.thresholdLabel).toContain("10");
    expect(result.display.thresholdLabel).toContain("35");
    expect(result.display.technical.ruleId).toBeTruthy();
  });

  it("uses unknown labels instead of raw unknown enum values", () => {
    expect(mapEnumToLocalized("SOME_NEW_STATUS", "mediaStatus")).not.toBe("SOME_NEW_STATUS");
    expect(mapEnumToLocalized("VERY_HIGH", "severity")).not.toBe("VERY_HIGH");
    expect(mapEnumToLocalized("SUPER_HD", "resolution")).not.toBe("SUPER_HD");
  });
});
