/*
 * Mobile IoT i18n coverage.
 *
 * Migrated under the `iot.*` namespace:
 * - `iot.devices.list.*`: device list labels, loading, empty, and errors.
 * - `iot.devices.detail.*`: device detail metadata, readings, chart labels, and actions.
 * - `iot.devices.onboarding.*`: onboarding, QR scan, farm/zone picker, progress, success, and Wi-Fi guide.
 * - `iot.metrics.dashboard.*`: IoT dashboard overview, farm selector, zone list, and summary cards.
 * - `iot.metrics.zone.*`: zone metrics summary cards, chart controls, loading, empty, and error states.
 * - `iot.alerts.*`: alert list/detail labels, filters, badges, and acknowledge/resolve actions.
 *
 * Pending for future phases:
 * - `iot.devices.config.*`: device config form, config push progress, and ACK/timeout copy.
 * - Camera/media and scheduled capture UI when the mobile surface is added.
 * - Any future admin/demo tooling if it is intentionally exposed on mobile.
 *
 * Use `iot.common.unknown`, `iot.common.noData`, and `iot.common.unassigned`
 * as readable placeholders instead of leaking missing/null values into the UI.
 */
export const IOT_TRANSLATION_NAMESPACE = "iot";
