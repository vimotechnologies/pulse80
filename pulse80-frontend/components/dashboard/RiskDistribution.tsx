export type RiskDistributionEntry = { riskCategory: string; participantCount: number };

export function RiskDistribution({ entries, scope }: { entries: RiskDistributionEntry[]; scope: string }) {
  const total = entries.reduce((sum, entry) => sum + entry.participantCount, 0);
  const number = new Intl.NumberFormat("en-BW");
  return (
    <section aria-label="Screening risk distribution" className="rounded-2xl border border-card-border bg-white p-5">
      <h2 className="text-lg font-semibold text-navy">Screening risk distribution</h2>
      <p className="mt-2 text-sm text-muted">{scope} · All time · Latest applicable completed screening per participant</p>
      {total === 0 ? <p role="status" className="mt-4 text-sm">No completed screenings available for risk analysis.</p> : (
        <table className="mt-4 w-full text-left text-sm">
          <caption className="sr-only">Risk categories for {number.format(total)} screened participants</caption>
          <thead><tr><th scope="col" className="py-2">Risk category</th><th scope="col">Participants</th><th scope="col">Percentage</th></tr></thead>
          <tbody>{entries.map(entry => <tr key={entry.riskCategory} className="border-t border-card-border">
            <th scope="row" className="py-3 font-medium">{entry.riskCategory}</th>
            <td>{number.format(entry.participantCount)}</td>
            <td>{((entry.participantCount / total) * 100).toFixed(2)}%</td>
          </tr>)}</tbody>
        </table>
      )}
      <p className="mt-4 text-sm text-muted">Based on recorded blood pressure, glucose, cholesterol and BMI. Not Calculated means no supported measurements are available; it does not mean low risk.</p>
    </section>
  );
}
