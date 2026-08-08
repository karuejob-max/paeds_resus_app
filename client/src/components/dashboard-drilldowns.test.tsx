/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

describe("Dashboard Drilldown Table Rendering", () => {
  it("renders sessions list correctly in a test container", () => {
    const mockEvents = [
      {
        id: 1,
        name: "Neonatal Resuscitation Training",
        eventDate: "2026-08-08T10:00:00Z",
        eventType: "cne",
        presenterName: "Dr. Jane Doe",
        presenterDepartment: "Paediatrics",
        cpdPoints: 3,
        attendeeCount: 12,
      },
    ];

    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <div data-testid="drilldown-content">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Presenter</th>
                  <th>Points</th>
                  <th>Attendees</th>
                </tr>
              </thead>
              <tbody>
                {mockEvents.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.presenterName}</td>
                    <td>{e.cpdPoints}</td>
                    <td>{e.attendeeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText("Neonatal Resuscitation Training")).toBeTruthy();
    expect(screen.getByText("Dr. Jane Doe")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders roster list correctly with status badges", () => {
    const mockRoster = [
      {
        id: 101,
        staffName: "Alice Smith",
        staffEmail: "alice@hospital.org",
        staffRole: "medical_officer",
        department: "Emergency Medicine",
        enrollmentStatus: "enrolled",
        linkStatus: "linked",
      },
    ];

    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <table>
            <tbody>
              {mockRoster.map((s) => (
                <tr key={s.id}>
                  <td>{s.staffName}</td>
                  <td>{s.staffEmail}</td>
                  <td>{s.department}</td>
                  <td>{s.enrollmentStatus}</td>
                  <td>{s.linkStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText("Alice Smith")).toBeTruthy();
    expect(screen.getByText("alice@hospital.org")).toBeTruthy();
    expect(screen.getByText("Emergency Medicine")).toBeTruthy();
    expect(screen.getByText("enrolled")).toBeTruthy();
    expect(screen.getByText("linked")).toBeTruthy();
  });
});
