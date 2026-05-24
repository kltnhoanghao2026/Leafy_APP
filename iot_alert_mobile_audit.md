# Leafy Mobile IoT & Alert UX Audit

Scope: `Leafy_APP/src/features/iot`, `Leafy_APP/src/i18n/locales/en.json`, `Leafy_APP/src/i18n/locales/vi.json`.

Note: the mobile app does not currently have a separate `src/features/alerts` folder. Alert screens, components, hooks, and types are implemented under `src/features/iot`.

## Expected Display Mappings

| Raw backend value | Suggested display |
| --- | --- |
| `deviceUid`, `deviceId`, `scheduleId`, `alertId`, `mediaEventId`, `requestId`, `fileId` | Do not show as primary text. Use device name, device code, farm/zone name, alert title, or media capture timestamp. Keep IDs only for mutation payloads, cache keys, routes, and optional admin debug detail. |
| `PENDING` | `t("iot.common.status.pending")` or context-specific label such as "Waiting for analysis" |
| `PROCESSING` | `t("iot.devices.media.analysisStatusOptions.PROCESSING")` as "Processing analysis" |
| `PROCESSED` | `t("iot.devices.media.analysisStatusOptions.PROCESSED")` as "Analysis complete" |
| `DISEASE_DETECTED` | `t("iot.devices.media.analysisStatusOptions.DISEASE_DETECTED")` as "Disease detected" |
| `REQUESTED` | `t("iot.devices.media.status.REQUESTED")` as "Capture requested" |
| `COMMAND_SENT` | `t("iot.devices.media.status.COMMAND_SENT")` as "Command sent" |
| `UPLOADING` | `t("iot.devices.media.status.UPLOADING")` as "Uploading image" |
| `UPLOADED` | `t("iot.devices.media.status.UPLOADED")` as "Uploaded" |
| `FAILED` / `TIMEOUT` | Localized failure labels with optional user-facing reason, not backend error text alone |
| `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` severity | `getAlertSeverityLabel()` / `t("iot.alerts.severity.*")`; color-coded accessible badge |
| `LOW`, `MEDIUM`, `HIGH` camera quality | `t("iot.cameraSchedules.qualityOptions.*")`; e.g. Low / Medium / High |
| `QVGA`, `VGA`, `HD` camera resolution | `t("iot.cameraSchedules.resolutionOptions.*")`; add human-friendly copy such as Compact / Standard / HD |
| `DAILY`, `WEEKLY`, `MONTHLY` recurrence | `t("iot.cameraSchedules.recurrence.*")` |
| ISO timestamps | `formatDateTime(value)` or relative display such as "Today, 08:30" |
| `HH:mm:ss` schedule time | Prefer `HH:mm` in list/cards; keep seconds in edit input helper only if backend requires it |
| raw `uploadEndpoint` URL | Show "Default upload destination" or "Custom destination configured"; expose full URL only in admin technical detail |

## Table 1: UI Components Displaying Raw/Technical Info

