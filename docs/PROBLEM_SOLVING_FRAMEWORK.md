# Systematic Problem-Solving Framework

## Philosophy

This framework is based on clinical diagnostic methodology from pediatric emergency medicine. Just as a child presenting with cough and fever requires systematic assessment before jumping to conclusions, software problems require a disciplined, hierarchical approach to diagnosis and resolution.

**Core Principle:** The simplest explanation that fits the facts is usually correct. Check the foundation before investigating logic.

---

## The Diagnostic Hierarchy

When facing any problem, investigate in this order. **Do not skip steps.** Do not go deep into one layer before confirming the layers below it are sound.

### Layer 1: Infrastructure (Is It Even On?)

**Question:** Is the system/service/database actually available and running?

**Check:**
- [ ] Is the service powered on? (Database, API, server, etc.)
- [ ] Is the service allocated/provisioned? (Aiven project active, AWS instance running, etc.)
- [ ] Is the service responding to basic health checks?
- [ ] Are all required dependencies running? (Redis, database, message queue, etc.)

**Why this matters:** The Aiven database was powered off for a week. We investigated code and schema instead of checking if the database was reachable. This is the most foundational layer.

**Clinical parallel:** Check if the child is breathing before investigating why the lungs sound abnormal.

---

### Layer 2: Connectivity (Can We Reach It?)

**Question:** Can the system reach the service it needs to reach?

**Check:**
- [ ] Is the network accessible? (VPN, firewall, security groups)
- [ ] Are ports open and listening?
- [ ] Is DNS resolving correctly?
- [ ] Can you ping/curl the service from the client?
- [ ] Are credentials/API keys valid?
- [ ] Is the service endpoint correct?

**Why this matters:** A service can be running but unreachable due to network configuration. A database can be powered on but inaccessible due to firewall rules.

**Clinical parallel:** The child's heart might be working, but blood might not be reaching the lungs due to a structural problem.

---

### Layer 3: Configuration (Is It Set Up Right?)

**Question:** Is the system configured correctly to use the service?

**Check:**
- [ ] Are environment variables set correctly?
- [ ] Are connection strings valid?
- [ ] Are API endpoints pointing to the right place?
- [ ] Are authentication credentials correct?
- [ ] Are feature flags/toggles in the right state?
- [ ] Is the system pointed at the right environment (dev/staging/prod)?

**Why this matters:** A service can be reachable but misconfigured. A database can be accessible but the connection string can be wrong.

**Clinical parallel:** The child's lungs might be working, but the breathing tube might be placed in the esophagus instead of the trachea.

---

### Layer 4: Data/State (Is the Data There?)

**Question:** Is the data in the expected place, format, and state?

**Check:**
- [ ] Does the data exist? (Record in database, file on disk, etc.)
- [ ] Is the data in the expected format?
- [ ] Are permissions correct? (Can the user access the data?)
- [ ] Is the data fresh or stale?
- [ ] Are there race conditions or timing issues with state updates?
- [ ] Is the state being persisted correctly?

**Why this matters:** A database can be accessible but the data might not be there, or it might be in the wrong state. React state can be updated but not available when the component first renders.

**Clinical parallel:** The child's airways might be clear, but there might be milk in them (aspiration). The diagnosis was "cardiac," but the acute problem was "aspirated milk."

---

### Layer 5: Business Logic (Does the Code Do What It Should?)

**Question:** Does the code correctly implement the intended behavior?

**Check:**
- [ ] Is the algorithm correct?
- [ ] Are edge cases handled?
- [ ] Is the code following the expected execution order?
- [ ] Are there timing issues? (React lifecycle, async/await, promises)
- [ ] Are there off-by-one errors, null checks, type mismatches?
- [ ] Is performance acceptable?

**Why this matters:** This is where most developers start investigating. But if the layers below are unsound, fixing the logic won't help.

**Clinical parallel:** The child's heart rhythm might be normal, but the child might still be in respiratory distress due to aspiration.

---

## The Diagnostic Process

### Step 1: Gather Information

- What is the symptom? (Error message, unexpected behavior, missing data, etc.)
- When did it start? (After a deployment? After a configuration change? Intermittently?)
- What changed recently? (Code, configuration, infrastructure, data?)
- Can you reproduce it? (Consistently? Under specific conditions?)

### Step 2: Form Initial Hypothesis

Based on the symptom and context, form an initial hypothesis. But **keep it humble**—this is your first guess, not your diagnosis.

Example: "The user can't log in. Hypothesis: Authentication service is down."

### Step 3: Test the Hypothesis (Start at Layer 1)

**Do not skip layers.** Test in order:

1. **Infrastructure:** Is the auth service running? Can you see it in your monitoring dashboard?
2. **Connectivity:** Can you reach the auth service from the client? Can you curl it?
3. **Configuration:** Are the credentials correct? Is the endpoint configured right?
4. **Data/State:** Is the user record in the database? Is the password hash correct?
5. **Logic:** Is the authentication code correct?

### Step 4: Verify Your Findings

Once you identify the problem, verify it:
- [ ] Can you reproduce the issue before the fix?
- [ ] Does the fix resolve the issue?
- [ ] Are there side effects or new issues introduced?

### Step 5: Document and Learn

- [ ] What was the root cause?
- [ ] Why wasn't it caught earlier?
- [ ] How can we prevent this in the future?
- [ ] What assumptions did we make that were wrong?

