/**
 * PMS Credential Check API Route (admin only)
 *
 * GET /api/admin/pms/credential-check?provider=entrata&ref=ACME
 *
 * Reports which environment variables a PMS connection needs and whether
 * each is present on the server. Returns booleans only — never values.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/lib/admin";
import { PROVIDER_SETUP, envVarName } from "@/lib/pms/setup";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  if (!isAdminEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const provider = req.nextUrl.searchParams.get("provider") ?? "";
  const ref = req.nextUrl.searchParams.get("ref") || provider;

  const setup = PROVIDER_SETUP[provider];
  if (!setup) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  const vars = [
    ...setup.envSuffixes.map((suffix) => {
      const name = envVarName(ref, suffix);
      return { name, present: Boolean(process.env[name]), scope: "credential" as const };
    }),
    ...setup.globalVars.map((name) => ({
      name,
      present: Boolean(process.env[name]),
      scope: "global" as const,
    })),
    // Email fallback path is always available as a delivery channel
    {
      name: "RESEND_API_KEY",
      present: Boolean(process.env.RESEND_API_KEY),
      scope: "fallback" as const,
    },
  ];

  return NextResponse.json({
    provider,
    ref,
    ready: vars.filter((v) => v.scope === "credential" || v.scope === "global").every((v) => v.present),
    vars,
  });
}
