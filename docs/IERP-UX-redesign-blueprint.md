# IERP UX Redesign Blueprint

## Executive position

The current IERP experience is not fundamentally broken in its architecture. It is **over-explaining before it starts guiding**. A first-time intern sees a serious programme, but not an immediately obvious answer to the most important question:

> “What is my next safe step, and what will happen after I take it?”

IERP should feel less like a marketing landing page and more like a **calm clinical command centre**. The learner should enter, understand the destination, see where they are, and receive one unmistakable next action. The interface should communicate competence, structure, and safety without making the learner decode the programme.

This proposal changes only **UX, visual hierarchy, copy, spacing, component composition, and interaction emphasis**. It does not change routes, APIs, database models, entitlements, payment rules, clinical gates, or the existing three-phase architecture.

## 1. First-time learner mental model

An intern who has never heard of IERP is likely trying to answer five questions in sequence:

| Question in the learner’s mind | What the interface must answer immediately |
|---|---|
| Is this for me? | “IERP is for healthcare interns beginning supervised clinical practice.” |
| What do I receive? | “A structured route through Paeds Resus BLS, AHA ACLS, simulations, and hands-on assessment.” |
| What do I do first? | “Create your individual intern profile and submit your deployment evidence.” |
| What will it cost and when do I pay? | “The full programme fee is KES 15,000. Payment timing depends on the start window shown for your account.” |
| What happens after I start? | “BLS first, ACLS next, then evidence, simulations, and hands-on assessment.” |

The current page answers most of these questions, but distributes them across a dark hero, an at-a-glance checklist, three cards, a payment paragraph, and a second call to action. The learner must assemble the journey mentally. The redesign should make the journey visible before the learner has to read deeply.

## 2. Recommended visual direction: “clinical command centre”

The visual identity should be **quiet, structured, and operational** rather than dramatic. The learner is preparing for high-pressure clinical work; the interface should reduce cognitive load rather than create another high-energy promotional environment.

| Design element | Recommended direction | Reason |
|---|---|---|
| Base canvas | Warm white or very light slate background | Creates a readable workspace and makes status colours meaningful |
| Primary text | Deep navy or charcoal | Better long-form readability than white text over gradients |
| Primary accent | Teal | Communicates progression, safety, and competence without looking like a warning |
| Action accent | Amber used only for the one primary action or payment attention | Creates attention without turning the entire page into a sales banner |
| Completion | Emerald | Strong, calm confirmation of progress |
| Locked state | Neutral slate with a short explanation | Avoids making normal prerequisites feel like failure |
| Error or hard lock | Red only for an active block, rejected evidence, or overdue payment | Preserves the meaning of danger colours |
| Cards | Fewer, larger, flatter cards with generous spacing | Makes the page feel like a guided workspace rather than a catalogue |
| Background treatment | Remove or reduce the large dark gradient and glassmorphism | The content, not the decoration, should establish trust |
| Typography | One strong headline, short paragraphs, visible labels, generous line height | Supports scanning by tired or distracted learners |

The page should resemble a well-designed hospital control panel: **clear zones, obvious status, no visual noise**. The design should not resemble a generic online-course marketplace.

## 3. Public IERP page: proposed structure

### 3.1 The first screen should be a decision screen

The first viewport should contain four items only: programme identity, learner outcome, programme facts, and the primary action.

**Recommended hero copy:**

> **IERP — Intern Emergency Readiness Program**  
> Build the knowledge, team habits, and practical readiness required for safer paediatric emergencies during internship.

Under the headline, use a compact fact row:

| Fact | Suggested presentation |
|---|---|
| Audience | Healthcare interns |
| Route | BLS → ACLS → simulations → hands-on assessment |
| Programme fee | KES 15,000 total |
| First step | Individual intern profile |

The primary button should read **“Check eligibility and start”** rather than “Start IERP.” “Start IERP” is short but ambiguous: it does not tell a new visitor whether it starts a profile, payment, or course. The secondary action should be **“See the 3-step journey”** rather than “See how it works.” The latter is generic; the former reduces uncertainty.

The payment timing should appear as a short, calm note directly below the primary action:

> **Payment timing:** Your account will show whether you may begin the early learning stages before payment or must pay the full fee first.

Do not put the full August–November/December rule in the hero. It is important, but it is a decision detail that should appear in the payment section and in the authenticated journey. The first screen should establish confidence, not make the learner perform calendar interpretation.

### 3.2 Replace “IERP at a glance” with “What you will complete”

The current checklist contains useful boundaries, but it reads like internal policy. Replace it with four outcome tiles:

1. **Learn** — Complete the BLS and ACLS cognitive pathway.
2. **Prove** — Submit the two required AHA evidence certificates.
3. **Rehearse** — Complete the named roles and confirmed online simulations.
4. **Demonstrate** — Progress to the hands-on assessment when the gates are satisfied.

Each tile should contain one sentence and no more than one secondary link. Move statements such as “IERP activity does not grant IERS institutional permissions” into a small **Programme boundaries** disclosure near the bottom. It is a valid safeguard, but it should not compete with the learner’s first decision.

