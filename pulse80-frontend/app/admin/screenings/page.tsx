import { loadAdminScreenings } from "@/app/actions/screening-operations";
import { AdminScreeningOperations } from "@/components/screenings/ScreeningOperations";

export default async function AdminScreeningsPage() {
  const { adminScreenings } = await loadAdminScreenings();
  return <AdminScreeningOperations screenings={adminScreenings} mode="screenings" />;
}