| Component/File | Raw Field(s) | Current Display | Issue Type | Suggested Display |
| --- | --- | --- | --- | --- |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:376`) | `schedule.deviceUid` | Card title renders raw device UID. | ID display | Show device name/code if available. If admin needs UID, show compact UID as secondary technical text. Comment: device UID is not meaningful for most users and should not be the primary label. |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:389-390`) | `timeOfDay`, `recurrence`, `resolution`, `quality` | `08:00:00 | DAILY | VGA | MEDIUM` style line. | Raw enum / unclear schedule metadata | Format time as `HH:mm`; map recurrence, resolution, quality through i18n. Comment: this is one of the highest-impact rows because the admin schedule list is a dense repeated view. |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:399-400`) | `uploadEndpoint` | Full upload URL or `None`. | Technical URL exposure | Show "Default upload destination" or "Custom upload destination"; keep full URL behind an admin-only expandable technical section. |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:403-404`) | `mediaStatus` from `media.analysis.analysisStatus` or `media.status` | Raw `PROCESSING`, `UPLOADED`, `FAILED`, etc. can appear. | Raw enum / media analysis | Use `t("iot.devices.media.analysisStatusOptions.*")` for analysis status and `t("iot.devices.media.status.*")` for media event status. |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:164-166`) | `deviceUidFilter` | Placeholder says "Filter by device UID". | ID-centric UX | Prefer "Filter by device" and search against name/code/UID. Comment: UID can still be part of search, but the visible label should not force users to know it. |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:192-194`) | `deviceUid` input | Create form asks for "Device UID". | Technical field in form | Use a device picker with readable device names. Keep UID in the submitted payload only. |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:202`) | Time format | Hardcoded placeholder `08:00:00`. | Hardcoded / backend-shaped input | Add localized helper text: `t("iot.cameraSchedules.timePlaceholder")`; accept/display `HH:mm` while converting to `HH:mm:ss` before submit. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:349`) | `schedule.timeOfDay` | Shows raw `HH:mm:ss`. | Backend-shaped time | Show `HH:mm` in the schedule list. Keep seconds only in edit mode if required. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:367-373`) | `schedule.status`, `lastMediaEvent.status`, `lastMediaEvent.analysis.analysisStatus` | Schedule/media status can fall back to raw values. | Raw enum / media analysis | Use a single status display helper that distinguishes schedule status, media upload status, and analysis status. Comment: mixing schedule status and media status in the same label is confusing. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:379-383`) | `recurrence`, `resolution`, `quality` | Uses local `translateEnum`, but fallback returns raw value for unknown enum. | Partial mapping | Add shared mapping with unknown fallback: "Unknown schedule option"; optionally log unknown values outside UI. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:391-393`) | `schedule.uploadEndpoint` | Full endpoint URL shown in device screen. | Technical URL exposure | Show "Default upload destination" or "Custom destination configured"; use details sheet only for technical/admin users. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:430`) | Time input placeholder | Hardcoded `08:00:00`. | i18n gap / backend-shaped input | Add `iot.cameraSchedules.timePlaceholder` and display helper text explaining the expected local time. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:505`) | `media.id` | Used as React key only. | Safe technical use | OK. Comment: keep `media.id` for list keys/mutations; do not render it. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:607-617`) | `analysis.status`, `analysis.analysisStatus` | Mapped with `translateEnum`, but unknown fallback is raw backend enum. | Partial mapping / media analysis | Add `formatMediaAnalysisStatus()` with safe fallback. Unknown should show "Unknown analysis status", not raw enum. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:620-626`) | `diseaseType`, `diseaseName`, `severity` | Disease code/name and severity are shown directly or partially translated. | Disease detection clarity | Map disease code to display name when possible; show confidence and analyzed time if available; severity should use alert severity helper. |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:287-290`) | `mediaEventId`, `fileId`, `deviceUid` | Passed to mutation only. | Safe technical use | OK. Comment: these fields should remain payload-only and never become visible UI. |
| `DeviceChartsPanel` (`src/features/iot/components/DeviceChartsPanel.tsx:378`) | `selectedMarker.severity` | Marker detail shows raw `HIGH`, `MEDIUM`, etc. | Raw enum in tooltip/legend | Use `getAlertSeverityLabel(selectedMarker.severity)` and accessible severity colors. |
| `DeviceChartsPanel` (`src/features/iot/components/DeviceChartsPanel.tsx:459`) | Hardcoded fallback label | Media marker fallback is `"Media analysis"`. | i18n gap | Use `t("iot.charts.mediaAnalysisMarker")`. Comment: marker labels appear in a tooltip-like panel and should be localized. |
| `AlertEventCard` (`src/features/iot/components/AlertEventCard.tsx:49-50`) | `deviceId`, `zoneId` | Fallback renders raw technical IDs when name is missing. | ID display | Show `deviceName || compact device code || "Unknown device"` and `zoneName || "Unknown zone"`. Avoid raw IDs unless admin debug mode is enabled. |
| `AlertEventDetailScreen` (`src/features/iot/screens/AlertEventDetailScreen.tsx:149-151`) | `deviceId`, `zoneId`, `farmPlotId` | Detail rows can display raw IDs. | ID display | Resolve names through cached farm/device data or display "Unknown device/zone/farm"; optional compact ID under "Technical details". |
| `AlertEventDetailScreen` (`src/features/iot/screens/AlertEventDetailScreen.tsx:146`) | `thresholdMin`, `thresholdMax` | Displays `min / max` without units or explanation. | Unclear numeric data | Format as "Below X unit / Above Y unit" or "Allowed range X-Y unit"; include sensor unit. |
| `AlertEventsScreen` (`src/features/iot/screens/AlertEventsScreen.tsx:79-80`) | `alert.id` route param | Used for navigation only. | Safe technical use | OK. Comment: `alertId` is appropriate for route/mutation and should not be displayed as a label. |
| `AlertEventsScreen` (`src/features/iot/screens/AlertEventsScreen.tsx:173`) | `item.id` highlight comparison | Used for highlight only. | Safe technical use | OK. Do not render the ID. |
| `AlertFilters` (`src/features/iot/components/AlertFilters.tsx:110-121`) | `deviceId`, `zoneId` | Filters ask users to type technical IDs. | ID-centric UX | Replace with pickers/search by device name and zone name; keep IDs in query params internally. |
| `AlertRulesScreen` (`src/features/iot/screens/AlertRulesScreen.tsx:389`) | `sensorType` | Free text sensor type expects raw code such as `AIR_TEMP`. | Internal code input | Replace with sensor picker using `getSensorLabel`; submit sensor code internally. |
| `AlertRulesScreen` (`src/features/iot/screens/AlertRulesScreen.tsx:480-481`) | `sensorType`, `sensorTypeId` | Rule card displays raw sensor code when no friendly name exists. | Raw enum/code | Use `getSensorLabel(sensor)` consistently; show code only as secondary technical text. |
| `AlertRulesScreen` (`src/features/iot/screens/AlertRulesScreen.tsx:47`) | `ruleId` / `id` | Used for key/edit/delete only. | Safe technical use | OK. Do not show rule IDs in UI. |
| `DeviceDetailScreen` (`src/features/iot/screens/DeviceDetailScreen.tsx:171`) | `deviceCode || deviceUid` | Header can fall back to compacted UID. | ID display fallback | Prefer device name + short model/type; if UID is unavoidable, prefix as technical identifier and keep secondary. |
| `DeviceDetailScreen` (`src/features/iot/screens/DeviceDetailScreen.tsx:192-193`) | `farmPlotId`, `zoneId` | Basic info can display raw farm/zone IDs. | ID display | Resolve and show farm/zone names. Comment: this is prominent in detail screen and should be user-readable. |
| `DeviceCard` (`src/features/iot/components/DeviceCard.tsx:49-52`) | `farmPlotId`, `zoneId` | Device list card shows raw farm and zone IDs when assigned. | ID display | Show farm/zone names or "Assigned to farm/zone"; keep IDs hidden. |
| `IoTDashboardScreen` (`src/features/iot/screens/IoTDashboardScreen.tsx:179`) | `plot.id` | Farm option meta falls back to raw ID. | ID display fallback | Use address/code only; if neither exists, show "No farm metadata". |
| `IoTDashboardScreen` (`src/features/iot/screens/IoTDashboardScreen.tsx:196`) | `zone.id` | Zone row meta falls back to raw ID. | ID display fallback | Use crop/soil/status summary; otherwise "No zone metadata". |
| `FarmZonePicker` (`src/features/iot/components/FarmZonePicker.tsx:65`) | `plot.id` | Farm picker meta falls back to raw ID. | ID display fallback | Same as dashboard: avoid raw ID in selection UI. |
| `FarmZonePicker` (`src/features/iot/components/FarmZonePicker.tsx:92`) | `zone.id` | Zone picker meta falls back to raw ID. | ID display fallback | Use crop/soil/area metadata or a localized empty metadata label. |
| `DeviceOnboardingScreen` (`src/features/iot/screens/DeviceOnboardingScreen.tsx:261-262`) | `deviceUid`, `deviceType` | The read-device-info card shows raw UID and raw device type. | Technical onboarding data | For normal users, show model/device code and "Device identifier" as secondary; map `ESP32_CAM_SENSOR` to a friendly device type label. |
| `DeviceOnboardingScreen` (`src/features/iot/screens/DeviceOnboardingScreen.tsx:293-294`) | `farmPlotId`, `zoneId` | Success message can fall back to raw farm/zone IDs. | ID display fallback | Resolve and show selected `farmPlotName` / `zoneName`; if missing, show "selected farm/zone" instead of ID. |
| `DeviceQrScanScreen` (`src/features/iot/screens/DeviceQrScanScreen.tsx:108`) | Example JSON with `deviceUid`, `deviceType` | Placeholder exposes technical JSON schema. | Debug/admin-shaped UI | Localize placeholder and hide behind "Advanced/manual JSON" section; normal flow should be QR scan or field form. |
| `DeviceQrPayloadForm` (`src/features/iot/components/DeviceQrPayloadForm.tsx:24-36`) | `deviceUid`, `deviceType`, example codes | Manual form uses technical labels/placeholders. | Technical onboarding data / i18n gap | Keep for advanced setup, but add helper text and map device type choices to user-friendly labels. |
| `ConfigStatusCard` (`src/features/iot/components/ConfigStatusCard.tsx:40`) | `lastPushError` | Raw device/backend error shown directly. | Raw error/debug text | Map common errors to localized text; place raw error under "Technical details" only. |
| `DeviceConfigScreen` (`src/features/iot/screens/DeviceConfigScreen.tsx:253`) | `deviceId` fallback | Header subtitle falls back to route ID. | ID display fallback | Use device name/code; if unavailable, show "Selected device" instead of route ID. |

