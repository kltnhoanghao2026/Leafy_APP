# Leafy APP Mobile IoT E2E Checklist

Use this checklist for a real backend demo of the mobile IoT flow.

## 1. Environment

- [ ] API gateway is running and reachable from the phone/emulator.
- [ ] `EXPO_PUBLIC_API_URL` points to the gateway `/api` base URL.
- [ ] User can log in on mobile.
- [ ] Gateway forwards bearer auth and injects user headers.
- [ ] Farm service has at least one farm plot for the current profile.
- [ ] Farm service has at least one zone under the selected farm plot.
- [ ] IoT collector service is running.
- [ ] MQTT broker is running if testing config push/ACK.
- [ ] Test device firmware uses the same MQTT topic namespace as backend config.

## 2. Device List

- [ ] Open tab `IoT`.
- [ ] Expected API: `GET /iot/devices/me`.
- [ ] Pull to refresh reloads the list.
- [ ] Empty state is shown if user has no claimed devices.
- [ ] Tapping a device opens detail route `/iot/devices/{deviceId}`.

## 3. Onboarding

- [ ] Tap `Them` from the IoT list.
- [ ] Open QR scanner.
- [ ] Grant camera permission.
- [ ] Scan a valid QR payload.
- [ ] Paste valid JSON fallback if camera is unavailable.
- [ ] Invalid JSON shows a friendly error.
- [ ] Missing `deviceUid`, `deviceCode`, or `deviceType` shows a validation error.
- [ ] Select farm plot.
- [ ] Select zone after farm plot is selected.
- [ ] Submit `Ket noi thiet bi`.
- [ ] Expected API sequence:
  - [ ] `POST /iot/devices/provision`
  - [ ] `POST /iot/devices/{deviceId}/claim-code`
  - [ ] `POST /iot/devices/claim`
  - [ ] `GET /iot/devices/me`
- [ ] Success navigates to device detail.
- [ ] If device is offline, Wi-Fi setup guide is visible.

## 4. Device Detail And Charts

- [ ] Device detail loads.
- [ ] Expected APIs:
  - [ ] `GET /iot/devices/{deviceId}/detail`
  - [ ] `GET /iot/devices/{deviceId}/latest-readings`
  - [ ] `GET /iot/devices/{deviceId}/charts?sensorCode=...&range=...`
- [ ] Latest readings show value/unit/time.
- [ ] Sensor selector switches chart sensor.
- [ ] Range selector supports `H24`, `D3`, `D7`, `D30`, `D90`.
- [ ] Empty chart state appears if aggregate data is not available.
- [ ] Chart API failure does not crash the screen.

## 5. IoT Dashboard And Zone Metrics

- [ ] Tap `Xem tong quan IoT`.
- [ ] Select farm plot.
- [ ] Expected API: `GET /iot/dashboard/overview?farmPlotId=...`.
- [ ] Overview cards show total devices, online, offline, zones, open alerts.
- [ ] Zones list loads with `GET /farms/plots/{plotId}/zones`.
- [ ] Tap a zone.
- [ ] Expected APIs:
  - [ ] `GET /iot/farm-zones/{zoneId}/overview`
  - [ ] `GET /iot/farm-zones/{zoneId}/charts?sensorCode=...&range=...`
- [ ] Zone latest readings and chart render.
- [ ] Zone alert shortcut opens alerts filtered by zone.

## 6. Config Push

- [ ] Open device detail.
- [ ] Tap `Cau hinh thiet bi`.
- [ ] Expected API: `GET /iot/devices/{deviceId}/config`.
- [ ] Edit sampling interval.
- [ ] Edit publish interval.
- [ ] Edit offline timeout.
- [ ] Toggle alert enabled.
- [ ] Invalid values show validation errors.
- [ ] Save config.
- [ ] Expected API: `PUT /iot/devices/{deviceId}/config`.
- [ ] Push config.
- [ ] Expected API: `POST /iot/devices/{deviceId}/config/push`.
- [ ] Polling starts with `GET /iot/devices/{deviceId}/config` every 3 seconds.
- [ ] `ACKED` shows success.
- [ ] `FAILED` shows backend/device error.
- [ ] No ACK after 45 seconds shows timeout.

## 7. Alerts

- [ ] Open alerts from IoT dashboard.
- [ ] Expected API: `GET /iot/alert-events`.
- [ ] Filter by status.
- [ ] Filter by severity.
- [ ] Filter by 24h, 7 days, 30 days, all.
- [ ] Filter by deviceId or zoneId if needed.
- [ ] Pull to refresh reloads alerts.
- [ ] Open an alert detail.
- [ ] Expected API: `GET /iot/alert-events/{alertId}`.
- [ ] If status is `OPEN`, acknowledge is enabled.
- [ ] Acknowledge calls `POST /iot/alert-events/{alertId}/acknowledge`.
- [ ] If status is `OPEN` or `ACKNOWLEDGED`, resolve is enabled.
- [ ] Resolve calls `POST /iot/alert-events/{alertId}/resolve`.
- [ ] After action, list/detail/dashboard/zone overview refresh.

## 8. Troubleshooting

- [ ] 401 means token expired or refresh failed; log in again.
- [ ] 403 means current user cannot access the resource.
- [ ] No farm plot means create a farm plot first.
- [ ] No zone means create a zone under the farm plot first.
- [ ] Device already claimed means use a different test device UID.
- [ ] Empty charts may mean aggregate scheduler has not built data yet.
- [ ] Config push timeout usually means the physical device is offline or not subscribed to the config topic.
- [ ] Alerts not showing may mean no alert rules are enabled or telemetry has not crossed thresholds.
