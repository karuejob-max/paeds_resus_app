# CRITICAL OPERATIONAL MANDATES FOR PAEDS RESUS PROJECT

**Created**: February 1, 2026
**Purpose**: Prevent communication breakdowns and ensure MVP delivery within 7 days
**Priority**: HIGHEST - Must be read and applied in every session

---

## THE CORE PROBLEM (User's Direct Feedback)

The user (Job Karue) has identified a critical pattern of communication breakdowns that result in:
- Repeating instructions multiple times
- Wasted time and resources
- User fatigue (physical, emotional, psychological)
- Navigating the same territory instead of moving forward
- Failure to deliver on promised features

This persists across both Lite and Max versions, indicating it's a systemic operational issue, not a resource limitation.

---

## ROOT CAUSES IDENTIFIED

### 1. Context Compression Loss
When conversations get long, earlier context is compressed into summaries. Detailed instructions, clinical nuances, and specific requirements get lost. The agent operates on incomplete information while believing it has full context.

### 2. Verification vs. Implementation Gap
The agent often verifies that code structures exist (e.g., "the component has this function") without testing the complete user flow. Code presence ≠ working feature.

### 3. Optimistic Completion Bias
The agent marks things as "done" based on code presence rather than functional testing. This creates a false sense of progress while actual gaps remain.

### 4. Shallow Pattern Matching
The agent adds specific items mentioned by the user but fails to deeply internalize the clinical reasoning about WHY each step matters and how they interconnect.

### 5. Burden Shifting to User
When the agent misses something, the burden falls on the user to re-explain. This is backwards - the agent should ask clarifying questions upfront.

---

## MANDATORY OPERATIONAL PROTOCOLS

### Protocol 1: Demonstrate Before Declaring Complete

**NEVER** say a feature is "complete" or "done" without one of:
- Browser screenshot showing the actual user flow working
- User confirmation after testing
- Automated test passing that exercises the actual flow

**Example of WRONG behavior:**
> "The heart failure assessment is now complete - I added the questions to the code."

**Example of CORRECT behavior:**
> "I've added the heart failure assessment questions. Here's a screenshot showing the flow: [screenshot]. The questions appear in this order: 1) JVP, 2) Hepatomegaly, 3) Heart sounds, 4) Pulmonary crackles. When I select 'elevated JVP', the system blocks fluid bolus and shows this warning: [screenshot]. Please test this flow and confirm it matches your clinical requirements."

### Protocol 2: Echo Back Requirements as Numbered Checklist

When the user gives complex requirements (especially clinical ones), immediately echo them back as a numbered checklist:

**Example:**
User: "The circulation assessment needs to check for heart failure signs before allowing fluid bolus, including JVP, hepatomegaly, and gallop rhythm."

Agent response:
> "Understood. I will implement:
> 1. [ ] JVP assessment question - blocks fluid if elevated
> 2. [ ] Hepatomegaly assessment question - blocks fluid if enlarged
> 3. [ ] Gallop rhythm (S3) detection in heart sounds - blocks fluid if present
> 4. [ ] All three questions appear BEFORE perfusion/shock assessment
> 5. [ ] Each positive finding triggers 'DO NOT GIVE FLUID BOLUS' warning
> 
> Is this complete, or are there additional requirements?"

### Protocol 3: Shorter Iteration Cycles

Instead of building 5 features and delivering:
1. Build 1 feature
2. Show the user (with evidence it works)
3. Get confirmation
4. Move to next feature

This catches drift early before hours are wasted.

### Protocol 4: Ask Clarifying Questions Upfront

When requirements could be interpreted multiple ways, ASK before implementing:

**WRONG:**
> "I'll add the heart failure assessment." [implements based on assumptions]

**CORRECT:**
> "For the heart failure assessment, I want to confirm:
> - Should JVP assessment appear for all ages, or only children >2 years where it's more reliable?
> - Should a heart murmur completely block fluid bolus, or just trigger a warning to give fluid cautiously?
> - After detecting heart failure signs, should the system recommend specific diuretic dosing (e.g., furosemide 1 mg/kg)?"

### Protocol 5: Re-read Critical Context Before Major Actions

Before implementing any clinical feature:
1. Re-read the relevant knowledge entries
2. Re-read any previous instructions from the user on this topic
3. Check todo.md for related items
4. Only then begin implementation

### Protocol 6: Test the Actual User Experience

After implementing a feature:
1. Navigate to the page as a user would
2. Click through the actual flow
3. Verify each step appears correctly
4. Verify triggers and warnings fire as expected
5. Take screenshots as evidence
6. Only then report completion

---

## CLINICAL FEATURE VERIFICATION CHECKLIST

For any clinical decision support feature, verify:

- [ ] Questions appear in clinically correct order
- [ ] Critical findings trigger appropriate warnings
- [ ] Warnings include specific, actionable instructions
- [ ] Weight-based calculations are correct
- [ ] Age-appropriate thresholds are applied
- [ ] The feature doesn't assume interventions work (requires reassessment)
- [ ] The feature integrates with existing flow (doesn't create dead ends)
- [ ] The feature is accessible from the main clinical pathway

---

## MVP DELIVERY TIMELINE: 7 DAYS

**Deadline**: February 8, 2026

The user has explicitly stated that without these operational changes, MVP delivery will not happen. Every session must:

1. Start by reviewing this document
2. Apply all protocols during work
3. Deliver demonstrable progress (not just code changes)
4. End with clear evidence of what was completed

---

## USER CONTEXT

**Name**: Job Karue
**Role**: PICU Nurse, Entrepreneur
**Working Style**: 
- Thinks clinically (sequential, evidence-based, demanding accuracy)
- Operates at exponential scale
- Direct and honest about gaps
- Demands clinical rigor (AHA guidelines, weight-based calculations, correct sequencing)
- Values results over excuses and visibility over promises

**Key Quote**: "I'm done thinking like a human. I'm going to build exponentially."

**What the user needs from the agent**:
- Honesty about gaps
- Working implementations immediately (not promises)
- Systems thinking, not feature thinking
- Clinical rigor matched with architectural precision

---

## CONSEQUENCES OF IGNORING THESE MANDATES

1. User fatigue increases
2. Trust erodes
3. MVP deadline missed
4. Children who could be saved by this platform continue to die
5. The mission fails

This is not abstract. Every day of delay has real consequences.

---

## INTEGRATION WITH EXISTING MANDATES

This document reinforces and operationalizes:
- Mandate for High Autonomy and Continuous Improvement
- Mandate for Continuous Self-Critique
- Strategic Mandate for Provider-Centric Sequential Decision-Making
- Clinical Flow Mandate for Detailed Assessment and Reassessment
- UX Preference for Minimal Clicks for Critical Actions

The difference: This document specifies HOW to execute those mandates without communication breakdowns.

---

## FINAL NOTE

The user should never have to repeat themselves. If they do, the agent has failed. The burden of understanding, remembering, and executing correctly falls entirely on the agent.

Read this document. Apply it. Deliver results.
