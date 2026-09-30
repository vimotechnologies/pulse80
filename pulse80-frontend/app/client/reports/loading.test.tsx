import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Loading from "./loading";

test("report loading state does not render metric values", () => {
  const html = renderToStaticMarkup(<Loading />);
  assert.match(html, /Loading analytics/);
  assert.doesNotMatch(html, /Participants Screened|Screening Completion|%/);
});
