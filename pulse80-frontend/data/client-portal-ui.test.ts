import assert from "node:assert/strict";
import test from "node:test";
import { clientPageConfigs } from "./client-portal-ui";

test("dashboard and reports contain no hard-coded metric or report fixtures", () => {
  assert.deepEqual(clientPageConfigs.dashboard.metrics, []);
  assert.deepEqual(clientPageConfigs.dashboard.records, []);
  assert.deepEqual(clientPageConfigs.reports.metrics, []);
  assert.deepEqual(clientPageConfigs.reports.records, []);
  assert.equal(clientPageConfigs.dashboard.featured, undefined);
  assert.equal(clientPageConfigs.reports.featured, undefined);
});
