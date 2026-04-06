# Staging Verification Checklist: ResusGPS Analytics Features

**Date:** 2026-04-06  
**Features:** ResusGPS completion handler, Fellowship progress UI, Condition heatmap + CSV export  
**Environment:** Staging (develop branch)  

---

## Pre-Deployment Checklist

### Database & Migrations
- [ ] Migration 0031 applied (careSignalEvents table exists)
- [ ] resusSessionRecords table created and indexed
- [ ] analyticsEvents schema updated with resusGps_session_completed event type
- [ ] Test data seeded (5+ sample sessions per condition)

### Backend API
- [ ] `resusSessionAnalytics.recordSession` endpoint responds correctly
- [ ] `fellowshipPathways.getUserProgress` returns X/27 conditions
- [ ] `fellowshipPathways.getInstitutionHeatmap` returns facility patterns
- [ ] `fellowshipPathways.getPathwayMapping` returns condition mappings
- [ ] All tRPC procedures have proper error handling

### Frontend Components
- [ ] FellowshipProgressCard renders without errors
- [ ] ConditionHeatmap renders without errors
- [ ] CSV export button appears and is clickable
- [ ] Mobile responsiveness: all components render on 375px width (iPhone SE)
- [ ] Tablet responsiveness: all components render on 768px width (iPad)

### Integration Flow
- [ ] ResusGPS.tsx calls recordSession on export
- [ ] ResusGPS.tsx calls recordSession on new case (if >60s, >3 interactions)
- [ ] FellowshipProgressCard queries progress after session recorded
- [ ] ConditionHeatmap queries facility data correctly
- [ ] Analytics events appear in admin reports within 30s

---

## Manual Testing Workflow

### 1. Test ResusGPS Session Recording
```bash
# Steps:
1. Log in as provider (healthcare provider role)
2. Navigate to ResusGPS
3. Start a session (e.g., Septic Shock pathway)
4. Interact with at least 3 elements (e.g., select findings, choose interventions)
5. Wait >60 seconds
6. Click "Export Clinical Record"
7. Verify blue banner: "Recording session for fellowship tracking..."
8. Check browser console for recordSession call
```

**Expected Result:**
- Session recorded to resusSessionRecords
- analyticsEvent created with type "resusGps_session_completed"
- No errors in browser console
- Export still works (clinical record downloaded)

### 2. Test Fellowship Progress Card
```bash
# Steps:
1. Log in as provider
2. Navigate to /home
3. Scroll to Fellowship Progress section
4. Verify card displays X/27 conditions
5. Click "Achieved" tab
6. Verify completed conditions show with green checkmark
7. Click "In Progress" tab
8. Verify partial conditions show with progress (e.g., 2/3)
9. Click "All" tab
10. Verify all 27 conditions visible in grid
```

**Expected Result:**
- Card loads without errors
- Tabs switch smoothly
- Completed conditions ≥ recorded sessions
- Progress percentages accurate
- Mobile: card responsive on 375px width

### 3. Test Condition Heatmap
```bash
# Steps:
1. Log in as admin
2. Navigate to /admin/analytics
3. Click "ResusGPS Analytics" tab
4. Verify heatmap displays facility data
5. Check key metrics (conditions tracked, avg providers, avg duration)
6. Scroll to bar chart
7. Verify chart renders with top conditions
8. Scroll to "Top 5 Practiced Conditions" table
9. Verify conditions sorted by session count
10. Scroll to "Training Gaps" section
11. Verify conditions with 0 sessions listed
12. Click "Export CSV" button
13. Verify CSV file downloads
14. Open CSV and verify data accuracy
```

**Expected Result:**
- Heatmap loads without errors
- Chart renders correctly
- CSV exports with all conditions
- CSV headers: Condition, Sessions, Providers, Avg Duration, Last Practiced, Days Since, Trend
- Mobile: heatmap responsive on 375px width

### 4. Test Mobile Responsiveness (375px width)
```bash
# Steps (use Chrome DevTools):
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set viewport to 375x667 (iPhone SE)
4. Navigate to /home
5. Scroll through Fellowship Progress Card
6. Verify all text readable
7. Verify tabs don't overflow
8. Verify grid adjusts to 2 columns
9. Navigate to /admin/analytics
10. Click ResusGPS Analytics tab
11. Verify heatmap metrics stack vertically
12. Verify chart height reduced appropriately
13. Verify Export CSV button full-width
14. Scroll through all sections
```

