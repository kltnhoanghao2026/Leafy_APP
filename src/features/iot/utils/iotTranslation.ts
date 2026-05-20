/*
 * Mobile IoT i18n coverage.
 *
 * Migrated under the `iot.*` namespace:
 * - `iot.devices.list.*`: device list labels, loading, empty, and errors.
 * - `iot.devices.detail.*`: device detail metadata, readings, chart labels, and actions.
 * - `iot.devices.media.*`: device detail media panel, thumbnails, media history, analysis actions, and errors.
 * - `iot.devices.media.status.*`: REQUESTED, COMMAND_SENT, UPLOADING, UPLOADED, FAILED, TIMEOUT.
 * - `iot.devices.media.analysisStatusOptions.*`: PENDING, PROCESSING, PROCESSED, DISEASE_DETECTED, FAILED.
 * - `iot.devices.media.triggerType.*`: MANUAL and SCHEDULED capture labels.
 * - `iot.config.*`: device config screen, form labels, validation, push progress, status, ACK/timeout copy.
 * - `iot.devices.onboarding.*`: onboarding, QR scan, farm/zone picker, progress, success, and Wi-Fi guide.
 * - `iot.cameraSchedules.*`: device/admin schedule fields, create/run actions, filters, loading, empty, validation, and errors.
 * - `iot.cameraSchedules.recurrence.*`: DAILY, WEEKLY, MONTHLY.
 * - `iot.cameraSchedules.qualityOptions.*`: LOW, MEDIUM, HIGH.
 * - `iot.cameraSchedules.resolutionOptions.*`: QVGA, VGA, HD.
 * - `iot.charts.*`: telemetry analytics panel, compare mode, legends, expanded view, and alert marker copy.
 * - `iot.metrics.dashboard.*`: IoT dashboard overview, farm selector, zone list, and summary cards.
 * - `iot.metrics.zone.*`: zone metrics summary cards, chart controls, loading, empty, and error states.
 * - `iot.alerts.*`: alert list/detail labels, filters, badges, and acknowledge/resolve actions.
 * - `iot.alertRules.*`: alert-rule list, create/edit form, enable toggle, validation, and CRUD actions.
 *
 * Pending for future phases:
 * - Any future admin/demo tooling if it is intentionally exposed on mobile.
 *
 * Use `iot.common.unknown`, `iot.common.noData`, and `iot.common.unassigned`
 * as readable placeholders instead of leaking missing/null values into the UI.
 */
export const IOT_TRANSLATION_NAMESPACE = "iot";
