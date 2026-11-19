import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/config/portal";
import { requirePortalUser } from "@/features/auth";

// Biasanya sudah dialihkan oleh proxy.ts. Halaman ini cadangan kalau proxy tidak membaca role dari JWT.
export default async function PortalHome() {
  const user = await requirePortalUser();
  redirect(ROLE_HOME[user.role]);
}
