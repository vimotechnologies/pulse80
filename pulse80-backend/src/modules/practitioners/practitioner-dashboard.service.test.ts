import assert from "node:assert/strict";
import test from "node:test";

import { calculateDashboardStats, countCompletedParticipants, isUrgentWithdrawal } from "./practitioner-dashboard.service.js";

test("dashboard stats keep unique participants separate from screening record counts", () => {
  assert.deepEqual(calculateDashboardStats(8, 10, 2, 3), {
    participantsScreened: 3,
    screeningCompletionRate: 80,
    pendingCorrections: 2,
  });
});

test("dashboard completion rate is zero when no screenings exist", () => {
  assert.equal(calculateDashboardStats(0, 0, 0, 0).screeningCompletionRate, 0);
});

test("a same-day Botswana withdrawal is urgent", () => {
  const now = new Date("2026-09-06T08:00:00.000Z");
  assert.equal(isUrgentWithdrawal("Withdrawn", "2026-09-06T18:00:00+02:00", now), true);
  assert.equal(isUrgentWithdrawal("Withdrawn", "2026-09-07T08:00:00+02:00", now), false);
  assert.equal(isUrgentWithdrawal("Declined", "2026-09-06T18:00:00+02:00", now), false);
});

// Exercise the query's filters and pagination with mixed screening records.
type ScreeningFixture = {
  id: string; organisation_id: string; activation_id: string | null;
  participant_reference: string; practitioner_user_id: string; status: string;
};
function screeningClient(rows: ScreeningFixture[], errorMessage?: string) {
  return {
    from(table: string) {
      assert.equal(table, "screenings");
      let selected = rows;
      const query = {
        select() { return query; },
        eq(field: keyof ScreeningFixture, value: string) {
          selected = selected.filter((row) => row[field] === value);
          return query;
        },
        order(field: "id") {
          selected = [...selected].sort((a, b) => a[field].localeCompare(b[field]));
          return query;
        },
        async range(from: number, to: number) {
          // Simulate a server cap smaller than the requested page size.
          return { data: selected.slice(from, Math.min(to + 1, from + 2)),
            error: errorMessage ? { message: errorMessage } : null };
        },
      };
      return query;
    },
  } as unknown as Parameters<typeof countCompletedParticipants>[0];
}

test("participants screened deduplicates completed services across pages and isolates scope", async () => {
  const row = (id: string, changes: Partial<ScreeningFixture> = {}): ScreeningFixture => ({
    id, organisation_id: "org-a", activation_id: "event-a",
    participant_reference: "person-a", practitioner_user_id: "practitioner-a",
    status: "Completed", ...changes,
  });
  const client = screeningClient([
    row("01"), row("02", { participant_reference: "person-b" }), row("03"),
    row("04", { organisation_id: "org-b" }),
    row("05", { activation_id: "event-b" }),
    row("06", { activation_id: null }), row("07", { activation_id: null }),
    ...["Draft", "Under Review", "Needs Correction", "Approved"].map((status, i) =>
      row(`1${i}`, { status, participant_reference: `unfinished-${i}` })),
    row("20", { practitioner_user_id: "practitioner-b", participant_reference: "other-person" }),
  ]);
  assert.equal(await countCompletedParticipants(client, "practitioner-a"), 5);
});

test("participants screened returns zero when no completed screenings match", async () => {
  assert.equal(await countCompletedParticipants(screeningClient([]), "practitioner-a"), 0);
});

test("participants screened propagates database failures instead of displaying zero", async () => {
  await assert.rejects(
    countCompletedParticipants(screeningClient([], "Database unavailable"), "practitioner-a"),
    /Database unavailable/,
  );
});
