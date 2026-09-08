import assert from "node:assert/strict";
import test from "node:test";

import { calculateDashboardStats, isUrgentWithdrawal } from "./practitioner-dashboard.service.js";

test("dashboard stats count all screening records as participants screened", () => {
  assert.deepEqual(calculateDashboardStats(8, 10, 2), {
    participantsScreened: 10,
    screeningCompletionRate: 80,
    pendingCorrections: 2,
  });
});

test("dashboard completion rate is zero when no screenings exist", () => {
  assert.equal(calculateDashboardStats(0, 0, 0).screeningCompletionRate, 0);
});

test("a same-day Botswana withdrawal is urgent", () => {
  const now = new Date("2026-09-06T08:00:00.000Z");
  assert.equal(isUrgentWithdrawal("Withdrawn", "2026-09-06T18:00:00+02:00", now), true);
  assert.equal(isUrgentWithdrawal("Withdrawn", "2026-09-07T08:00:00+02:00", now), false);
  assert.equal(isUrgentWithdrawal("Declined", "2026-09-06T18:00:00+02:00", now), false);
});
