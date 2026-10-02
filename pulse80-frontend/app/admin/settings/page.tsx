import { loadAccount } from "@/app/actions/account";
import { AccountSettings } from "@/components/admin/AccountSettings";
export default async function Page() { return <AccountSettings account={await loadAccount()} />; }
