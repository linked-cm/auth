---
summary: >
  `@capacitor/dialog` 7 -> 8 is deferred: we decided not to upgrade Capacitor for now. The
  plugin itself has no API change in 8 (version bump only), but 8 declares a peer of
  `@capacitor/core >=8`, which drags in the Capacitor 8 platform floor (Node 22, Xcode 26,
  iOS 15, Android SDK 36). The only uses are two `Dialog.alert` calls in `CreateNewPasswordForm`,
  so the better outcome is probably to drop the dependency rather than upgrade it.
status: Deferred -- held by the shared Renovate preset; replaces Renovate PR linked-fw/auth#47
---

# 001 — `@capacitor/dialog` 8 is deferred

**Status:** deferred. We decided not to upgrade Capacitor for now. Renovate PR
[#47](https://github.com/linked-fw/auth/pull/47) (`@capacitor/dialog` to v8) is superseded by
this note, and majors of `@capacitor/**` are disabled in
[`linked-fw/renovate-config`](https://github.com/linked-fw/renovate-config) so it does not come
back every Monday. Remove that rule when this is picked up.

## How it is used here

- Declared in `dependencies` as `^7.0.2` -- so every consumer of `@_linked/auth` installs it.
- One file: `src/components/CreateNewPasswordForm.tsx` calls `Dialog.alert(...)` twice, to show
  the server's error (e.g. a wrong current password) and, in the `catch` of the password reset,
  to say "Something went wrong". On the web the plugin falls back to `window.alert`.
- Nothing else in `src/` imports `@capacitor/*`. `@capacitor/core` is not declared here at all,
  although the plugin needs it at runtime (it is a peer of the plugin) -- auth relies on the
  consumer to have it.

## What changes in 8

- `@capacitor/dialog` 8.0.0 is a **version bump only** -- no API change to `Dialog.alert`,
  `confirm` or `prompt` (plugin changelog). 7.0.0 was likewise a version bump.
- Its peer moves from `@capacitor/core >=7.0.0` to `>=8.0.0`. That is the real cost: it forces
  every app that ships auth onto Capacitor 8, which means
  - Node **22+**, Xcode **26+**, iOS deployment target **15.0**;
  - Android `minSdkVersion` 24, `compileSdkVersion`/`targetSdkVersion` **36**, Android Studio
    Otter (2025.2.1+), AGP 8.13.0, Gradle 8.14.3, Kotlin 2.2.20;
  - `android.adjustMarginsForEdgeToEdge` removed (use the System Bars plugin),
    `bridge_layout_main.xml` renamed to `capacitor_bridge_layout_main.xml`, `density` added to
    `configChanges`, and the CLI now creates iOS projects with SPM by default.

  Source: <https://capacitorjs.com/docs/updating/8-0>.

## Recommendation: remove rather than upgrade

A single error alert does not justify a native plugin in `dependencies` of an auth package. Showing
the error inline (the form already has a helper-text pattern) or via `window.alert` would let
auth drop `@capacitor/dialog` entirely, after which this deferral, and the Capacitor coupling it
creates for every consumer, disappears. Not done here -- this note only records the hold.

## When this is picked up

1. Decide first: remove the dependency (above) or upgrade. If removing, delete the
   `@capacitor/**` major hold in `renovate-config` only once the other Capacitor holds
   (`server-utils`, `shape-ui`) are resolved too.
2. If upgrading: confirm every app that consumes `@_linked/auth` is already on Capacitor 8 --
   the peer is enforced by npm and an older core gives `ERESOLVE`.
3. Exercise the password-reset failure path on web, iOS and Android and check the alert still
   shows.
