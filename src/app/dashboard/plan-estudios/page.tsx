import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PlanEstudiosClient } from "./PlanEstudiosClient";
import { redirect } from "next/navigation";

export default async function PlanEstudiosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500 pb-4 px-3 sm:px-4 overflow-x-hidden">
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-3 md:p-4 w-full">
        <PlanEstudiosClient />
      </div>
    </div>
  );
}
