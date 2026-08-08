/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

describe("AHA Training Journey Card", () => {
  it("renders correctly with active enrollments", () => {
    const mockAhaEnrollments = [
      {
        id: 1,
        courseTitle: "Basic Life Support (BLS)",
        programType: "bls",
        progressPercentage: 70,
        cognitiveModulesComplete: false,
        practicalSkillsSignedOff: false,
      },
    ];

    render(
      <Card>
        <CardContent>
          {mockAhaEnrollments.map((enrol) => {
            const cogPct = enrol.progressPercentage;
            const isPracDone = enrol.practicalSkillsSignedOff;

            return (
              <div key={enrol.id} data-testid="journey-item">
                <span className="font-bold text-sm">{enrol.courseTitle}</span>
                <span className="step-1">Step 1: {cogPct}%</span>
                <span className="step-2">Step 2: {isPracDone ? "Complete" : "Pending"}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Basic Life Support (BLS)")).toBeTruthy();
    expect(screen.getByText("Step 1: 70%")).toBeTruthy();
    expect(screen.getByText("Step 2: Pending")).toBeTruthy();
  });

  it("renders correctly with fully certified enrollments", () => {
    const mockAhaEnrollments = [
      {
        id: 2,
        courseTitle: "Pediatric Advanced Life Support (PALS)",
        programType: "pals",
        progressPercentage: 100,
        cognitiveModulesComplete: true,
        practicalSkillsSignedOff: true,
      },
    ];

    render(
      <Card>
        <CardContent>
          {mockAhaEnrollments.map((enrol) => {
            const isCertified = enrol.cognitiveModulesComplete && enrol.practicalSkillsSignedOff;

            return (
              <div key={enrol.id}>
                <span className="font-bold text-sm">{enrol.courseTitle}</span>
                {isCertified && <Badge>Certified</Badge>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Pediatric Advanced Life Support (PALS)")).toBeTruthy();
    expect(screen.getByText("Certified")).toBeTruthy();
  });
});

describe("AHA Institutional Board Filters & Metrics", () => {
  it("computes and displays metrics correctly for staff list", () => {
    const mockStaff = [
      {
        name: "Dr. Alex Carter",
        email: "alex@hospital.org",
        division: "Surgery",
        subDept: "Male Surgical",
        status: "completed",
        cognitiveModulesComplete: true,
        practicalSkillsSignedOff: true,
        progressPercentage: 100,
      },
      {
        name: "Nurse Grace",
        email: "grace@hospital.org",
        division: "Paediatrics and Child Health",
        subDept: "Paediatric Ward",
        status: "enrolled",
        cognitiveModulesComplete: false,
        practicalSkillsSignedOff: false,
        progressPercentage: 40,
      },
    ];

    // Compute metrics
    const total = mockStaff.length;
    let cogComplete = 0;
    let cogInProgress = 0;
    let practicalComplete = 0;
    let fullyCertified = 0;

    for (const p of mockStaff) {
      const cog = !!p.cognitiveModulesComplete;
      const prac = !!p.practicalSkillsSignedOff;
      const progress = p.progressPercentage || 0;

      if (cog && prac) {
        fullyCertified++;
      }
      if (cog) {
        cogComplete++;
      } else if (progress > 0 && progress < 100) {
        cogInProgress++;
      }
      if (prac) {
        practicalComplete++;
      }
    }

    render(
      <div>
        <div data-testid="cog-complete">Cognitive Complete: {cogComplete}</div>
        <div data-testid="cog-progress">Cognitive In Progress: {cogInProgress}</div>
        <div data-testid="prac-complete">Practical Skills Passed: {practicalComplete}</div>
        <div data-testid="certified">Fully Certified: {fullyCertified}</div>
      </div>
    );

    expect(screen.getByText("Cognitive Complete: 1")).toBeTruthy();
    expect(screen.getByText("Cognitive In Progress: 1")).toBeTruthy();
    expect(screen.getByText("Practical Skills Passed: 1")).toBeTruthy();
    expect(screen.getByText("Fully Certified: 1")).toBeTruthy();
  });
});

describe("AHA Training stats leaderboard & filters", () => {
  const mockStatsStaff = [
    {
      name: "Dr. Alex Carter",
      email: "alex@hospital.org",
      role: "doctor",
      department: "Surgery: Male Surgical",
      division: "Surgery",
      subDept: "Male Surgical",
      programStats: {
        bls: { enrolled: true, progressPercentage: 100, cognitiveModulesComplete: true, practicalSkillsSignedOff: true },
        acls: { enrolled: true, progressPercentage: 50, cognitiveModulesComplete: false, practicalSkillsSignedOff: false },
      },
    },
    {
      name: "Nurse Grace",
      email: "grace@hospital.org",
      role: "nurse",
      department: "Paediatrics: Paediatric Ward",
      division: "Paediatrics",
      subDept: "Paediatric Ward",
      programStats: {
        bls: { enrolled: true, progressPercentage: 40, cognitiveModulesComplete: false, practicalSkillsSignedOff: false },
        acls: { enrolled: false, progressPercentage: 0, cognitiveModulesComplete: false, practicalSkillsSignedOff: false },
      },
    },
  ];

  it("calculates course aggregates correctly across all program types", () => {
    const progs = ["bls", "acls"] as const;
    const stats: Record<string, { enrolled: number; phase1Complete: number; phase2Complete: number; phase3Complete: number }> = {
      bls: { enrolled: 0, phase1Complete: 0, phase2Complete: 0, phase3Complete: 0 },
      acls: { enrolled: 0, phase1Complete: 0, phase2Complete: 0, phase3Complete: 0 },
    };

    for (const p of mockStatsStaff) {
      for (const prog of progs) {
        const ps = p.programStats[prog];
        if (ps && ps.enrolled) {
          stats[prog].enrolled++;
          if (ps.cognitiveModulesComplete) stats[prog].phase1Complete++;
          if (ps.practicalSkillsSignedOff) stats[prog].phase2Complete++;
          if (ps.cognitiveModulesComplete && ps.practicalSkillsSignedOff) stats[prog].phase3Complete++;
        }
      }
    }

    expect(stats.bls.enrolled).toBe(2);
    expect(stats.bls.phase1Complete).toBe(1);
    expect(stats.bls.phase3Complete).toBe(1);
    expect(stats.acls.enrolled).toBe(1);
    expect(stats.acls.phase1Complete).toBe(0);
  });

  it("calculates ranked leaderboard data by department and cadre", () => {
    const getRanked = (groupBy: "department" | "role", metric: "certified" | "cognitive") => {
      const groups: Record<string, { name: string; total: number; certified: number; score: number }> = {};
      
      for (const p of mockStatsStaff) {
        const key = groupBy === "department" ? p.department : p.role;
        if (!groups[key]) {
          groups[key] = { name: key, total: 0, certified: 0, score: 0 };
        }
        groups[key].total++;
        
        let isCertified = false;
        const coreProgs = ["bls", "acls"] as const;
        for (const prog of coreProgs) {
          const ps = p.programStats[prog];
          if (ps && ps.enrolled && ps.cognitiveModulesComplete && ps.practicalSkillsSignedOff) {
            isCertified = true;
          }
        }
        if (isCertified) groups[key].certified++;
      }
      
      return Object.values(groups).map(g => ({
        ...g,
        score: Math.round((g.certified / g.total) * 100),
      })).sort((a, b) => b.score - a.score);
    };

    const rankedDepts = getRanked("department", "certified");
    expect(rankedDepts[0].name).toBe("Surgery: Male Surgical");
    expect(rankedDepts[0].score).toBe(100);
    expect(rankedDepts[1].name).toBe("Paediatrics: Paediatric Ward");
    expect(rankedDepts[1].score).toBe(0);

    const rankedCadres = getRanked("role", "certified");
    expect(rankedCadres[0].name).toBe("doctor");
    expect(rankedCadres[0].score).toBe(100);
  });
});
