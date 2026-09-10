---
name: Expo audio asset paths
description: Generated raster artwork must be copied into the Expo artifact assets folder before using aliased require paths.
---

Expo Metro resolves static image imports from the app package, not from attached_assets. Generated images should be copied into the artifact's assets/images directory before referencing them with the app alias.

**Why:** A valid TypeScript build can still produce a Metro 500 when a generated file exists only in attached_assets.

**How to apply:** After generating mobile artwork, copy each file into the target Expo artifact before restarting or previewing Metro.