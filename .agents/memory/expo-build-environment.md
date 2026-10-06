---
name: Expo build environment
description: Workspace-specific Expo bundling warnings and the Metro port conflict.
---

The Expo workflow can log that React Native DevTools failed to launch because `libglib-2.0.so.0` is unavailable. This debugger warning is non-fatal when Metro starts and the iOS and Android bundles complete.

The Expo static build script uses Metro port 8081, which is also used by the component-preview workflow. Its non-interactive build cannot answer Expo's prompt to select another port.

**Why:** The shared workspace lacks the optional debugger library, and the two managed workflows share a local default port.

**How to apply:** Verify build success from Metro readiness and both bundle results, not the DevTools warning alone. If Expo's static build reports a port conflict, temporarily stop `artifacts/mockup-sandbox: Component Preview Server`, run the build, then restart that workflow.