## Table 2: Hooks/Queries Returning Raw Data

| Hook/File | Raw Field(s) | Used in UI Component | Suggested Transformation |
| --- | --- | --- | --- |
| `useDeviceMedia` (`src/features/iot/hooks/useDeviceMedia.ts:97-122`) | `DeviceMediaEvent` raw `id`, `requestId`, `fileId`, `deviceUid`, `status`, `analysis.*`, timestamps | `DeviceMediaPanel`, `DeviceChartsPanel` | Add `select` to return `DisplayDeviceMediaEvent` with `display.status`, `display.analysisStatus`, `display.size`, `display.timestamp`, `display.analysisSummary`; keep raw IDs non-rendered. |
| `useDeviceCameraSchedules` (`src/features/iot/hooks/useDeviceMedia.ts:105-126`) | `DeviceCameraSchedule` raw `deviceUid`, `scheduleId`, `timeOfDay`, `recurrence`, `resolution`, `quality`, `status`, `uploadEndpoint`, `lastMediaEvent` | `DeviceMediaPanel` | Add `withScheduleDisplay()` in query `select`: readable device label, `HH:mm` time, localized recurrence/resolution/quality/status, endpoint summary, formatted run times. |
| `useAllDeviceCameraSchedules` (`src/features/iot/hooks/useDeviceMedia.ts:114-132`) | Same as above, across devices | `AdminCameraSchedulesPage` | Same transform, plus optional `technical.deviceUid` for admin-only detail. |
| `useCreateDeviceCameraScheduleMutation` optimistic cache (`src/features/iot/hooks/useDeviceMedia.ts:188-196`) | Generates `scheduleId: optimistic-*`, keeps `deviceUid`, raw enum defaults | Schedule lists immediately after create | Ensure optimistic schedules are passed through the same display mapper before UI consumes them. Comment: optimistic IDs must never be visible. |
| `useUpdateDeviceCameraScheduleMutation` (`src/features/iot/hooks/useDeviceMedia.ts:239-253`) | Updates raw schedule fields directly in cache | `DeviceMediaPanel`, admin schedule screen | Recompute display fields after optimistic updates to avoid stale labels. |
| `useRunCameraScheduleNowMutation` (`src/features/iot/hooks/useDeviceMedia.ts:327-341`) | Accepts `scheduleId`, `deviceUid` | Run buttons | Safe as mutation input. Do not render these values in loading text; current admin loading uses `pendingDeviceUid`, which should map to readable device label. |
| `useAlertEvents` (`src/features/iot/hooks/useAlerts.ts:13-53`) | `AlertEventItemResponse` raw `id`, `deviceId`, `zoneId`, `farmPlotId`, `status`, `severity`, timestamps | `AlertEventsScreen`, `AlertEventCard`, `DeviceChartsPanel` | Add `select` to return `DisplayAlertEvent`: localized severity/status/type, formatted value with unit, formatted openedAt, readable device/zone/farm labels. |
| `useAlertEventDetail` (`src/features/iot/hooks/useAlerts.ts:20-57`) | Detail response raw IDs and thresholds | `AlertEventDetailScreen` | Same display model as list plus threshold text: "Above X unit", "Below Y unit", or range label. |
| `useAlertRules` (`src/features/iot/hooks/useAlerts.ts:28-61`) | `ruleId`, `sensorType`, `sensorTypeId`, `severity`, `lastTriggeredAt` | `AlertRulesScreen` | Map sensor code to label, severity to localized label, lastTriggeredAt to formatted date, hide rule IDs. |
| `useCreateAlertRuleMutation` optimistic cache (`src/features/iot/hooks/useAlerts.ts:89`) | `ruleId: optimistic-*`, raw sensor/severity | `AlertRulesScreen` | Keep optimistic ID for key only; pass optimistic rule through display mapping before render. |
| `useDeviceDetail` (`src/features/iot/hooks/useDeviceDetail.ts:7-23`) | `deviceUid`, `farmPlotId`, `zoneId`, `deviceType`, `provisioningStatus`, `status` | `DeviceDetailScreen`, `DeviceConfigScreen` | Add display fields for device code, device type label, farm/zone names if available, localized statuses. |
| `useMyDevices` (`src/features/iot/hooks/useDevices.ts:45-52`) | Device list raw `farmPlotId`, `zoneId`, `deviceUid`, `deviceType` | `DeviceListScreen`, `DeviceCard` | Enrich with `display.location`, `display.deviceCode`, `display.deviceTypeLabel`; avoid farm/zone ID fallback. |
| `useDashboardOverview` / `useZoneOverview` (`src/features/iot/hooks/useIotDashboard.ts:7-27`) | Overview IDs and latest media/alert data | `IoTDashboardScreen`, zone metrics | Transform nested latest alert/media status and timestamps before rendering. |
| `collectorApi.getDeviceMedia` (`src/features/iot/api/collector.api.ts:319-325`) | Raw backend media array | All media UI | API wrapper can normalize response shape, but UI display mapping should stay in hooks to preserve backend compatibility. |
| `collectorApi.getDeviceCameraSchedules` (`src/features/iot/api/collector.api.ts:348-366`) | Raw schedule array | Device/admin schedule screens | Normalize envelope only here; add human-readable mapping in hook `select`. |
| `collectorApi.getAlertEvents` / `getAlertEventById` (`src/features/iot/api/collector.api.ts:100-119`) | Raw alert payload | Alert list/detail | Keep backend untouched; transform in hooks. |

