# Mobile IoT Alert Payload Hardening Phase P3

## Route ID Extraction

Mobile now resolves an IoT alert id from push payloads in this order:

```text
referenceId -> alertEventId -> alertId
```

This preserves existing routing for current backend payloads and adds tolerance for payloads that include `alertEventId` without `referenceId`.

## Supported Metadata

The payload type accepts optional disease/media metadata:

* `mediaEventId`
* `analysisId`
* `diseaseName`
* `confidence`

These fields are optional. Missing metadata does not break route handling.

## Behavior

* Push tap still opens `/(main)/iot/alerts/{alertId}`.
* Missing `referenceId` can still route if `alertEventId` exists.
* No new UI screen is introduced in Phase P3.

