import { beforeEach, describe, expect, it, vi } from "vitest";
import { ilsCredentialRequests, ilsReminderEvents } from "../../drizzle/schema";

const { getDbMock, sendEmailMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("../db", () => ({ getDb: getDbMock }));
vi.mock("../email-service", () => ({ sendEmail: sendEmailMock }));

import { runScheduledIlsReminders } from "./ils-reminders";

type ReminderState = {
  reminder: Record<string, any>;
  dueRows: Record<string, any>[];
  expiredRequests: Record<string, any>[];
};

function createFakeDb(state: ReminderState) {
  const db: any = {
    select: () => {
      const query: any = {
        table: undefined,
        from: (table: unknown) => {
          query.table = table;
          return query;
        },
        leftJoin: () => query,
        where: () => query,
        orderBy: () => query,
        limit: () =>
          Promise.resolve(
            query.table === ilsReminderEvents ? state.dueRows : []
          ),
        then: (
          resolve: (value: Record<string, any>[]) => unknown,
          reject: (reason: unknown) => unknown
        ) => {
          const rows =
            query.table === ilsCredentialRequests
              ? state.expiredRequests
              : query.table === ilsReminderEvents
                ? state.dueRows
                : [];
          return Promise.resolve(rows).then(resolve, reject);
        },
      };
      return query;
    },
    update: (table: unknown) => {
      const query: any = {
        values: {},
        set: (values: Record<string, any>) => {
          query.values = values;
          return query;
        },
        where: () => {
          if (
            table === ilsCredentialRequests &&
            query.values.status === "expired"
          ) {
            for (const request of state.expiredRequests)
              Object.assign(request, query.values);
            return Promise.resolve([
              { affectedRows: state.expiredRequests.length },
            ]);
          }
          if (table !== ilsReminderEvents)
            return Promise.resolve([{ affectedRows: 1 }]);
          if (
            query.values.status === "sending" &&
            state.reminder.status === "queued"
          ) {
            Object.assign(state.reminder, query.values);
            return Promise.resolve([{ affectedRows: 1 }]);
          }
          if (
            query.values.status === "failed" &&
            state.reminder.status === "sending"
          ) {
            Object.assign(state.reminder, query.values);
            return Promise.resolve([{ affectedRows: 1 }]);
          }
          if (
            query.values.status === "cancelled" &&
            state.reminder.status === "queued"
          ) {
            Object.assign(state.reminder, query.values);
            return Promise.resolve([{ affectedRows: 1 }]);
          }
          return Promise.resolve([{ affectedRows: 0 }]);
        },
      };
      return query;
    },
  };
  return db;
}

describe("ILS scheduled reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims a due reminder and records thrown email failures", async () => {
    const state: ReminderState = {
      reminder: {
        id: 1,
        status: "queued",
        dueAt: new Date(Date.now() - 60_000),
        userEmail: "provider@example.com",
        userName: "Provider",
        reminderType: "activation",
      },
      dueRows: [],
      expiredRequests: [],
    };
    state.dueRows = [state.reminder];
    getDbMock.mockResolvedValue(createFakeDb(state));
    sendEmailMock.mockRejectedValue(new Error("SMTP unavailable"));

    const result = await runScheduledIlsReminders();

    expect(result).toMatchObject({
      evaluated: 1,
      sent: 0,
      failed: 1,
      skipped: 0,
      expired: 0,
    });
    expect(state.reminder).toMatchObject({
      status: "failed",
      errorMessage: "SMTP unavailable",
    });
  });

  it("expires unpaid AHA requests and cancels their queued credentialing reminder", async () => {
    const request = {
      id: 4,
      enrollmentId: 22,
      status: "payment_pending",
      credentialingDeadline: new Date(Date.now() - 60_000),
    };
    const state: ReminderState = {
      reminder: {
        id: 2,
        status: "queued",
        reminderType: "credentialing",
        enrollmentId: 22,
        dueAt: new Date(Date.now() - 60_000),
      },
      dueRows: [],
      expiredRequests: [request],
    };
    getDbMock.mockResolvedValue(createFakeDb(state));

    const result = await runScheduledIlsReminders();

    expect(result.expired).toBe(1);
    expect(request.status).toBe("expired");
    expect(state.reminder.status).toBe("cancelled");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
