"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const BASE_USERS = [
  { email: "base1@camino.com", base_id: "b1", base_name: "AIR FORCE 1" },
  { email: "base2@camino.com", base_id: "b2", base_name: "MATANGA" },
  { email: "base3@camino.com", base_id: "b3", base_name: "GATO CORRIDO" },
  { email: "base4@camino.com", base_id: "b4", base_name: "CACHIBOL" },
  { email: "base5@camino.com", base_id: "b5", base_name: "DE AGUILITA" },
];

const ADMIN_USER = { email: "admin@camino.com" };

export async function POST(request: Request) {
  const { password } = await request.json();
  
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of BASE_USERS) {
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "base",
          base_id: user.base_id,
          base_name: user.base_name,
        },
      });

      results.push({
        email: user.email,
        success: !error,
        error: error?.message,
      });
    }

    const { error: adminError } = await supabase.auth.admin.createUser({
      email: ADMIN_USER.email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
      },
    });

    results.push({
      email: ADMIN_USER.email,
      success: !adminError,
      error: adminError?.message,
    });

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
