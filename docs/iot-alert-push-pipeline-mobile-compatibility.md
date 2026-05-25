# IoT Alert Push Pipeline Mobile Compatibility

Audit date: 2026-05-25

## Summary

Mobile Android can route IoT alert push notifications when notification-service sends:

```json
{
  "type": "IOT_ALERT",
  "referenceId": "<alertEventId>"
}
```

The backend telemetry alert pipeline sends this shape after `notification-service` converts `AlertTriggeredEvent` into FCM data. Disease detection alerts currently create an `AlertEvent`, but do not reach notification-service because backend Kafka publish is skipped before FCM delivery.

## Mobile Handling

| Requirement | File | Status | Notes |
| --- | --- | ---: | --- |
| Recognize IoT alert payload | `src/features/iot/utils/alertNotification.ts` | Yes | Supports `IOT_ALERT` and other alert-like types. |
| Read alert id | `src/features/iot/utils/alertNotification.ts` | Yes | Reads `referenceId` or `alertId`. |
| `alertEventId` fallback | `src/features/iot/utils/alertNotification.ts` | No | Backend currently sends `referenceId`, so this is not a blocker. |
| Background tap route | `src/features/notifications/components/ExpoPushBootstrap.tsx` | Yes | Uses `addNotificationResponseReceivedListener`. |
| Killed-app tap route | `src/features/notifications/components/ExpoPushBootstrap.tsx` | Yes | Uses `getLastNotificationResponseAsync`. |
| Foreground cache invalidation | `src/features/notifications/components/ExpoPushBootstrap.tsx` | Yes | Invalidates alert list/detail and notification state. |
| Alert detail screen | `app/(main)/iot/alerts/[alertId].tsx` | Yes | Opens `AlertEventDetailScreen`. |

## Compatibility Verdict

| Alert source | Mobile route compatibility | Current blocker |
| --- | --- | --- |
| Telemetry threshold | Compatible | Requires valid Android FCM token and rule `notifyMobile=true`. |
| Disease detection | Compatible after backend publish fix | Backend skips Kafka publish because `notifyMobile` and `notifyWeb` are null. |

## Recommended Mobile Hardening

Add `alertEventId` as a fallback in `getIotAlertIdFromPayload` later:

```text
referenceId -> alertEventId -> alertId
```

This is not required for the current telemetry FCM payload, but it makes mobile more tolerant if backend payloads vary.

