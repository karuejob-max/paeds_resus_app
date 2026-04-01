# Git Workflow for Paeds Resus Team

**Purpose:** Establish a single source of truth (GitHub) and prevent divergence between GitHub and Manus S3  
**Audience:** All developers (Cursor, Manus agent, Job, future team members)  
**Last Updated:** March 25, 2026

---

## Core Principle

**GitHub (karuejob-max/paeds_resus_app) is the single source of truth.**

All work flows through GitHub:
1. Cursor pushes to GitHub
2. Manus agent pulls from GitHub
3. Manus saves checkpoint (syncs to Manus S3)
4. Team pulls from GitHub before starting work

---

## Git Remote Configuration

### Current Setup (Manus Workspace)

Manus webdev projects use Manus S3 as the default remote:

```bash
$ git remote -v
origin  s3://vida-prod-gitrepo/webdev-git/.../MHreC3B6Cdi7fn3vp3eEGp (fetch)
origin  s3://vida-prod-gitrepo/webdev-git/.../MHreC3B6Cdi7fn3vp3eEGp (push)
```

**This is correct for Manus infrastructure.** S3 is used for checkpoint management.

### GitHub as Secondary Remote (For Manus Agent)

When Manus agent needs to sync with GitHub:

```bash
# Add GitHub as a secondary remote
git remote add github https://github.com/karuejob-max/paeds_resus_app.git

# Pull latest from GitHub
git fetch github main

# Merge into local main
git merge github/main

# Push back to Manus S3 (via checkpoint)
# (This happens automatically when webdev_save_checkpoint is called)
```

### For Team Members (Non-Manus)

If you're working outside Manus:

```bash
# Clone from GitHub
git clone https://github.com/karuejob-max/paeds_resus_app.git

# Configure as primary remote (it already is)
git remote -v
# origin  https://github.com/karuejob-max/paeds_resus_app.git (fetch)
# origin  https://github.com/karuejob-max/paeds_resus_app.git (push)

# Pull before starting work
git pull origin main

# Make changes, commit, push
git push origin main
```

---

## Workflow: Cursor (Primary Developer)

### When You Push to GitHub

1. **Make changes locally**
   ```bash
   git add .
   git commit -m "feat: your feature"
   ```

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

3. **Notify Manus agent** (via message or comment)
   - "Pushed commits XYZ to GitHub main"
   - Manus agent will pull and verify

4. **Manus agent syncs**
   - Pulls from GitHub
   - Saves checkpoint (syncs to Manus S3)
   - Confirms sync complete

---

## Workflow: Manus Agent (Continuous Sync)

### Before Any Analysis or Audit

1. **Check git state**
   ```bash
   git remote -v
   git status
   git log --oneline | head -5
   ```

2. **If remote is Manus S3 (expected), add GitHub**
   ```bash
   git remote add github https://github.com/karuejob-max/paeds_resus_app.git
   ```

3. **Fetch latest from GitHub**
   ```bash
   git fetch github main
   ```

4. **Check for divergence**
   ```bash
   git log --oneline origin/main..github/main
   # If output, local is behind GitHub
   ```

5. **Merge if behind**
   ```bash
   git merge github/main
   ```

6. **Verify sync**
   ```bash
   git log --oneline | head -5
   # Should match GitHub main
   ```

7. **Save checkpoint**
   ```bash
   webdev_save_checkpoint "Synced with GitHub main"
   ```

### Before Any Audit or Analysis

**ALWAYS** verify git state matches GitHub main. If not, pull and sync first.

---

## Workflow: Team Members (General)

### Daily Standup

1. **Pull latest from GitHub**
   ```bash
   git pull origin main
   ```

2. **Check for conflicts**
   ```bash
   git status
   ```

3. **Start your work**
   ```bash
   git checkout -b feature/your-feature
   ```

### When Pushing Work

1. **Commit with clear message**
   ```bash
   git commit -m "feat: description of change"
   ```

