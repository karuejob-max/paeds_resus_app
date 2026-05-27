# CPR Contract Documentation

## Canonical Path
The canonical path for CPR session management is through the `cprSession` router.

### Router: `cprSession`
- **Location**: `server/routers/cpr-session.ts`
- **Status**: Active / Recommended
- **Key Procedures**:
  - `createSession`: Initialize a new CPR session.
  - `logEvent`: Record CPR events (compressions, medications, etc.).
  - `endSession`: Finalize the session and record outcome.

## Legacy Path
The `cprClock` router is now considered legacy and is gated for writes.

### Router: `cprClock`
- **Location**: `server/routers/cprClock.ts`
- **Status**: Legacy / Deprecated
- **Gating**: All write mutations (`startSession`, `endSession`, `logEvent`, `logMedication`, `logDefibrillation`) are blocked unless the environment variable `CPR_CLOCK_LEGACY_WRITE_ENABLED` is set to `true`.
- **Reason**: Transitioning to unified `cprSession` architecture for better team sync and event orchestration.

## Client entry (Phase 0)
- **ResusGPS** opens `CPRClockUnified` (solo/streamlined default) with shared `cpr-engine.ts` timing/dosing.
- **Life-support pack** routing: `client/src/lib/resus/cpr-pack-resolver.ts` (PALS / ACLS / NRP).
- **Team join URL**: `/join-cpr/:sessionCode` → `JoinSession.tsx`.

## Enforcement
- **Server-side**: Middleware `legacyWriteGate` in `cprClock.ts`.
- **Client-side**: All new features must use `trpc.cprSession.*`. ResusGPS canonical CPR UI is `CPRClockUnified`, not `CPRClockTeam` alone.
