import assert from "node:assert/strict";
import test from "node:test";
import { analyticsUiState, formatCount, formatPercentage, percentage } from "./presentation";

test("formats counts and percentages consistently", () => {
  assert.equal(formatCount(1428), "1,428");
  assert.equal(formatPercentage(78), "78%");
  assert.equal(formatPercentage(78.25), "78.3%");
  assert.equal(percentage(3, 4), 75);
  assert.equal(percentage(0, 0), 0);
});

test("selects loading, error, empty, and success states", () => {
  assert.equal(analyticsUiState(), "loading");
  assert.equal(analyticsUiState(undefined, "failed"), "error");
  assert.equal(analyticsUiState({ hasData: false } as never), "empty");
  assert.equal(analyticsUiState({ hasData: true } as never), "success");
});