### 3.3 Show the journey as a route, not a grid of explanations

The three phases should appear as a connected horizontal route on desktop and a vertical route on mobile:

| Phase | Learner-facing title | What the learner does | What unlocks next |
|---|---|---|---|
| 1 | **Build your foundation** | Complete BLS, then ACLS cognitive learning and submit the two AHA evidence certificates | Online simulations |
| 2 | **Practise as a team** | Complete confirmed team-leader and team-member roles | Hands-on assessment eligibility |
| 3 | **Demonstrate readiness** | Complete the practical assessment | Programme completion and certification status |

The technical labels “Phase 1,” “Phase 2,” and “Phase 3” may remain as small metadata, but the learner should first see an action-oriented phrase. “Cognitive foundation” is accurate but abstract. “Build your foundation” is easier to understand on first exposure.

Each phase card should contain a single status treatment: **Not started**, **In progress**, **Ready for you**, **Complete**, or **Locked until [specific prerequisite]**. Avoid mixing a percentage, a paragraph, a lock icon, and multiple competing instructions in the same small card.

### 3.4 Move payment into a dedicated confidence section

Payment should be visible but not visually dominate the learning promise. Use one dedicated section titled **“How payment works”** with three short steps:

1. **See your account rule** — The system shows whether your start window allows early access.
2. **Track your balance** — Your payment ledger shows paid amount and remaining balance.
3. **Clear the programme fee before hands-on assessment** — Phase 3 remains gated until the payment requirement is satisfied.

The detailed calendar rule can appear under an expandable explanation titled **“Why does the payment timing depend on my start date?”** This keeps the safeguard transparent without forcing every visitor to read a policy paragraph before deciding whether IERP is relevant.

### 3.5 End with one decision, not another sales banner

The bottom of the public page should repeat the primary action once, using the same label: **“Check eligibility and start.”** Avoid a second different phrase such as “Ready to begin?” followed by another “Start IERP” button. Consistent labels reduce hesitation and make the page feel intentional.

## 4. Enrolled IERP experience: the dashboard should become the command centre

Once a learner has enrolled, the marketing page should stop behaving like a brochure. The top of the authenticated experience should change to:

> **Your IERP journey**  
> **Next step: Start BLS cognitive learning**

The learner should see the next action before the percentage.

### 4.1 Recommended enrolled layout

| Zone | Content | Visual priority |
|---|---|---|
| Top status bar | “You are on IERP” + current phase + small payment status | Medium |
| Next-action panel | One sentence explaining the next safe action and one dominant button | Highest |
| Journey route | BLS → ACLS → evidence → simulations → hands-on assessment | High |
| Current task list | Only the tasks relevant to the current phase | High |
| Payment ledger | Paid, balance, next payment requirement, and deadline if applicable | Medium |
| Programme details | Policies, boundaries, certificates, and support information | Low / collapsible |

The dominant panel should not say only **“Your current IERP status and next available action.”** That is descriptive but not helpful. It should say what the learner can do now.

Examples:

- **Start BLS cognitive learning** — “BLS comes first. ACLS will appear after you complete the BLS cognitive pathway.”
- **Continue ACLS cognitive learning** — “Your BLS cognitive learning is complete. Continue with ACLS.”
- **Submit your AHA evidence** — “Your cognitive learning is complete. Upload the two certificates from elearning.heart.org to open the simulation stage.”
- **Open Phase 2** — “Your evidence is submitted. Complete the remaining confirmed team roles.”
- **Review payment** — “Your next stage is available, but the remaining programme balance is required before hands-on assessment.”

### 4.2 Use the progress bar as orientation, not as the headline

The current percentage badge, such as “42% programme progress,” is too abstract to lead the experience. A learner can have a percentage and still not know what to do.

Keep the progress bar, but place it beneath the next-action panel and label it **“Overall programme progress.”** The more important status should be the active step:

> **You are here: BLS cognitive learning**

The percentage can remain available for orientation, but should not compete with the action button. The phrase “Programme progress is an orientation aid, not a clinical competence score” should move into a small tooltip or secondary helper text rather than occupying prime visual space.

### 4.3 Make BLS-to-ACLS sequencing feel intentional

The sequence is clinically and operationally important. Represent it visually as a route with a clear handoff:

`BLS cognitive` **Complete** → `ACLS cognitive` **Next** → `AHA evidence` **Then** → `Online simulations` **After evidence** → `Hands-on assessment` **Final gate**

When ACLS is locked, the message should be specific and positive:

> **ACLS unlocks after BLS cognitive completion.** You do not need to repeat your profile. Complete BLS, then return here to continue.

This is better than a generic “locked” card because it tells the learner that the lock is expected and gives a clear recovery path.

### 4.4 Progressive disclosure for evidence and payment

The current dashboard places cognitive learning, evidence upload, payment state, and payment instructions in one dense region. That creates a “wall of requirements.” Only show the next relevant requirement prominently.

