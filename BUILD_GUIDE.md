# Leafy APP — Android Build Guide

This guide documents how to build the Leafy APP Android project from a clean checkout, including platform-specific workarounds required for the native C++ modules used by VisionCamera and TFLite.

---

## Prerequisites

| Tool        | Version       | Notes                                                          |
| ----------- | ------------- | -------------------------------------------------------------- |
| Node.js     | ≥ 18          |                                                                |
| JDK         | 17            | Required by AGP / React Native 0.81                            |
| Android SDK | API 35        | Install via Android Studio SDK Manager                         |
| Android NDK | 27.1.12297006 | Installed automatically by Gradle, or manually via SDK Manager |
| CMake       | 3.22.1        | Installed automatically by Gradle                              |
| Windows     | 10/11         | Long‑path support recommended (see below)                      |

### Key dependency versions (from `package.json`)

- **Expo SDK** 54 / **React Native** 0.81.5
- **react-native-vision-camera** ^4.7.3
- **react-native-fast-tflite** ^2.0.0
- **react-native-nitro-modules** ^0.35.4
- **react-native-worklets** 0.5.1
- **vision-camera-resize-plugin** ^3.2.0

---

## 1. Install JS dependencies

```powershell
cd Leafy_APP
npm install          # or: yarn install
```

---

## 2. Android‑specific configuration

### 2.1 Architecture filter — remove `armeabi-v7a`

Building for `armeabi-v7a` causes **two** fatal problems:

1. **NDK OOM crash** — The 32‑bit clang compiler runs out of address space when compiling heavy C++ template code in `react-native-nitro-modules` (`NitroTypeInfo.cpp` uses `std::regex`).  
   Error: `LLVM ERROR: out of memory — Allocation failed`

2. **Windows MAX_PATH (260 chars)** — React Native codegen produces deeply nested directories (e.g. `RNVisionCameraResizePluginSpec_autolinked_build/CMakeFiles/…`). Combined with each architecture getting its own build directory, `armeabi-v7a` paths exceed 260 characters on Windows.  
   Error: `ninja: error: mkdir(…): No such file or directory`

#### Fix in `android/gradle.properties`

```properties
# Only build for 64-bit ARM (device) and x86_64 (emulator).
# armeabi-v7a is excluded — see BUILD_GUIDE.md §2.1
reactNativeArchitectures=arm64-v8a,x86_64
```

#### Fix in `android/app/build.gradle`

Expo CLI **overrides** `gradle.properties` at build time. When a physical device is connected, `@expo/cli` detects the device's supported ABIs via `adb shell getprop ro.product.cpu.abilist` and passes them as a Gradle property:

