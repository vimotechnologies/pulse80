"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClientDashboardStats } from "@/app/actions/client-dashboard";

type Props = Pick<
  ClientDashboardStats,
  "monthlyParticipation" | "departmentParticipation"
>;
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
const panel =
  "min-w-0 rounded-2xl border border-card-border bg-white p-5 shadow-sm sm:p-6";

export function ParticipationCharts({
  monthlyParticipation,
  departmentParticipation,
}: Props) {
  const [department, setDepartment] = useState("");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [sort, setSort] = useState("most");
  const selected = departmentParticipation.find(
    (item) => item.department === department,
  );
  const points = (selected?.months ?? monthlyParticipation).map((point) => ({
    ...point,
    label: monthLabel(point.month),
  }));
  const departments = [...departmentParticipation].sort((a, b) =>
    sort === "name"
      ? a.department.localeCompare(b.department)
      : sort === "least"
        ? a.participants - b.participants
        : b.participants - a.participants,
  );
  const hasData = monthlyParticipation.some((point) => point.participants > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Participation at a glance</h2>
          <p className="mt-1 text-xs text-black/60">
            Explore approved screening participation. No individual health
            results.
          </p>
        </div>
        <div
          aria-label="Visualisation display"
          className="flex rounded-lg border border-card-border bg-white p-1"
        >
          {(["chart", "table"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`rounded-md px-4 py-2 text-xs font-medium ${view === mode ? "bg-navy text-white" : "text-black hover:bg-slate-50"}`}
            >
              {mode === "chart" ? "Charts" : "View data"}
            </button>
          ))}
        </div>
      </div>
      {!hasData ? (
        <section className={panel}>
          <h3 className="text-sm font-semibold">
            No approved screenings in this period
          </h3>
          <p className="mt-2 text-xs leading-6 text-black/65">
            Choose another reporting period or check with your Pulse80
            coordinator. Charts will appear once approved results are available.
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <section
              className={`${panel} lg:col-span-2`}
              aria-labelledby="department-chart-title"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3
                    id="department-chart-title"
                    className="text-sm font-semibold"
                  >
                    Employees screened by department
                  </h3>
                  <p className="mt-1 text-xs text-black/60">
                    Unique participants · counts, not participation rates
                  </p>
                </div>
                <label className="text-xs">
                  Sort{" "}
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="ml-2 rounded-lg border border-card-border bg-white p-2"
                  >
                    <option value="most">Most screened</option>
                    <option value="least">Fewest screened</option>
                    <option value="name">Department name</option>
                  </select>
                </label>
              </div>
              {view === "chart" ? (
                <div
                  className="mt-5 max-h-[420px] overflow-y-auto"
                  role="group"
                  aria-label="Department participant counts; exact values also available using View data"
                >
                  <div
                    style={{ height: Math.max(240, departments.length * 48) }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departments}
                        layout="vertical"
                        margin={{ left: 0, right: 28, top: 4, bottom: 4 }}
                        accessibilityLayer
                      >
                        <CartesianGrid horizontal={false} stroke="#edf0f4" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#111" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="department"
                          width={110}
                          tick={{ fontSize: 11, fill: "#111" }}
                          tickFormatter={(value) =>
                            String(value).length > 16
                              ? `${String(value).slice(0, 15)}…`
                              : String(value)
                          }
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f4f6fa" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="participants"
                          name="Employees screened"
                          fill="#172b4d"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={24}
                          isAnimationActive={false}
                          onClick={(_entry, index) =>
                            setDepartment(departments[index].department)
                          }
                          cursor="pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="mt-5 max-h-[420px] overflow-auto">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">
                      Unique participants by department in the selected period
                    </caption>
                    <thead>
                      <tr className="border-b border-card-border">
                        <th scope="col" className="py-3">
                          Department
                        </th>
                        <th scope="col" className="py-3 text-right">
                          Employees screened
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((item) => (
                        <tr
                          key={item.department}
                          className="border-b border-slate-100"
                        >
                          <th scope="row" className="py-3 font-normal">
                            <button
                              onClick={() => setDepartment(item.department)}
                              className="text-left underline underline-offset-4"
                            >
                              {item.department}
                            </button>
                          </th>
                          <td className="py-3 text-right">
                            {item.participants.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-black/60">
                Select a department to explore its monthly trend. Department
                workforce totals are not available, so smaller counts do not
                necessarily mean lower participation. Someone recorded in
                multiple departments can appear in each.
              </p>
            </section>
            <aside className={`${panel} border-t-4 border-t-primary`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/50">
                Explore a department
              </p>
              <label
                className="mt-4 block text-xs font-medium"
                htmlFor="department-filter"
              >
                Department
              </label>
              <select
                id="department-filter"
                className="mt-2 w-full rounded-lg border border-card-border bg-white p-3 text-sm"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option value="">All departments</option>
                {departmentParticipation.map((item) => (
                  <option key={item.department} value={item.department}>
                    {item.department}
                  </option>
                ))}
              </select>
              <h3 className="mt-6 break-words text-sm font-semibold">
                {selected?.department ?? "Organisation overview"}
              </h3>
              {selected ? (
                <p className="mt-3 text-3xl font-semibold">
                  {selected.participants.toLocaleString()}
                  <span className="mt-1 block text-xs font-normal text-black/60">
                    unique participants in this period
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-xs leading-6 text-black/65">
                  Choose a department or select a bar to focus the trend below.
                  The summary cards above always show the whole organisation.
                </p>
              )}
              {selected ? (
                <button
                  type="button"
                  className="mt-5 text-xs font-medium underline underline-offset-4"
                  onClick={() => setDepartment("")}
                >
                  Clear department selection
                </button>
              ) : null}
              <div className="mt-6 border-t border-card-border pt-4">
                <p className="text-xs font-semibold">Branch comparisons</p>
                <p className="mt-2 text-xs leading-5 text-black/60">
                  Not available yet. Screenings need a reliable branch link
                  before this comparison can be shown.
                </p>
              </div>
            </aside>
          </div>
          <section className={panel} aria-labelledby="monthly-chart-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="monthly-chart-title" className="text-sm font-semibold">
                  Screening participation over time
                </h3>
                <p className="mt-1 text-xs text-black/60">
                  {selected?.department ?? "All departments"} · unique
                  participants each month · Botswana time
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                {selected ? "Department view" : "Organisation view"}
              </span>
            </div>
            {view === "chart" ? (
              <div className="mt-6 overflow-x-auto">
                <div
                  style={{
                    height: 280,
                    minWidth: Math.max(280, points.length * 46),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={points}
                      margin={{ left: -20, right: 10, top: 10, bottom: 8 }}
                      accessibilityLayer
                    >
                      <CartesianGrid vertical={false} stroke="#edf0f4" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#111" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#111" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f4f6fa" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="participants"
                        name="Employees screened"
                        fill="#496c9d"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={38}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="mt-5 max-h-80 overflow-auto">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">
                    Monthly screening participation for{" "}
                    {selected?.department ?? "the organisation"}
                  </caption>
                  <thead>
                    <tr className="border-b border-card-border">
                      <th scope="col" className="py-3">
                        Month
                      </th>
                      <th scope="col" className="py-3 text-right">
                        Employees screened
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr
                        key={point.month}
                        className="border-b border-slate-100"
                      >
                        <th scope="row" className="py-3 font-normal">
                          {point.label}
                        </th>
                        <td className="py-3 text-right">
                          {point.participants.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-black/60">
              Based on screening capture date for currently approved results.
              Repeat participants count once per month, so monthly totals must
              not be added to calculate the period’s unique total. The current
              month is incomplete.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
