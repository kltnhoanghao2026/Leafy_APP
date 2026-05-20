# Mobile IoT i18n

Mobile IoT UI copy is being migrated into the `iot.*` namespace in `src/i18n/locales/en.json` and `src/i18n/locales/vi.json`.

Migrated now:
- `iot.devices.list.*`
- `iot.devices.detail.*`
- `iot.devices.media.*`
- `iot.devices.onboarding.*`
- `iot.config.*`
- `iot.cameraSchedules.*`
- `iot.charts.*`
- `iot.metrics.dashboard.*`
- `iot.metrics.zone.*`
- `iot.alerts.*`
- `iot.alertRules.*`

Pending:
- `iot.devices.config.*` for config form, config push progress, and ACK/timeout copy.
- Wider admin/demo tooling beyond camera schedules only if intentionally exposed in mobile later.

Use `iot.common.unknown`, `iot.common.noData`, and `iot.common.unassigned` for fallback placeholders.

## Phase 2 media and camera schedules

Device detail now includes a media/camera panel that uses:
- `GET /iot/devices/{deviceId}/media`
- `POST /iot/devices/{deviceUid}/camera/detect?force=true`
- `GET /iot/devices/{deviceUid}/camera/schedules`
- `POST /iot/devices/{deviceUid}/camera/schedules`
- `PUT /iot/devices/{deviceUid}/camera/schedules/{scheduleId}`
- `DELETE /iot/devices/{deviceUid}/camera/schedules/{scheduleId}`
- `POST /iot/devices/{deviceUid}/camera/run-scheduled/{scheduleId}`
- `GET /iot/camera-schedules` for the admin all-device schedule view
- `POST /admin/camera/run-scheduled/{deviceUid}`
- `GET /files/presigned-url/{fileId}` for uploaded thumbnails

The create/edit schedule form validates `timeOfDay` as `HH:mm:ss`, requires recurrence, and restricts recurrence to `DAILY | WEEKLY | MONTHLY`, resolution to `QVGA | VGA | HD`, and quality to `LOW | MEDIUM | HIGH`.

The admin camera schedule screen is available at `/iot/camera-schedules`. It lists schedules across devices, supports `deviceUid` and enabled/disabled filters, provides schedule creation, shows latest media status, and can run scheduled capture per schedule.

## Phase 4 alert rules

Alert rules are available at `/iot/alerts/rules` from the IoT alert list. The mobile screen supports list/search/filter, create, edit, delete, and enable/disable toggles with optimistic React Query updates.

Alert-rule API hooks:
- `useAlertRules()`
- `useCreateAlertRuleMutation()`
- `useUpdateAlertRuleMutation()`
- `useDeleteAlertRuleMutation()`

Backend endpoints:
- `GET /iot/alert-rules`
- `POST /iot/alert-rules`
- `PUT /iot/alert-rules/{ruleId}`
- `DELETE /iot/alert-rules/{ruleId}`

The form validates required rule name, required sensor type, valid severity, numeric threshold values, and `thresholdMin <= thresholdMax`.

Mock UI diagram:

```text
IoT Alerts
  -> Alert rules
     [Search] [All | Enabled | Disabled] [Create rule]
     Rule card
       Name / sensor type
       Enabled switch
       Min threshold | Max threshold
       Severity | Last triggered
       [Edit] [Delete]
```

## Charting and analytics

Device detail includes `DeviceChartsPanel`, a mobile telemetry analytics panel backed by the existing collector chart endpoint:
- `GET /iot/devices/{deviceId}/charts?sensorCode={sensorCode}&range={range}`
- `GET /iot/alert-events` for alert markers aligned to telemetry timestamps
- `GET /iot/devices/{deviceId}/media` for media-analysis markers such as disease-detected alerts

Hooks:
- `useDeviceTelemetry(deviceId, sensorCode, range)` for single-metric history
- `useDeviceMetricsComparison(deviceId, sensorCodes, range)` for 2-3 metric comparison

The panel supports range filtering, metric selection, compare mode, an expanded modal view, legend display, pull-to-refresh, and tap-to-inspect alert/media markers.

## Phase 6 config i18n

Device configuration UI is covered by `iot.config.*` in both `en.json` and `vi.json`.

Covered config areas:
- `DeviceConfigScreen`
- `ConfigForm`
- `ConfigStatusCard`
- `ConfigPushProgress`
- config push status labels
- config validation messages

When adding future config fields, add keys under `iot.config.*` first, then reference them with `useTranslation()` in the component. Validation utilities should return translation keys instead of rendered text so all callers can localize consistently.
