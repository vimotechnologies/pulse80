export type DashboardPeriod = "ALL_TIME" | "THIS_YEAR" | "THIS_QUARTER";
export type ParticipationRow = {
  participant_reference: string;
  captured_at: string;
  department: string | null;
};
const CAT_OFFSET = 2 * 60 * 60 * 1000;
const monthKey = (date: Date) =>
  new Date(date.getTime() + CAT_OFFSET).toISOString().slice(0, 7);

export function periodStart(period: DashboardPeriod, now: Date) {
  const local = new Date(now.getTime() + CAT_OFFSET);
  if (period === "ALL_TIME") return null;
  const month =
    period === "THIS_YEAR" ? 0 : Math.floor(local.getUTCMonth() / 3) * 3;
  return new Date(
    Date.UTC(local.getUTCFullYear(), month, 1) - CAT_OFFSET,
  ).toISOString();
}

// Participant references stay on the server; the API returns aggregate counts only.
export function summariseParticipation(
  rows: ParticipationRow[],
  start: string | null,
  now: Date,
) {
  const people = new Set<string>();
  const months = new Map<string, Set<string>>();
  const departments = new Map<
    string,
    { name: string; people: Set<string>; months: Map<string, Set<string>> }
  >();
  for (const row of rows) {
    people.add(row.participant_reference);
    const month = monthKey(new Date(row.captured_at));
    const name = row.department?.trim().replace(/\s+/g, " ") || "Unassigned";
    const key = name.toLocaleLowerCase("en");
    if (!months.has(month)) months.set(month, new Set());
    months.get(month)!.add(row.participant_reference);
    if (!departments.has(key))
      departments.set(key, { name, people: new Set(), months: new Map() });
    const department = departments.get(key)!;
    department.people.add(row.participant_reference);
    if (!department.months.has(month)) department.months.set(month, new Set());
    department.months.get(month)!.add(row.participant_reference);
  }
  const first = start
    ? monthKey(new Date(start))
    : [...months.keys()].sort()[0];
  const keys: string[] = [];
  if (first) {
    const cursor = new Date(`${first}-01T00:00:00Z`);
    const last = monthKey(now);
    while (cursor.toISOString().slice(0, 7) <= last) {
      keys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  const series = (values: Map<string, Set<string>>) =>
    keys.map((month) => ({
      month,
      participants: values.get(month)?.size ?? 0,
    }));
  return {
    participantsScreened: people.size,
    monthlyParticipation: series(months),
    departmentParticipation: [...departments.values()]
      .map((d) => ({
        department: d.name,
        participants: d.people.size,
        months: series(d.months),
      }))
      .sort(
        (a, b) =>
          b.participants - a.participants ||
          a.department.localeCompare(b.department),
      ),
  };
}