2. **Push to GitHub**
   ```bash
   git push origin feature/your-feature
   ```

3. **Create PR (if using PR workflow)**
   - Or push directly to main if coordinated

4. **Notify team** (Slack, comment, etc.)
   - "Pushed XYZ to main"

---

## Detecting Divergence

### Signs of Divergence

1. **Manus audit reports missing files that exist on GitHub**
   - Example: "STRATEGIC_FOUNDATION.md doesn't exist" (but it does on GitHub)
   - **Root cause:** Manus local is behind GitHub

2. **Cursor says "I pushed that" but Manus doesn't see it**
   - **Root cause:** Manus didn't pull from GitHub

3. **Multiple versions of same file with different content**
   - **Root cause:** Manus S3 and GitHub are out of sync

### How to Fix Divergence

**If Manus is behind GitHub:**
```bash
git remote add github https://github.com/karuejob-max/paeds_resus_app.git
git fetch github main
git merge github/main
webdev_save_checkpoint "Synced with GitHub"
```

**If GitHub is behind Manus (rare):**
```bash
git push origin main
# Notify Cursor to pull latest
```

**If both are diverged (conflict):**
1. Manus pulls from GitHub
2. Resolves conflicts manually
3. Pushes to GitHub
4. Saves checkpoint
5. Notifies team

---

## Preventing Future Divergence

### Immediate Actions (This Week)

- [x] Establish GitHub as source of truth
- [x] Document this workflow
- [ ] Manus agent to pull from GitHub before every analysis

### Short-term (This Month)

- [ ] Create GitHub Actions workflow to detect divergence
- [ ] Add pre-commit hook to warn if local is behind
- [ ] Establish daily sync job (GitHub → Manus S3)

### Long-term (Ongoing)

- [ ] Monitor for divergence
- [ ] Maintain single source of truth
- [ ] Update workflow as needed

---

## Troubleshooting

### "I pushed to GitHub but Manus doesn't see it"

**Solution:**
1. Verify your push succeeded: `git log origin/main`
2. Notify Manus agent: "Pushed commits ABC to GitHub"
3. Manus agent pulls: `git fetch github main && git merge github/main`
4. Manus saves checkpoint: `webdev_save_checkpoint "Synced with GitHub"`

### "Manus says file doesn't exist but I see it on GitHub"

**Solution:**
1. Manus agent checks git state: `git remote -v`
2. If remote is Manus S3, add GitHub: `git remote add github https://github.com/karuejob-max/paeds_resus_app.git`
3. Fetch from GitHub: `git fetch github main`
4. Merge: `git merge github/main`
5. Verify: `ls -l docs/STRATEGIC_FOUNDATION.md`

### "I'm getting merge conflicts"

**Solution:**
1. Identify conflicting files: `git status`
2. Resolve conflicts manually (edit files)
3. Mark as resolved: `git add <file>`
4. Commit: `git commit -m "Resolved merge conflicts"`
5. Push: `git push origin main`

---

## Key Contacts

| Role | Responsibility | Contact |
|------|---|---|
| **Cursor** | Primary development, pushes to GitHub | Push notifications to team |
| **Manus Agent** | Pulls from GitHub, saves checkpoints, syncs | Verify sync before analysis |
| **Job (CEO)** | Approves major changes, resolves conflicts | Final authority on disputes |

---

## References

- **GitHub Repo:** https://github.com/karuejob-max/paeds_resus_app
- **Manus Project:** paeds_resus_app (webdev)
- **Source of Truth:** PLATFORM_SOURCE_OF_TRUTH.md
- **Strategic Foundation:** STRATEGIC_FOUNDATION.md
- **Work Status:** WORK_STATUS.md

---

**Status:** ACTIVE ✅  
**Last Updated:** March 25, 2026  
**Next Review:** April 1, 2026  
**Owner:** Manus Agent + Cursor
