/**
 * Idempotent: Paeds Resus Instructor Course — full curriculum.
 * Called from learning.getCourses(programType=instructor) and certificate gating.
 *
 * Expanded 2026-07-21 (CEO decision) from a one-module MVP stub to a real
 * multi-module curriculum matching the structure of international
 * (AHA-style) instructor courses: adult learning theory, course-specific
 * delivery standards, objective skills assessment and debriefing, the
 * Paeds Resus mentorship/tier pathway, and platform administration.
 *
 * Idempotency is per-module (matched by title), not "does any module
 * exist" — the original MVP only ever checked/created one module, so a
 * naive "any module exists, skip" check here would have silently
 * prevented modules 2-6 from ever being added on an already-seeded
 * environment. Module 1's content is unchanged from the MVP version so
 * its existing title match still finds it.
 */
import { desc, eq, and, like } from "drizzle-orm";
import { courses, modules, moduleSections, quizzes, quizQuestions } from "../../drizzle/schema";

interface QuizQuestionDef {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface SectionDef {
  title: string;
  content: string;
  order: number;
}

interface ModuleDef {
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  sections: SectionDef[];
  quizTitle: string;
  quizDescription: string;
  questions: QuizQuestionDef[];
}

const MODULES: ModuleDef[] = [
  {
    title: "Module 1: Instructor role & delivery standards",
    description: "Expectations for Paeds Resus instructors and session quality.",
    content: `
      <h2>Your role</h2>
      <p>Paeds Resus instructors model safe, respectful, protocol-aware teaching in resource-limited settings.</p>
      <ul>
        <li>Prepare sessions using institutional schedules and cohort needs.</li>
        <li>Maintain professional boundaries and local clinical governance.</li>
        <li>Escalate concerns through hospital and platform channels when appropriate.</li>
      </ul>
    `,
    duration: 60,
    order: 1,
    sections: [
      {
        title: "Your role as an Instructor",
        content: `
          <h2>Your role</h2>
          <p>Paeds Resus instructors model safe, respectful, protocol-aware teaching in resource-limited settings.</p>
          <ul>
            <li>Prepare sessions using institutional schedules and cohort needs.</li>
            <li>Maintain professional boundaries and local clinical governance.</li>
            <li>Escalate concerns through hospital and platform channels when appropriate.</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "Code of Conduct & Professional Boundaries",
        content: `
          <h2>Conduct & safety</h2>
          <p>Teaching in LMIC clinical spaces requires absolute respect for local personnel and patient dignity. Instructors must act as mentors, not critics, avoiding confrontational teaching styles (such as "pimping" or public shaming) and cultivating a psychologically safe environment.</p>
        `,
        order: 2,
      },
      {
        title: "Standard Course Equipment & Room Setup",
        content: `
          <h2>Equipment & setup</h2>
          <p>A successful resuscitation course relies on proper preparation of the training environment. Before any session starts, check the availability of neonatal/paediatric bag-mask devices, training manikins, visual feedback timers, and clinical posters. Setup stations to encourage hands-on practice, ensuring optimal trainer-to-learner ratios.</p>
        `,
        order: 3,
      }
    ],
    quizTitle: "Check: instructor foundations",
    quizDescription: "Pass at 70% to complete the module.",
    questions: [
      {
        question: "What is the primary expectation of a Paeds Resus instructor regarding local protocols?",
        options: [
          "Ignore local rules if they differ from training slides",
          "Support local clinical governance and senior review where applicable",
          "Replace hospital policy with platform content",
        ],
        correctAnswer: "Support local clinical governance and senior review where applicable",
        explanation: "Training supports professional judgment and local governance.",
      },
      {
        question: "Which teaching approach is best suited for establishing a psychologically safe simulation environment?",
        options: [
          "Publicly quizzing learners on advanced concepts to highlight knowledge gaps (pimping)",
          "Encouraging hands-on practice, acting as a supportive mentor, and treating mistakes as learning opportunities",
          "Letting learners figure out all errors on their own without active facilitation",
        ],
        correctAnswer: "Encouraging hands-on practice, acting as a supportive mentor, and treating mistakes as learning opportunities",
        explanation: "Psychologically safe learning environments encourage active engagement, whereas public shaming or zero guidance hinders skills acquisition.",
      },
      {
        question: "What should an instructor do prior to the start of a hands-on resuscitation session?",
        options: [
          "Wait for the facility staff to set up the manikins and bag-mask ventilators",
          "Inspect and test all teaching aids, manikins, bag-mask devices, and timers to ensure they are fully functional",
          "Start the lectures immediately and skip the equipment check to save time",
        ],
        correctAnswer: "Inspect and test all teaching aids, manikins, bag-mask devices, and timers to ensure they are fully functional",
        explanation: "Ensuring equipment readiness before the session starts prevents disruptions and guarantees high-quality practice.",
      },
      {
        question: "How should an instructor address a learner who is struggling during a skills check?",
        options: [
          "Interrupt and ask another student to take over immediately",
          "Provide constructive, real-time coaching and allow them to repeat the step until they master it",
          "Fail the student immediately without providing feedback",
        ],
        correctAnswer: "Provide constructive, real-time coaching and allow them to repeat the step until they master it",
        explanation: "The instructor's role is to facilitate skill mastery through supportive coaching and practice.",
      },
    ],
  },
  {
    title: "Module 2: Adult learning principles & facilitation",
    description: "How adults actually learn resuscitation skills, and how to teach accordingly.",
    content: "",
    duration: 90,
    order: 2,
    sections: [
      {
        title: "Adult Learning Principles",
        content: `
          <h2>Adults are not children in bigger bodies</h2>
          <p>Your learners are working nurses, interns, and doctors who already have clinical experience,
          limited free time, and a low tolerance for being lectured at. Four principles should shape every
          session you run:</p>
          <ul>
            <li><strong>Self-direction.</strong> Adults learn best when they can see the relevance and
            have some say in how a scenario unfolds — not when they're passive recipients of slides.</li>
            <li><strong>Experience as a resource.</strong> Every nurse in the room has managed a
            deteriorating patient before. Draw on that instead of teaching as if the room is blank.</li>
            <li><strong>Readiness to learn.</strong> People engage hardest with what they'll actually use
            on their next shift. Anchor teaching points to real, local scenarios — a Naromoru code blue
            is more useful to a Kenyan nurse than an American case study.</li>
            <li><strong>Problem-centered, not content-centered.</strong> Structure sessions around "here's
            a deteriorating child, what do you do" rather than "here are the ACLS algorithms in order."</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "Tell — Show — Do — Practice — Feedback",
        content: `
          <h2>Tell — Show — Do — Practice — Feedback</h2>
          <p>For any hands-on skill (compressions, airway management, defibrillation), use this cycle
          rather than a single demonstration:</p>
          <ol>
            <li><strong>Tell:</strong> brief verbal explanation of the skill and why it matters.</li>
            <li><strong>Show:</strong> you demonstrate it once, at real speed, without narrating over it.</li>
            <li><strong>Do:</strong> you demonstrate it again, this time narrating each step.</li>
            <li><strong>Practice:</strong> the learner performs it while you watch, silently unless safety requires it.</li>
            <li><strong>Feedback:</strong> specific, actionable correction — not "good job," but "your
            hand placement drifted left after compression 15, here's why that matters."</li>
          </ol>
        `,
        order: 2,
      },
      {
        title: "Psychological Safety",
        content: `
          <h2>Psychological safety</h2>
          <p>A learner who is afraid of looking incompetent in front of peers will hide uncertainty
          rather than surface it — and uncertainty hidden in a simulation is uncertainty that shows up
          for real at a bedside. Before any simulation, say plainly that mistakes made here are the
          entire point, and that your debrief afterward is about the scenario, not about judging them
          as a clinician.</p>
        `,
        order: 3,
      }
    ],
    quizTitle: "Check: adult learning & facilitation",
    quizDescription: "Pass at 70% to complete the module.",
    questions: [
      {
        question: "A learner already has 3 years of ward nursing experience. What's the most effective way to open a teaching point on recognizing deterioration?",
        options: [
          "Start from first principles as if they have no clinical background",
          "Ask what deterioration they've personally seen and build the teaching point from there",
          "Skip straight to the algorithm since they already have experience",
        ],
        correctAnswer: "Ask what deterioration they've personally seen and build the teaching point from there",
        explanation: "Adult learners engage more when their existing experience is used as the starting point, not bypassed.",
      },
      {
        question: "In the Tell-Show-Do-Practice-Feedback cycle, what should you do during 'Practice'?",
        options: [
          "Continuously narrate corrections as they perform the skill",
          "Watch silently unless safety requires intervening, then give feedback afterward",
          "Perform the skill again yourself alongside them",
        ],
        correctAnswer: "Watch silently unless safety requires intervening, then give feedback afterward",
        explanation: "Interrupting practice with constant correction prevents the learner from building their own motor memory and self-monitoring.",
      },
      {
        question: "Why does psychological safety matter in a simulation session?",
        options: [
          "It makes the session feel friendlier, which is a nice bonus",
          "A learner afraid of looking incompetent will hide uncertainty instead of surfacing it — which is dangerous if it happens for real",
          "It has no real bearing on clinical outcomes, only on learner satisfaction scores",
        ],
        correctAnswer: "A learner afraid of looking incompetent will hide uncertainty instead of surfacing it — which is dangerous if it happens for real",
        explanation: "The entire value of simulation is surfacing gaps safely, before they matter at a real bedside.",
      },
    ],
  },
  {
    title: "Module 3: Running Phase 1-3 — course-specific delivery standards",
    description: "How to run each phase of the Subsidised ACLS/BLS Cohort Program to a consistent standard.",
    content: "",
    duration: 90,
    order: 3,
    sections: [
      {
        title: "Phase 1 — Reviewing Proof of Completion",
        content: `
          <h2>Phase 1 — reviewing proof of completion</h2>
          <p>Learners upload evidence of completing the online cognitive coursework and AHA prework before
          they're allowed into Phase 2. Your review is not a formality:</p>
          <ul>
            <li>Confirm the name and date on the certificate/screenshot actually match this learner and a
            recent, real completion — not a shared or reused image.</li>
            <li>If something looks wrong, reject with a specific reason rather than approving to avoid an
            awkward conversation. A wrongly-approved Phase 1 sets a learner up to struggle in Phase 2
            with knowledge gaps nobody caught.</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "Phase 2 — Online Team Simulations",
        content: `
          <h2>Phase 2 — online team simulations</h2>
          <p>Each learner needs 3 sessions as team leader and 6 sessions as a team member (covering all 6 distinct team member roles) before they're eligible for Phase 3. As the instructor running these sessions:</p>
          <ul>
            <li><strong>Rotate roles deliberately.</strong> Don't let confident learners default to team
            leader every time and quieter learners default to team member — the leadership role is where
            the hardest skills (closed-loop communication, delegation under pressure) actually get built.</li>
            <li><strong>Coach communication, not just clinical steps.</strong> "Sarah, give chest
            compressions" and confirming "starting compressions now" back is the skill you're building —
            not just whether the right drug got named.</li>
            <li><strong>Debrief every single session</strong> — even short ones. See Module 4 for the
            structure to use.</li>
          </ul>
        `,
        order: 2,
      },
      {
        title: "Phase 3 — Hands-on Megacode Assessment",
        content: `
          <h2>Phase 3 — hands-on Megacode assessment</h2>
          <p>This is a certification-bearing assessment, not more practice. Hold every learner to the
          same rubric regardless of how well you know them or how sympathetic their circumstances are:</p>
          <ul>
            <li>Use the skills checklist consistently — the same standard for every learner in every
            cohort, not a personal sense of "they seemed ready."</li>
            <li>A learner who doesn't meet the bar gets honest, specific feedback and a path to
            reassessment — not a pass out of kindness. A softened standard here is what eventually shows
            up as a real clinical gap during an actual code.</li>
          </ul>
        `,
        order: 3,
      }
    ],
    quizTitle: "Check: running Phase 1-3",
    quizDescription: "Pass at 70% to complete the module.",
    questions: [
      {
        question: "A learner's Phase 1 proof screenshot looks reused from someone else's completion. What should you do?",
        options: [
          "Approve it to avoid an awkward conversation, since Phase 2 will catch any real gaps",
          "Reject it with a specific reason so the learner can submit genuine proof",
          "Approve it but make a private note to watch them closely in Phase 2",
        ],
        correctAnswer: "Reject it with a specific reason so the learner can submit genuine proof",
        explanation: "A wrongly-approved Phase 1 sets a learner up with knowledge gaps nobody caught, and undermines the integrity of the whole certification.",
      },
      {
        question: "Why should team leader and team member roles be rotated deliberately across a cohort's 9 required Phase 2 sessions?",
        options: [
          "It's required for the platform to count the sessions correctly",
          "So every learner builds leadership skills, not just the naturally confident ones",
          "It makes scheduling easier for the instructor",
        ],
        correctAnswer: "So every learner builds leadership skills, not just the naturally confident ones",
        explanation: "Leadership skills like closed-loop communication and delegation under pressure are exactly what Phase 2 exists to build in every learner, not just the confident ones.",
      },
      {
        question: "In Phase 3, a learner you know well and like doesn't quite meet the skills checklist standard. What's correct?",
        options: [
          "Pass them since you're confident they'll be fine in real practice",
          "Hold them to the same standard as everyone else and give a path to reassessment",
          "Lower the bar slightly since they've worked hard throughout the program",
        ],
        correctAnswer: "Hold them to the same standard as everyone else and give a path to reassessment",
        explanation: "A consistent standard, applied without exception, is what makes the certification mean something — for this learner and for everyone else who earned theirs.",
      },
    ],
  },
  {
    title: "Module 4: Skills testing, objective evaluation & debriefing",
    description: "Assessing performance fairly and consistently, and debriefing in a way that actually changes behavior.",
    content: "",
    duration: 75,
    order: 4,
    sections: [
      {
        title: "Objective Skills Evaluation",
        content: `
          <h2>Objective, not impressionistic</h2>
          <p>"They seemed confident" is not an assessment. Every skills check should be scored against
          the same written checklist you'd use for any other learner — this is what makes a certificate
          issued by one instructor mean the same thing as one issued by another.</p>
        `,
        order: 1,
      },
      {
        title: "The GAS Debrief Structure",
        content: `
          <h2>The GAS debrief structure</h2>
          <p>After any simulation, structure your debrief in three stages rather than free-form discussion:</p>
          <ul>
            <li><strong>Gather:</strong> ask the team what happened, in their own words, before you say
            anything. "Walk me through what you were thinking when the rhythm changed."</li>
            <li><strong>Analyze:</strong> explore why things happened the way they did — including what
            went well, not just what went wrong. Use <em>advocacy-inquiry</em>: state what you observed
            plainly, then ask genuinely ("I noticed the epinephrine was delayed by about two minutes —
            what was happening for you at that point?") rather than accusing.</li>
            <li><strong>Summarize:</strong> close with what the team will do differently next time, in
            their own words. A debrief that doesn't end in a concrete takeaway didn't change anything.</li>
          </ul>
        `,
        order: 2,
      },
      {
        title: "Effective, Non-shaming Feedback",
        content: `
          <h2>Feedback that doesn't shame</h2>
          <p>Specific, behavioral feedback lands. Character judgments don't:</p>
          <ul>
            <li>Not: "You're not good under pressure." Instead: "When the alarm went off, the team lost
            the compression count for about 15 seconds — let's talk about what would keep that from
            happening."</li>
            <li>Address the scenario and the decisions made in it, not the person's general competence
            as a clinician. Your job is to build the skill, not to rank the learner.</li>
          </ul>
        `,
        order: 3,
      },
      {
        title: "Documentation and Quality Assurance",
        content: `
          <h2>Documentation matters</h2>
          <p>Your scores and notes feed directly into that learner's certification record and, later, into
          whether their cohort counts toward your own progression as a mentor. Record accurately in the
          moment — not from memory at the end of a long session.</p>
        `,
        order: 4,
      }
    ],
    quizTitle: "Check: skills testing & debriefing",
    quizDescription: "Pass at 70% to complete the module.",
    questions: [
      {
        question: "What is the first stage of a GAS-structured debrief?",
        options: [
          "Tell the team what they did wrong, starting with the most serious error",
          "Gather — ask the team what happened, in their own words, before giving your own view",
          "Summarize the clinical algorithm they should have followed",
        ],
        correctAnswer: "Gather — ask the team what happened, in their own words, before giving your own view",
        explanation: "Starting with the team's own account, before your view, is what makes the debrief a conversation rather than a lecture.",
      },
      {
        question: "Which of these is an example of advocacy-inquiry feedback?",
        options: [
          "\"You're not good under pressure.\"",
          "\"I noticed the epinephrine was delayed by about two minutes — what was happening for you at that point?\"",
          "\"That was a bad round, let's move on.\"",
        ],
        correctAnswer: "\"I noticed the epinephrine was delayed by about two minutes — what was happening for you at that point?\"",
        explanation: "Advocacy-inquiry states a specific, factual observation, then asks a genuine question — rather than accusing or generalizing about the person.",
      },
      {
        question: "Why does accurate, in-the-moment documentation of skills scores matter?",
        options: [
          "It's only useful for the platform's internal record-keeping",
          "It feeds directly into the learner's certification record and, eventually, your own progression as a mentor",
          "It doesn't matter much as long as the learner eventually passes",
        ],
        correctAnswer: "It feeds directly into the learner's certification record and, eventually, your own progression as a mentor",
        explanation: "Scores recorded from memory at the end of a long session are less reliable, and this data has real downstream consequences for the learner and the mentorship pathway.",
      },
    ],
  },
  {
    title: "Module 5: The Paeds Resus mentorship pathway",
    description: "How instructors progress from provisional to qualified to Lead Instructor, and what each tier means.",
    content: "",
    duration: 45,
    order: 5,
    sections: [
      {
        title: "Mentorship Pathway Tiers",
        content: `
          <h2>Three tiers</h2>
          <p>Completing this Instructor Course makes you a <strong>Provisional Instructor</strong> — not
          the end of your development as an instructor, but the start of it.</p>
          <ul>
            <li><strong>Provisional Instructor:</strong> completed this course, admin-approved, paired
            with a named mentor. You can run sessions, but each group you lead needs your mentor's
            confirmation that it was genuinely led end-to-end, independently, by you.</li>
            <li><strong>Qualified Instructor:</strong> reached once your mentor has confirmed 3
            independently-led groups, start to finish, across all three phases. You can now mentor
            provisional instructors yourself.</li>
            <li><strong>Lead Instructor:</strong> reached once you've mentored 10 different
            provisional instructors all the way to Qualified. Lead Instructors carry responsibility for quality
            across the whole instructor pool — the specific duties of this role are still being defined
            as the program scales, but expect it to include things like periodic instructor monitoring
            and reviewing edge cases coordinators or mentees escalate.</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "Defining Independent Facilitation",
        content: `
          <h2>What "independently led" actually means</h2>
          <p>Your mentor isn't there to run the session for you or to rubber-stamp your work. "Independent"
          means you personally reviewed Phase 1 proofs, ran the Phase 2 sessions, and conducted the Phase 3
          assessment for that group, start to finish. Your mentor's confirmation is a genuine check on
          whether that happened to a real standard — not a formality either of you should treat lightly.</p>
        `,
        order: 2,
      },
      {
        title: "Why Manual/Ratio Confirmation Matters",
        content: `
          <h2>Why manual confirmation, not automatic counting</h2>
          <p>Whether a group was truly led well and independently is a judgment call about how you actually
          performed — not something attendance data alone can certify. Your mentor's name is attached to
          each confirmation because it's a real credentialing decision, the same way your own signature on
          a Phase 3 sign-off is a real decision about a learner.</p>
          <p>Under the platform framework, 1 cohort equivalent is defined as successfully facilitating at least 7 unique learners through Phase 2 online simulations and 8 unique learners through Phase 3 practical assessments. Provisional instructors must achieve this 7/8 ratio times 3 independently (21 Phase 2 and 24 Phase 3 total learners) to be eligible for Qualified status.</p>
        `,
        order: 3,
      }
    ],
    quizTitle: "Check: the mentorship pathway",
    quizDescription: "Pass at 70% to complete the module.",
    questions: [
      {
        question: "What tier does someone reach immediately after completing this Instructor Course and being admin-approved?",
        options: [
          "Qualified Instructor",
          "Provisional Instructor",
          "Lead Instructor",
        ],
        correctAnswer: "Provisional Instructor",
        explanation: "Completing the course and admin approval is the starting point, not the end, of instructor development.",
      },
      {
        question: "How does a Provisional Instructor become a Qualified Instructor?",
        options: [
          "By waiting a fixed number of months after certification",
          "By having their mentor confirm 3 independently-led groups, start to finish",
          "By passing a second written exam",
        ],
        correctAnswer: "By having their mentor confirm 3 independently-led groups, start to finish",
        explanation: "Progression is tied to demonstrated, mentor-confirmed independent delivery — not time served or a written test alone.",
      },
      {
        question: "Why is group completion manually confirmed by a named mentor rather than automatically counted from attendance data?",
        options: [
          "The platform doesn't have the technical ability to count automatically",
          "Whether a group was genuinely led well and independently is a judgment call, not something raw data can certify",
          "It gives mentors something to do",
        ],
        correctAnswer: "Whether a group was genuinely led well and independently is a judgment call, not something raw data can certify",
        explanation: "This is a real credentialing decision, similar in weight to signing off a learner's own Phase 3 assessment.",
      },
    ],
  },
  {
    title: "Module 6: Platform tools & quality assurance",
    description: "Using the Instructor Portal in practice, and your role in keeping data and quality accurate.",
    content: "",
    duration: 45,
    order: 6,
    sections: [
      {
        title: "Your Instructor Dashboard Tools",
        content: `
          <h2>Your day-to-day tools</h2>
          <ul>
            <li><strong>My Assignments:</strong> every session you're scheduled to run, across every
            institution you've been assigned to — not just your home facility.</li>
            <li><strong>Session Roster:</strong> pull the full list of learners registered for a given
            session before you arrive, so you're not improvising who's meant to be in the room.</li>
            <li><strong>Sign off practical skills:</strong> record each learner's Phase 3 result against
            the checklist. This is the action that can trigger certificate issuance — get it right the
            first time rather than planning to fix it later.</li>
            <li><strong>Update attendance:</strong> mark who actually showed up and participated for each
            Phase 2 session — this is what the platform uses to confirm a learner has hit their 3-as-leader,
            6-as-member requirement honestly.</li>
          </ul>
        `,
        order: 1,
      },
      {
        title: "Data Integrity & Reporting",
        content: `
          <h2>Data integrity is part of the job</h2>
          <p>Every sign-off and attendance mark you make becomes part of a real certification record —
          for the learner, and eventually for your own mentorship progression. Treat it with the same
          care you'd give a clinical chart, not as administrative overhead to rush through.</p>
        `,
        order: 2,
      },
      {
        title: "Quality Concerns & Escalation",
        content: `
          <h2>When something's wrong</h2>
          <p>If you notice a pattern of concern — a learner who shouldn't be progressing, a facility
          pressuring you to pass someone, equipment or safety issues at a venue — escalate through your
          mentor or the institutional coordinator rather than quietly working around it. Quality assurance
          only works if problems actually surface.</p>
        `,
        order: 3,
      }
    ],
    quizTitle: "Check: platform tools & quality assurance",
    quizDescription: "Pass at 70% to complete the module.",
    questions: [
      {
        question: "What does 'Update attendance' in the Instructor Portal actually confirm for a learner?",
        options: [
          "Their final certificate eligibility",
          "That they showed up and participated in a specific Phase 2 session, feeding their 3-as-leader/6-as-member count",
          "Their payment status for the cohort program",
        ],
        correctAnswer: "That they showed up and participated in a specific Phase 2 session, feeding their 3-as-leader/6-as-member count",
        explanation: "Attendance marks are what the platform uses to confirm the Phase 2 session-count requirement was genuinely met.",
      },
      {
        question: "A facility coordinator pressures you to pass a learner who didn't meet the Phase 3 standard. What should you do?",
        options: [
          "Pass the learner to avoid conflict with the facility relationship",
          "Escalate through your mentor or the appropriate channel rather than quietly complying",
          "Pass them but note it privately for your own records",
        ],
        correctAnswer: "Escalate through your mentor or the appropriate channel rather than quietly complying",
        explanation: "Quality assurance only works if pressure like this actually surfaces instead of being quietly absorbed by individual instructors.",
      },
    ],
  },
];

export async function ensureInstructorCourseCatalog(db: any): Promise<void> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.programType, "instructor"), like(courses.title, "%Instructor%")))
    .limit(1);

  let courseId: number;

  if (existing.length > 0) {
    courseId = existing[0].id;
  } else {
    await db.insert(courses).values({
      title: "Paeds Resus Instructor Course",
      description:
        "Train-the-trainer foundations: adult learning, course-specific delivery, objective assessment and debriefing, the mentorship pathway, and platform administration.",
      programType: "instructor",
      duration: MODULES.reduce((sum, m) => sum + m.duration, 0),
      level: "advanced",
      order: 10,
    });
    const row = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.programType, "instructor"))
      .orderBy(desc(courses.id))
      .limit(1);
    courseId = row[0]!.id;
  }

  for (const moduleDef of MODULES) {
    const modExisting = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.title, moduleDef.title)))
      .limit(1);

    let moduleId: number;
    if (modExisting.length > 0) {
      moduleId = modExisting[0].id;
      // Update module fields
      await db.update(modules)
        .set({
          description: moduleDef.description,
          content: moduleDef.content,
          duration: moduleDef.duration,
          order: moduleDef.order,
        })
        .where(eq(modules.id, moduleId));
    } else {
      await db.insert(modules).values({
        courseId,
        title: moduleDef.title,
        description: moduleDef.description,
        content: moduleDef.content,
        duration: moduleDef.duration,
        order: moduleDef.order,
      });
      const m = await db
        .select({ id: modules.id })
        .from(modules)
        .where(and(eq(modules.courseId, courseId), eq(modules.title, moduleDef.title)))
        .orderBy(desc(modules.id))
        .limit(1);
      moduleId = m[0]!.id;
    }

    // Ensure sections are synchronized
    if (moduleDef.sections && moduleDef.sections.length > 0) {
      for (const section of moduleDef.sections) {
        const sectExisting = await db
          .select({ id: moduleSections.id })
          .from(moduleSections)
          .where(and(eq(moduleSections.moduleId, moduleId), eq(moduleSections.order, section.order)))
          .limit(1);

        if (sectExisting.length > 0) {
          await db.update(moduleSections)
            .set({
              title: section.title,
              content: section.content,
            })
            .where(eq(moduleSections.id, sectExisting[0].id));
        } else {
          await db.insert(moduleSections).values({
            moduleId,
            title: section.title,
            content: section.content,
            order: section.order,
          });
        }
      }
    }

    const quizExisting = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .limit(1);

    let quizId: number;
    if (quizExisting.length > 0) {
      quizId = quizExisting[0].id;
      // Update quiz details
      await db.update(quizzes)
        .set({
          title: moduleDef.quizTitle,
          description: moduleDef.quizDescription,
        })
        .where(eq(quizzes.id, quizId));
    } else {
      await db.insert(quizzes).values({
        moduleId,
        title: moduleDef.quizTitle,
        description: moduleDef.quizDescription,
        passingScore: 70,
        order: 1,
      });
      const q = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.moduleId, moduleId))
        .orderBy(desc(quizzes.id))
        .limit(1);
      quizId = q[0]!.id;
    }

    // Delete existing quiz questions and re-insert to keep them perfectly in sync
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));

    let order = 1;
    for (const q of moduleDef.questions) {
      await db.insert(quizQuestions).values({
        quizId,
        question: q.question,
        questionType: "multiple_choice",
        options: JSON.stringify(q.options),
        correctAnswer: typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer),
        explanation: q.explanation,
        order: order++,
      });
    }
  }
}