For example, before BLS and ACLS are complete, show:

> **Evidence comes next**  
> After both cognitive courses, upload the Video Prework Completion Certificate and Passed Precourse Self-Assessment Certificate.

Do not present the full upload controls as the main task before the learner can use them. Once the cognitive requirement is satisfied, expand the upload panel automatically and make it the active task.

Likewise, show payment as a compact status card until payment becomes the active gate. Use neutral language for a future requirement and red only when access is actually blocked.

## 5. Copy and terminology changes

| Current or likely interpretation | Recommended wording |
|---|---|
| Start IERP | Check eligibility and start |
| IERP at a glance | What you will complete |
| Cognitive foundation | Build your foundation |
| Online simulations | Practise as a team |
| Hands-on assessment | Demonstrate readiness |
| Phase 1 evidence | Upload your two AHA completion certificates |
| Programme progress | Overall programme progress |
| AHA evidence verified | Certificates reviewed |
| Cognitive access locked | Learning is waiting for payment on this account |
| Complete IERP payment | Pay the remaining programme balance |
| Open Phase 2 | Continue to online simulations |
| Your current IERP status and next available action | Your next IERP step |

The language should be **plain first, technical second**. Terms such as “cognitive,” “phase,” “evidence,” and “programme enrollment” can remain in supporting text, but the primary headings should describe the learner’s action.

## 6. Interior-design rules for the interface

The page should have a clear visual “floor plan.” The entrance is the identity and outcome. The foyer is the next action. The corridor is the journey route. The active room is the current task. Service rooms such as payment, policy, and evidence details remain nearby but do not block the main corridor.

The following rules should be treated as non-negotiable:

1. **One dominant action per screen.** Secondary actions must look secondary.
2. **One current task at a time.** Do not give equal emphasis to future gates.
3. **Every locked state must explain the unlocking action.** “Locked” alone is not guidance.
4. **Status colours must have stable meanings.** Green means complete, teal/indigo means current, slate means future, red means an active block.
5. **Do not make the learner read policy to discover the next step.** Policy belongs below or behind disclosure.
6. **Avoid four equal-weight cards when one step is current.** The current phase should be visibly larger and more prominent.
7. **Use mobile-first action placement.** On mobile, a sticky bottom action bar should repeat the current next action without obscuring content.
8. **Keep support close to uncertainty.** Put “Need help?” beside payment, evidence, and rejected-review states rather than in a distant footer.

## 7. What I would remove or demote

I would remove the large amount of defensive and institutional language from the first screen, including the full explanation that IERP activity does not grant IERS permissions. That statement remains important, but it belongs in a “Programme boundaries” disclosure.

I would demote repeated descriptions of the same payment rule, repeated “Start IERP” buttons with different surrounding copy, and any generic sentence that describes the card rather than helping the learner act. I would also avoid showing upload controls before they are relevant, because disabled controls make the programme feel broken rather than staged.

I would not add a carousel, autoplay video, large stock photograph, testimonial wall, countdown timer, gamified leaderboard, or decorative animation. None of these solves the central problem, which is **priority and orientation**.

## 8. UX-only implementation sequence

| Priority | Change | Architecture impact |
|---|---|---|
| P0 | Rewrite hero, CTA labels, phase titles, next-step messages, and payment copy | None; presentation and copy only |
| P0 | Reorder enrolled IERP view so next action appears before percentage and detailed requirements | None; reuse existing data and components |
| P0 | Replace equal-weight phase grid with active-step route styling | None; reuse existing phase data |
| P1 | Add progressive disclosure to evidence and payment panels | None; existing controls remain available |
| P1 | Apply stable status palette and reduce dark gradient/glassmorphism | None; CSS/classes only |
| P1 | Add mobile sticky current-action bar | None; client presentation only |
| P2 | Add concise tooltips/help text for programme percentage, payment timing, and locked states | None; copy/UI only |
| P2 | Add lightweight first-time orientation panel after profile creation | None if built from existing state; no new workflow required |

## 9. How we should judge the redesign

The redesign succeeds if a new intern can answer the following in under ten seconds: what IERP is, whether it is for them, what it includes, what it costs, and what button to press next. An enrolled learner should be able to return after a week away and identify the next step without rereading the entire programme page.

The practical measures should be simple: time from landing to eligibility start, percentage of learners who begin profile setup after visiting the page, percentage who reach BLS without support, support questions about “what do I do next,” and abandonment at the evidence/payment panels. These are UX measures only; they do not replace clinical or payment acceptance criteria.

## Final recommendation

Do not redesign IERP as a more beautiful brochure. Redesign it as a **calm, high-trust progression workspace**. The first screen should sell clarity, not complexity. The enrolled experience should behave like a clinical checklist: one current step, one safe next action, visible prerequisites, and quiet access to detail when needed.

The single highest-impact change is this:

> Replace the current “programme overview first” experience with a **next-action-first IERP command centre**, while retaining the existing route, data, phase gates, payment safeguards, and clinical sequencing.