**Expected Result:**
- No horizontal scrolling
- All text readable (no text cutoff)
- Buttons clickable (touch-friendly size)
- Icons scale appropriately
- Tabs use abbreviated text on mobile

### 5. Test Tablet Responsiveness (768px width)
```bash
# Steps:
1. Set viewport to 768x1024 (iPad)
2. Navigate to /home
3. Verify Fellowship Progress Card displays in 2-column grid (All tab)
4. Navigate to /admin/analytics
5. Verify heatmap metrics display in 3-column grid
6. Verify chart renders full-width
7. Verify Export CSV button inline with metrics
```

**Expected Result:**
- All content visible without horizontal scroll
- Grid adjusts to 3 columns (md breakpoint)
- Chart height optimized for tablet

### 6. Test CSV Export Data
```bash
# Steps:
1. Export CSV from ConditionHeatmap
2. Open in Excel/Google Sheets
3. Verify headers: Condition, Sessions, Providers, Avg Duration (min), Last Practiced, Days Since, Trend
4. Verify data rows match heatmap display
5. Verify numeric columns are numbers (not text)
6. Verify date format consistent
7. Verify no special characters causing encoding issues
```

**Expected Result:**
- CSV opens correctly in Excel
- All columns present
- Data matches UI display
- No encoding errors

---

## Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| FellowshipProgressCard load time | <500ms | __ |
| ConditionHeatmap load time | <1000ms | __ |
| CSV export time | <2000ms | __ |
| ResusGPS recordSession call | <1000ms | __ |
| Analytics event appears in admin | <30s | __ |

---

## Error Handling Tests

### Test 1: No Sessions Recorded
```bash
# Steps:
1. Create new test user (no sessions)
2. Navigate to /home
3. Verify FellowshipProgressCard shows 0/27 conditions
4. Verify "No conditions with minimum cases yet" message
```

**Expected Result:**
- Card displays gracefully
- No errors
- Clear message to user

### Test 2: No Institution Data
```bash
# Steps:
1. Log in as admin without institution
2. Navigate to /admin/analytics
3. Click ResusGPS Analytics tab
4. Verify message: "No institution associated with your account"
```

**Expected Result:**
- Heatmap displays error message
- No console errors

### Test 3: CSV Export with Empty Data
```bash
# Steps:
1. Create facility with 0 sessions
2. Export CSV
3. Verify CSV contains headers only
```

**Expected Result:**
- CSV exports successfully
- Headers present
- No data rows

### Test 4: Long Condition Names
```bash
# Steps:
1. Verify condition names don't overflow in heatmap table
2. Check mobile view (375px)
3. Verify text truncates with ellipsis
```

**Expected Result:**
- Text truncates gracefully
- Hover tooltip shows full name (if implemented)

---

## Regression Tests

### Test 1: ResusGPS Still Works
```bash
# Steps:
1. Complete full ResusGPS session (all phases)
2. Export clinical record
3. Verify PDF downloads correctly
4. Verify session data in export
```

**Expected Result:**
- ResusGPS functionality unchanged
- Export still works
- No performance degradation

### Test 2: Admin Reports Still Work
```bash
# Steps:
1. Navigate to /admin/analytics
2. Click "Overview" tab
3. Verify all existing reports display
4. Verify charts render
```

**Expected Result:**
- Overview tab works as before
- No data loss
- Charts render correctly

### Test 3: Home Dashboard Still Works
```bash
# Steps:
1. Log in as provider
2. Navigate to /home
3. Verify ResusGPS card displays
4. Verify other cards display (courses, etc.)
5. Verify no layout shifts
```

**Expected Result:**
- All cards render
- No overlapping
- Layout stable

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | __ | __ | [ ] Pass / [ ] Fail |
| Backend Lead | __ | __ | [ ] Pass / [ ] Fail |
| Frontend Lead | __ | __ | [ ] Pass / [ ] Fail |
| Product Manager | __ | __ | [ ] Pass / [ ] Fail |

---

## Known Issues & Workarounds

| Issue | Severity | Workaround | Status |
|-------|----------|-----------|--------|
| | | | |

---

## Deployment Notes

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsiveness verified
- [ ] CSV export tested
- [ ] Ready for production deployment

**Deployment Date:** __________  
**Deployed By:** __________  
**Verified By:** __________  
