# Git Setup & Sync Instructions

**For: All team members (Cursor, Manus, Job, future developers)**  
**Purpose: Ensure everyone is working from the same source of truth (GitHub)**  
**Last Updated: March 25, 2026**

---

## Quick Start

### If You're Cursor (Primary Developer)

```bash
# Your workflow
git add .
git commit -m "feat: your change"
git push origin main

# Notify team: "Pushed commits XYZ to GitHub"
```

### If You're Manus Agent

```bash
# Before any analysis or audit
./scripts/sync-with-github.sh

# After sync
webdev_save_checkpoint "Synced with GitHub main"
```

### If You're a Team Member

```bash
# Start of day
git pull origin main

# Do your work
git add .
git commit -m "feat: your change"
git push origin main

# Notify team
```

---

## Documentation Map

**Read these in order:**

1. **PLATFORM_SOURCE_OF_TRUTH.md** (56 lines)
   - What: Canonical platform decisions
   - Why: Single source of truth for architecture
   - When: Before making any platform-level decisions

2. **STRATEGIC_FOUNDATION.md** (20.8 KB)
   - What: Strategic context and mission
   - Why: Understand why we're building this
   - When: Before starting major features

3. **WORK_STATUS.md**
   - What: Current execution status
   - Why: Know what's done and what's next
   - When: Daily standup, sprint planning

4. **GIT_WORKFLOW_FOR_TEAM.md** (this folder)
   - What: How to collaborate via git
   - Why: Prevent divergence, stay in sync
   - When: When joining team or pushing code

5. **GIT_STATE_RECONCILIATION.md** (this folder)
   - What: Why local state was stale, how we fixed it
   - Why: Learn from past issues
   - When: If you encounter divergence

---

## The Problem We Solved

**Issue:** Manus agent's local git state was pointing to Manus S3, not GitHub  
**Impact:** Audits reported missing files that actually existed on GitHub  
**Solution:** Established GitHub as primary source, created sync workflow  

**Result:** Everyone now pulls from GitHub, Manus saves checkpoints to sync

---

## Key Principles

1. **GitHub is the source of truth** - All work flows through GitHub
2. **Manus S3 is a working copy** - Used for development, synced via checkpoints
3. **Always sync before analysis** - Manus agent runs sync script before any audit
4. **Notify on push** - Tell team when you push to GitHub so they can sync
5. **Pull before starting** - Always `git pull origin main` before starting work

---

## Sync Workflow

### Cursor Pushes to GitHub
```
Cursor: git push origin main
Cursor: "Pushed commits ABC to GitHub"
```

### Manus Agent Syncs
```
Manus: ./scripts/sync-with-github.sh
Manus: git status (verify sync)
Manus: webdev_save_checkpoint "Synced with GitHub"
```

### Team Pulls Latest
```
Team: git pull origin main
Team: Continue with work
```

---

## Troubleshooting

### "Manus says file doesn't exist but I see it on GitHub"

**Cause:** Manus local is behind GitHub  
**Fix:**
```bash
./scripts/sync-with-github.sh
```

### "I pushed to GitHub but Manus doesn't see it"

**Cause:** Manus hasn't synced yet  
**Fix:**
1. Notify Manus: "Pushed commits XYZ to GitHub"
2. Wait for Manus to run sync script
3. Verify: `git log --oneline | head -5`

### "Merge conflicts when syncing"

**Cause:** Both Manus and GitHub have conflicting changes  
**Fix:**
1. Resolve conflicts manually
2. `git add .`
3. `git commit -m "Resolved merge conflicts"`
4. `webdev_save_checkpoint "Resolved conflicts with GitHub"`

---

## For New Team Members

1. **Clone from GitHub**
   ```bash
   git clone https://github.com/karuejob-max/paeds_resus_app.git
   cd paeds_resus_app
   ```

2. **Read documentation in order**
   - PLATFORM_SOURCE_OF_TRUTH.md
   - STRATEGIC_FOUNDATION.md
   - WORK_STATUS.md

3. **Pull latest**
   ```bash
   git pull origin main
   ```

4. **Start working**
   ```bash
   git checkout -b feature/your-feature
   ```

---

## References

- **GitHub Repo:** https://github.com/karuejob-max/paeds_resus_app
- **Sync Script:** `./scripts/sync-with-github.sh`
- **Git Workflow:** `docs/GIT_WORKFLOW_FOR_TEAM.md`
- **Reconciliation:** `docs/GIT_STATE_RECONCILIATION.md`

---

**Status:** ACTIVE ✅  
**Owner:** Manus Agent + Cursor  
**Last Sync:** March 25, 2026