```
-PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

The React Native Gradle Plugin (`NdkConfiguratorUtils.kt`) reads this `-P` property in a `finalizeDsl` block and calls `abiFilters.addAll(architectures)`, so `gradle.properties` alone is **not enough**.

To strip `armeabi-v7a` reliably, add this block in `app/build.gradle` **after** the `android { }` block:

```groovy
// Remove armeabi-v7a after the RN Gradle Plugin sets abiFilters from -P flag.
// This avoids Windows MAX_PATH failures with long codegen paths and NDK OOM crashes.
androidComponents {
    finalizeDsl { ext ->
        ext.defaultConfig.ndk.abiFilters.remove("armeabi-v7a")
    }
}
```

> **Why `finalizeDsl`?** Gradle AGP processes `finalizeDsl` blocks in registration order. The RN plugin registers its block first; ours runs second and removes the unwanted ABI after it was added.

### 2.2 Gradle JVM memory

In `android/gradle.properties`, ensure enough heap for the C++ compilation orchestration:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### 2.3 New Architecture

The app uses Fabric + TurboModules:

```properties
newArchEnabled=true
hermesEnabled=true
```

---

## 3. Metro configuration

`metro.config.js` must register `.tflite` as an asset extension so Metro bundles the model files:

```js
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("tflite");
```

This is already configured in the repo.

---

## 4. TFLite model assets

Place the two model files under `assets/models/`:

| File                        | Input                 | Purpose                       |
| --------------------------- | --------------------- | ----------------------------- |
| `yolo_leaf_fp16.tflite`     | 640×640×3 RGB uint8   | YOLO leaf detection           |
| `coffee_mobilenetv2.tflite` | 224×224×3 RGB float32 | Coffee disease classification |

These are loaded at runtime by `react-native-fast-tflite` via `require()` statements in `useTfliteModels.ts`.

---

## 5. Runtime fix — TFLite model ↔ worklet bridging

The original code used `NitroModules.box()` to pass TFLite models into VisionCamera frame processor worklets. This **does not work** because:

- `NitroModules.box()` requires a Nitro `HybridObject`
- `react-native-fast-tflite` v2 returns a plain **JSI HostObject** (TurboModule‑based), not a HybridObject
- Error at runtime: `NitroModulesProxy.box(): Cannot determine default value of object`

**Fix:** Pass the TFLite model directly as a `useFrameProcessor` dependency. VisionCamera shares JSI HostObjects to the worklet context natively — no boxing required. This matches the [official react-native-fast-tflite docs](https://github.com/mrousavy/react-native-fast-tflite#usage-visioncamera).

Affected files:

- `src/features/disease-detection/models/useTfliteModels.ts` — removed `NitroModules.box()` calls and `boxedYolo`/ `boxedMobilenet` exports
- `src/features/disease-detection/models/useLeafDetectionProcessor.ts` — changed prop from `boxedYolo` to `yoloModel`, removed `.unbox()` call
- `src/features/disease-detection/components/RealtimeScanScreen.tsx` — passes `yoloModel` directly

---

## 6. Build commands

### Debug build (physical device connected via USB)

```powershell
cd Leafy_APP
npx expo run:android --port 8999
```

Expo will start Metro on port 8999 and invoke Gradle. The `finalizeDsl` block ensures `armeabi-v7a` is stripped even though Expo CLI detects it from the device.

### Clean build

If you hit stale cache issues, clean native build artifacts first:

```powershell
cd Leafy_APP
Remove-Item -Recurse -Force android\app\.cxx, android\app\build, android\build -ErrorAction SilentlyContinue
npx expo run:android --port 8999
```

### Release build

```powershell
cd Leafy_APP/android
./gradlew assembleRelease
```

> Remember to configure signing in `app/build.gradle` before releasing.

---

## 7. Troubleshooting

| Symptom                                                             | Cause                                           | Fix                                                                      |
| ------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `LLVM ERROR: out of memory` during NDK compile                      | 32‑bit clang OOM on `armeabi-v7a`               | Remove `armeabi-v7a` (§2.1)                                              |
| `ninja: error: mkdir(…): No such file or directory`                 | Windows 260‑char path limit                     | Remove `armeabi-v7a` (§2.1)                                              |
| `armeabi-v7a` still compiles after editing `gradle.properties`      | Expo CLI overrides via `-P` flag                | Add `finalizeDsl` block in `build.gradle` (§2.1)                         |
| `NitroModulesProxy.box(): Cannot determine default value of object` | TFLite model is not a NitroModules HybridObject | Remove `NitroModules.box()` — pass model directly (§5)                   |
| Metro doesn't bundle `.tflite` files                                | Missing asset extension                         | Add `config.resolver.assetExts.push("tflite")` in `metro.config.js` (§3) |

---

## 8. Architecture decision record

### Why not just enable Windows long paths?

Windows long‑path support (`LongPathsEnabled` registry key) helps with some tools but **not** all build toolchain components (ninja, CMake). Removing `armeabi-v7a` solves both the path length and the OOM issue simultaneously. Modern Android devices overwhelmingly use `arm64-v8a`.

### Why keep `react-native-nitro-modules` in `package.json`?

Other libraries (e.g. VisionCamera internals) may depend on it. Removing `NitroModules.box()` from our code doesn't mean the package is unused — it's still a transitive dependency for native module bridging.