---

## Real-World Examples

### Example 1: The Aiven Database (Infrastructure Layer)

**Symptom:** "Users can't log in. Database connection error."

**Wrong approach:** Investigate authentication code, database schema, SQL queries.

**Right approach:**
1. **Infrastructure:** Is the Aiven project powered on? → NO → Power it on → Problem solved.

**Lesson:** The simplest explanation was correct. The database wasn't reachable because it wasn't powered on.

---

### Example 2: The React Navigation Bug (Data/State Layer)

**Symptom:** "Institutional users can't access the Healthcare Provider platform. Role button shows 'Provider' but page stays on institutional dashboard."

**Wrong approach:** Investigate route guards, service workers, navigation code, deployment caching.

**Right approach:**
1. **Infrastructure:** Is the app running? → YES
2. **Connectivity:** Can the app reach the routes? → YES
3. **Configuration:** Are routes configured correctly? → YES
4. **Data/State:** Is the role state updating correctly? → NO → The Home component was rendering before the role state updated from localStorage → Fix the state initialization → Problem solved.

**Lesson:** The problem was a timing issue with state updates, not a navigation issue. We were investigating the wrong layer.

---

### Example 3: The Aspiration Pneumonia (Data/State Layer)

**Symptom:** "2-month-old with VSD in respiratory distress. Being referred to pediatric cardiologist."

**Wrong approach:** Accept the diagnosis. The child has a cardiac condition. Investigate cardiac causes.

**Right approach:**
1. **Infrastructure:** Is the child breathing? → YES, but grunting
2. **Connectivity:** Is oxygen reaching the lungs? → Unclear, need to assess
3. **Configuration:** Is the airway patent? → Need to check
4. **Data/State:** What's in the airway? → Milk (aspiration) → Intubate and suction → Problem solved.

**Lesson:** The diagnosis was real (VSD), but it was a red herring. The acute problem was aspiration. We had to ask: "What's happening RIGHT NOW?" not "What does the diagnosis tell us?"

---

## Applying This Framework

### For Manus (the AI Agent)

When debugging or solving a problem:

1. **Never assume the diagnosis is complete.** Always verify the root cause.
2. **Check the foundation first.** Is the service powered on? Can we reach it? Is it configured right?
3. **Trace the sequence of events.** What happens first? What happens next? What's the exact order?
4. **Challenge assumptions.** "I think it's X, but what if it's actually Y?"
5. **Apply Occam's Razor.** The simplest explanation is usually right.

### For the Team

When reporting a bug or problem:

1. **Describe the symptom, not your diagnosis.** "The page doesn't load" not "The route guard is broken."
2. **Provide context.** When did it start? What changed? Can you reproduce it?
3. **Challenge the diagnosis.** If the investigation seems to be going deep into logic without checking basics, ask: "Have we checked if the service is powered on?"

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Diagnosis Fixation

**What it is:** You form a diagnosis and stop looking. Every new symptom is explained by the diagnosis.

**Example:** "The child has a cardiac condition" → Every symptom is cardiac → Miss the aspiration pneumonia.

**How to avoid it:** Regularly ask: "Does the evidence still support this diagnosis? What if I'm wrong?"

### Anti-Pattern 2: Jumping to Logic

**What it is:** You skip layers 1-4 and go straight to investigating business logic.

**Example:** "The database query is wrong" → Spend hours optimizing queries → Miss that the database isn't powered on.

**How to avoid it:** Always start at layer 1. Ask: "Is the service even running?"

### Anti-Pattern 3: Assumption-Driven Debugging

**What it is:** You assume something is true without verifying it.

**Example:** "The role state must be updating" → Don't verify → Miss the timing issue.

**How to avoid it:** Verify every assumption. Add logging. Trace the execution order.

### Anti-Pattern 4: Ignoring the Obvious

**What it is:** You overlook simple explanations because they seem too obvious.

**Example:** "The database must be a complex schema issue" → Miss that it's powered off.

**How to avoid it:** Apply Occam's Razor. The simplest explanation is usually right.

---

## Checklist for Every Problem

Use this checklist every time you encounter a problem:

- [ ] **Symptom:** What is the exact symptom? (Not the diagnosis, the symptom.)
- [ ] **Context:** When did it start? What changed? Can you reproduce it?
- [ ] **Infrastructure:** Is the service running? Is it allocated? Is it responding?
- [ ] **Connectivity:** Can you reach the service? Are ports open? Are credentials valid?
- [ ] **Configuration:** Are environment variables correct? Is the endpoint right? Are feature flags correct?
- [ ] **Data/State:** Is the data there? Is it in the right format? Are permissions correct?
- [ ] **Logic:** Is the code correct? Are edge cases handled? Are there timing issues?
- [ ] **Verification:** Can you reproduce the issue before the fix? Does the fix work? Are there side effects?
- [ ] **Documentation:** What was the root cause? Why wasn't it caught earlier? How do we prevent it?

---

## References

- **Occam's Razor:** The simplest explanation that fits the facts is usually correct.
- **Clinical Diagnostic Methodology:** Start with the most likely, most dangerous condition. Treat empirically while investigating.
- **Systematic Problem-Solving:** Check the foundation before investigating logic.

---

## Version History

- **v1.0** (2026-04-03): Initial framework based on clinical diagnostic methodology and lessons learned from institutional user navigation bug and Aiven database incident.
