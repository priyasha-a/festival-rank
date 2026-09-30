import Link from "next/link";
import AccountPanel from "@/components/AccountPanel";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ All festivals
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Account</h1>
      <AccountPanel />
    </div>
  );
}
