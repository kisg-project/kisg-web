#!/usr/bin/env node
// Membuat akun admin master pertama (CLAUDE.md bagian 8). Dijalankan sekali per lingkungan.
// Setelah itu semua akun dibuat lewat undangan dari portal. Aman diulang: akun yang sudah ada
// hanya dipastikan aktif dan ber-role admin, password tidak diubah.
//
// Env wajib: SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL, ADMIN_NAME
// Env opsional: ADMIN_PASSWORD (wajib saat akun belum ada). Tidak pernah dicetak.

import { createClient } from "@supabase/supabase-js";

for (const name of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "ADMIN_EMAIL", "ADMIN_NAME"]) {
  if (!process.env[name]) {
    console.error(`GAGAL env ${name} belum diisi.`);
    process.exit(1);
  }
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
const email = ADMIN_EMAIL.trim().toLowerCase();
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserId() {
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Gagal membaca daftar user: ${error.message}`);
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

let userId = await findUserId();

if (!userId) {
  if (!ADMIN_PASSWORD) {
    console.error("GAGAL akun belum ada dan ADMIN_PASSWORD belum diisi.");
    process.exit(1);
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });
  if (error || !data.user) {
    console.error(`GAGAL membuat akun: ${error?.message ?? "tanpa keterangan"}`);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("OK    akun admin dibuat");
} else {
  console.log("INFO  akun sudah ada, password tidak diubah");
}

const profile = await supabase
  .from("profiles")
  .update({ full_name: ADMIN_NAME, email, is_active: true })
  .eq("id", userId);
if (profile.error) {
  console.error(`GAGAL memperbarui profil: ${profile.error.message}`);
  process.exit(1);
}

const role = await supabase
  .from("user_roles")
  .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });
if (role.error) {
  console.error(`GAGAL menetapkan role admin: ${role.error.message}`);
  process.exit(1);
}

console.log("OK    role admin ditetapkan. Login pertama wajib memasang 2FA (TOTP).");
