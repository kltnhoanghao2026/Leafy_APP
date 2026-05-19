# Mobile IoT i18n

Mobile IoT UI copy is being migrated into the `iot.*` namespace in `src/i18n/locales/en.json` and `src/i18n/locales/vi.json`.

Migrated now:
- `iot.devices.list.*`
- `iot.devices.detail.*`
- `iot.devices.onboarding.*`
- `iot.metrics.dashboard.*`
- `iot.metrics.zone.*`
- `iot.alerts.*`

Pending:
- `iot.devices.config.*` for config form, config push progress, and ACK/timeout copy.
- Camera/media labels when mobile camera/media UI is added.
- Admin/demo tooling only if it is intentionally exposed in mobile later.

Use `iot.common.unknown`, `iot.common.noData`, and `iot.common.unassigned` for fallback placeholders.