## Table 3: i18n Gaps

| Component/File | Hardcoded string | Context | Suggested i18n key |
| --- | --- | --- | --- |
| `AdminCameraSchedulesPage` (`src/features/iot/screens/AdminCameraSchedulesPage.tsx:202`) | `08:00:00` | Time placeholder | `iot.cameraSchedules.timePlaceholder` |
| `DeviceMediaPanel` (`src/features/iot/components/DeviceMediaPanel.tsx:430`) | `08:00:00` | Time placeholder | `iot.cameraSchedules.timePlaceholder` |
| `DeviceChartsPanel` (`src/features/iot/components/DeviceChartsPanel.tsx:459`) | `Media analysis` | Chart marker fallback label | `iot.charts.mediaAnalysisMarker` |
| `DeviceQrScanScreen` (`src/features/iot/screens/DeviceQrScanScreen.tsx:108`) | JSON example with `deviceUid`, `deviceCode`, `deviceType` | Manual QR fallback placeholder | `iot.devices.onboarding.manualJsonPlaceholder` |
| `DeviceQrPayloadForm` (`src/features/iot/components/DeviceQrPayloadForm.tsx:24`) | `LEAFY-ESP32-001` | Device UID placeholder | `iot.devices.onboarding.deviceUidPlaceholder` |
| `DeviceQrPayloadForm` (`src/features/iot/components/DeviceQrPayloadForm.tsx:30`) | `ESP32-001` | Device code placeholder | `iot.devices.onboarding.deviceCodePlaceholder` |
| `DeviceQrPayloadForm` (`src/features/iot/components/DeviceQrPayloadForm.tsx:36`) | `ESP32_CAM_SENSOR` | Device type placeholder | `iot.devices.onboarding.deviceTypePlaceholder`; better as picker values mapped via `iot.devices.type.*` |
| `DeviceQrPayloadForm` (`src/features/iot/components/DeviceQrPayloadForm.tsx:42`) | `Leafy IoT Module V1` | Model placeholder | `iot.devices.onboarding.modelPlaceholder` |
| `src/i18n/locales/en.json:1079`, `src/i18n/locales/vi.json:1079` | `"Device UID"` | Onboarding device UID label | Prefer `"Device identifier"` / Vietnamese equivalent; key can remain but value should be user-friendly. |
| `src/i18n/locales/en.json:1182`, `src/i18n/locales/vi.json:1182` | `"Upload endpoint"` | Camera schedule form/list | Prefer `"Upload destination"`; endpoint is implementation language. |
| `src/i18n/locales/en.json:1186`, `src/i18n/locales/vi.json:1186` | `"Device UID"` | Camera schedule device field | Prefer `"Device"` and use picker/search. |
| `src/i18n/locales/en.json:1194`, `src/i18n/locales/vi.json:1194` | `"Filter by device UID"` | Admin schedule filter | Prefer `"Filter by device"`. |
| `src/i18n/locales/en.json:1206`, `src/i18n/locales/vi.json:1206` | `"Device UID is required."` | Schedule validation | Prefer `"Please select a device."` |
| `src/i18n/locales/en.json:1210`, `src/i18n/locales/vi.json:1210` | `"Upload endpoint must be..."` | URL validation | Prefer `"Upload destination must be a valid HTTP or HTTPS URL."` |
| `src/i18n/locales/en.json:1343-1344`, `src/i18n/locales/vi.json:1343-1344` | `deviceId`, `zoneId` | Alert filters | Prefer `"Device"` / `"Zone"` labels and picker placeholders. |

