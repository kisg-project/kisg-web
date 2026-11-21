import { redirect } from "next/navigation";

/** Alamat lama kelola akun. Sekarang di area owner (role admin tidak dipakai lagi). */
export default function LegacyUsersPage() {
  redirect("/portal/owner/karyawan");
}
