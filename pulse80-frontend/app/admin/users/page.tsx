import { loadUserDirectory } from "@/app/actions/users";
import { UserDirectory } from "@/components/admin/UserDirectory";
export default async function Page() { return <UserDirectory directory={await loadUserDirectory()} />; }
