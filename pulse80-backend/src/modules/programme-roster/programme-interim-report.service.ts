import type { SupabaseClient } from "@supabase/supabase-js";
import { GraphQLError } from "graphql";
import type { Database } from "../../generated/database.types.js";

type Db = SupabaseClient<Database>;
type Risk = "Low" | "Moderate" | "High" | "Not Calculated";

export class ProgrammeInterimReportService {
  constructor(private readonly db: Db, private readonly organisationId?: string) {}

  async get(programmeId: string) {
    let programmeQuery = this.db.from("programmes").select("id, organisation_id, name, status, starts_on, ends_on, target_participants, service_names, organisations(name, logo_path)").eq("id", programmeId);
    if (this.organisationId !== undefined) programmeQuery = programmeQuery.eq("organisation_id", this.organisationId);
    const { data: programme, error: programmeError } = await programmeQuery.maybeSingle();
    if (programmeError) throw new Error(programmeError.message);
    if (!programme) throw new GraphQLError("Programme is unavailable.", { extensions: { code: "FORBIDDEN" } });

    const { data: activations, error: activationError } = await this.db.from("activations")
      .select("id, title, location, starts_at, ends_at, status")
      .eq("programme_id", programme.id).eq("organisation_id", programme.organisation_id).order("starts_at");
    if (activationError) throw new Error(activationError.message);
    const activationIds = (activations ?? []).map(row => row.id);

    const [{ data: roster, error: rosterError }, screeningResult] = await Promise.all([
      this.db.from("programme_participants").select("id, eligibility_status, registration_status")
        .eq("programme_id", programme.id),
      activationIds.length
        ? this.db.from("screenings").select(`id, programme_participant_id, participant_reference, status, service_id, services(name, code), screening_results(risk_level, escalation_required), screening_outcomes(referral_required, escalation_required, reporting_risk_category)`)
            .eq("organisation_id", programme.organisation_id).in("activation_id", activationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (rosterError) throw new Error(rosterError.message);
    if (screeningResult.error) throw new Error(screeningResult.error.message);

    const participants = roster ?? [];
    const screenings = (screeningResult.data ?? []) as any[];
    const registered = participants.filter(p => p.eligibility_status === "Eligible" && p.registration_status === "Registered");
    const registeredIds = new Set(registered.map(p => p.id));
    const completed = screenings.filter(row => String(row.status).toLowerCase() === "completed");
    const screenedIds = new Set(completed.map(row => row.programme_participant_id).filter((value): value is string => Boolean(value) && registeredIds.has(value)));
    const serviceMap = new Map<string, { service: string; screeningsCaptured: number; completedScreenings: number; participantsScreened: Set<string> }>();
    for (const row of screenings) {
      const service = row.services?.name ?? row.services?.code ?? "Unspecified service";
      const item = serviceMap.get(service) ?? { service, screeningsCaptured: 0, completedScreenings: 0, participantsScreened: new Set<string>() };
      item.screeningsCaptured += 1;
      if (String(row.status).toLowerCase() === "completed") {
        item.completedScreenings += 1;
        if (row.programme_participant_id) item.participantsScreened.add(row.programme_participant_id);
      }
      serviceMap.set(service, item);
    }

    const risks: Record<Risk, number> = { Low: 0, Moderate: 0, High: 0, "Not Calculated": 0 };
    let referralsRequired = 0, escalationsRequired = 0;
    for (const row of completed) {
      const raw = row.screening_outcomes?.reporting_risk_category ?? row.screening_results?.risk_level;
      const normalized: Risk = raw === "Low" || raw === "Moderate" || raw === "High" ? raw : "Not Calculated";
      risks[normalized] += 1;
      if (row.screening_outcomes?.referral_required) referralsRequired += 1;
      if (row.screening_outcomes?.escalation_required ?? row.screening_results?.escalation_required) escalationsRequired += 1;
    }

    const organisation = Array.isArray(programme.organisations) ? programme.organisations[0] : programme.organisations;
    const primaryActivation = activations?.[0];
    return {
      reportType: "INTERIM",
      generatedAt: new Date().toISOString(),
      programmeId: programme.id,
      programmeName: programme.name,
      programmeStatus: programme.status,
      startsOn: programme.starts_on,
      endsOn: programme.ends_on,
      organisationId: programme.organisation_id,
      organisationName: organisation?.name ?? "Client organisation",
      organisationLogoUrl: organisation?.logo_path ?? null,
      location: primaryActivation?.location ?? null,
      activationStatus: primaryActivation?.status ?? null,
      registeredParticipants: registered.length,
      participantsScreened: screenedIds.size,
      participationRate: registered.length ? (screenedIds.size / registered.length) * 100 : null,
      screeningsCaptured: screenings.length,
      completedScreenings: completed.length,
      serviceActivity: [...serviceMap.values()].map(item => ({
        service: item.service, screeningsCaptured: item.screeningsCaptured,
        completedScreenings: item.completedScreenings, participantsScreened: item.participantsScreened.size,
      })).sort((a,b) => b.screeningsCaptured - a.screeningsCaptured),
      riskDistribution: (Object.entries(risks) as [Risk, number][]).map(([riskCategory, screeningCount]) => ({ riskCategory, screeningCount })),
      referralsRequired,
      escalationsRequired,
      disclaimer: "Interim report. Figures reflect data captured so far and may change as screenings are completed, corrected and reviewed.",
    };
  }
}