## Critical UX Issues

1. Camera schedule admin cards expose the most raw technical data: `deviceUid`, raw recurrence/resolution/quality enums, raw media/analysis statuses, and full upload endpoints.
2. Alert list/detail screens can fall back to raw `deviceId`, `zoneId`, and `farmPlotId`, which makes alerts harder to act on in the field.
3. Hooks return backend models directly, so every screen formats independently. This causes inconsistent status mapping and makes raw values leak into UI when a component misses a mapper.
4. Media/disease analysis status is split across `media.status`, `analysis.status`, and `analysis.analysisStatus`; UI currently mixes these concepts. Users need separate labels for capture upload state and disease analysis state.
5. Onboarding intentionally handles technical QR payloads, but the main visible labels still emphasize `deviceUid` and raw device type codes. That is acceptable for an advanced/manual path, but should not dominate the normal user flow.
6. Full upload endpoints and backend/device error strings are shown directly. They should be summarized for normal users and moved into an optional technical details view.
7. Several i18n values exist but are still too technical (`Device UID`, `Upload endpoint`, `deviceId`, `zoneId`). This is an i18n content issue, not just missing keys.

## Recommended Refactor Plan

1. Add `src/features/iot/utils/iotDisplay.ts` with `withMediaDisplay`, `withScheduleDisplay`, `withAlertDisplay`, and `withRuleDisplay`.
2. Apply those helpers in React Query `select` for `useDeviceMedia`, `useDeviceCameraSchedules`, `useAllDeviceCameraSchedules`, `useAlertEvents`, `useAlertEventDetail`, and `useAlertRules`.
3. Replace UI fallbacks from IDs to readable placeholders. IDs should remain in routes, query keys, mutation payloads, React keys, and cache invalidation only.
4. Add shared helpers for:
   - `formatScheduleTime("08:00:00") -> "08:00"`
   - `formatEndpointDisplay(url) -> "Custom destination configured" | "Default upload destination"`
   - `formatMediaStatusLabel(status)`
   - `formatAnalysisStatusLabel(status)`
   - `formatCameraResolutionLabel(value)`
   - `formatCameraQualityLabel(value)`
5. Replace ID text inputs in filters with device/zone pickers where data is available. Keep manual ID input only in an advanced/admin filter.
6. Update i18n values and keys listed in Table 3 before changing UI text, so both English and Vietnamese remain aligned.
