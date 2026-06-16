import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PlanEstudiosClient } from "./PlanEstudiosClient";
import { redirect } from "next/navigation";

export default async function PlanEstudiosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <PlanEstudiosClient />;
}
