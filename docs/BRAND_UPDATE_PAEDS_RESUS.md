# Brand update: ResusGPS → Paeds Resus

**Done:** Platform title and user-facing branding have been updated from "ResusGPS" to "Paeds Resus" across the app.

---

## What was changed

### 1. Page title and meta

- **`client/index.html`**  
  - `<title>` → "Paeds Resus - Real-Time Pediatric Emergency Guidance"  
  - `og:title` → "Paeds Resus - Pediatric Emergency Navigation"  
  - `canonical` → `https://www.paedsresus.com`  
  - `apple-mobile-web-app-title` → "Paeds Resus"

- **`client/public/manifest.json`**  
  - `name` → "Paeds Resus - Clinical Decision Support for Emergencies"  
  - `short_name` → "Paeds Resus"

### 2. Logo and header/footer text

- **Header** (`client/src/components/Header.tsx`): logo `alt` and visible label → "Paeds Resus"
- **Footer** (`client/src/components/Footer.tsx`): logo `alt`, heading, and copyright → "Paeds Resus" / "© {year} Paeds Resus. All rights reserved."
- **DashboardSidebar**: brand label next to logo → "Paeds Resus"

Logo image path is unchanged: **`/paeds-resus-logo.png`** (served from `client/public/paeds-resus-logo.png`).

### 3. User-facing copy

All user-visible "ResusGPS" strings were updated to "Paeds Resus" in:

- Home, ResusGPS landing, InstitutionalOnboarding, Payment  
- ChatWidget, PaedsAIAssistant, ClinicalHeader, GuidedTour, RoleSelectionPrompt  
- FloatingWhatsAppWidget, HealthcareWorkerApp, AdminHub, KaizenDashboard  
- CourseCalculator, Institutional, WhatsAppButton, InstitutionalLeadForm  
- ClinicalAssessment, ClinicalAssessmentGPS, ClinicalAssessmentGPS_backup, ClinicalGPSv2  
- AdminReports  
- Clinical record header in `abcdeEngine.ts` and the corresponding test

### 4. Left unchanged (code/internal)

- **Component and file names** (e.g. `ResusGPS.tsx`, `useResusAnalytics.ts`) — kept for code clarity; ResusGPS remains the product name in the codebase.
- **Comments** that refer to "ResusGPS" as the product (e.g. "ResusGPS State Machine") — left as-is.
- **Offline DB name** (`ResusGPS` in `offlineDB.ts`) — internal only; can be renamed later if desired.

---

## Replacing the logo image

The app uses a single logo file:

- **Path in repo:** `client/public/paeds-resus-logo.png`
- **Referenced as:** `/paeds-resus-logo.png` (in Header, Footer, and DashboardSidebar)

To use a new logo:

1. Create or export your Paeds Resus logo (e.g. PNG, transparent background).
2. Replace `client/public/paeds-resus-logo.png` with the new file (same filename), or update the `src` in Header, Footer, and DashboardSidebar if you use a new filename (e.g. `paeds-resus-logo-2025.png`).
3. Suggested size: at least **160×160 px** for the Header (it’s shown at 40×40), and **64×64** or larger for the Footer (32×32). SVG is not referenced today; if you add one, you’d point the `src` to it.

No code change is needed if you keep the filename `paeds-resus-logo.png`.
