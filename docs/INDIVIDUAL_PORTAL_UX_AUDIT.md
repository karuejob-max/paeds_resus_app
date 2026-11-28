# Individual portal UX audit (2026-11-28)

Scope reviewed: provider dashboard, header and bottom navigation, licence flow, checkout. Not yet reviewed: onboarding after sign-up, course player, certificates, Care Signal and Code Signal entry, parent portal.

## Fixed
- Licence flow: status banner, short form, Kenya preset, reviewer notes visible, renewals keep duty status (PR X).
- Checkout shows the live price and offer (PR W).
- Dashboard: the next step for each course ("Continue learning", "Book hands-on session", "View certificate") is visible without opening a toggle. The six-link "five-part system" strip no longer sits above the working content; it is an "Explore the rest of Paeds Resus" disclosure at the bottom (PR Z).

## Still open (in priority order)
1. Navigation has about 12 items for providers with programme acronyms (NERP, IERP) that new users cannot decode. Group into Today, Learn, Safety, Records and use plain names with the acronym in brackets.
2. Two similar safety reporters (Care Signal, Code Signal) sit side by side with no one-line explanation of when to use which.
3. Dashboard still stacks up to nine duty cards before learning. Collapse them into one "On duty" section that shows only when the person has a duty role.
4. Dashboard copy mixes "Cognitive modules", "Phase 2" and "Practical skills". Use "Online learning" and "Hands-on session" everywhere.
5. Review the first-run path (sign-up, choose role, first screen) with a real new user. Screen recordings of two or three new CHM staff would find more than reading code.

## Correction (PR AA)
`ProviderDashboard.tsx` is not routed anywhere. Signing in lands on `/home` (`Home` -> `ProviderToday`). The licence card (PR U) and the next-step buttons (PR Z) were built on the unrouted page and were never visible. PR AA puts the licence task into the real Today action queue. `ProviderDashboard.tsx` should be deleted or routed in a separate clean-up, after checking nothing else needs it.
