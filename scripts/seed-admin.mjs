/**
 * Seed script — creates the admin account.
 * Run: node scripts/seed-admin.mjs
 *
 * Credentials:
 *   Email:    admin@hivetrack.app
 *   Password: AdminHive2024!
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_EMAIL = "admin@hivetrack.app";
const ADMIN_PASSWORD = "AdminHive2024!";

async function run() {
  console.log("🛡️  HiveTrack — Admin Account Seed Script\n");

  const { data: existingList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = existingList?.users?.find((u) => u.email === ADMIN_EMAIL);

  let userId;
  if (existing) {
    userId = existing.id;
    await supabase.auth.admin.updateUserById(userId, { ban_duration: "none", password: ADMIN_PASSWORD });
    console.log(`✓ Reusing existing user (${userId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Admin" },
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    userId = data.user.id;
    console.log(`✓ Created user (${userId})`);
  }

  await supabase.from("profiles").upsert({ user_id: userId, full_name: "Admin" }, { onConflict: "user_id" });
  console.log("✓ Profile upserted");

  console.log(`
✅  Admin account ready!

  Email:    ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}

  ⚠️  Make sure ADMIN_EMAILS in .env.local includes this address:
      ADMIN_EMAILS=admin@hivetrack.app,imadhamdouch0@gmail.com
`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
