/**
 * Submit Application to Property (PMS) API Route
 *
 * POST /api/applications/submit-pms   body: { propertyId: string }
 *
 * Takes everything the renter stores in HomeU (profile, saved application,
 * rental history, verified employment, financial verification), builds a
 * standardized application payload, and delivers it to the property:
 *
 *   1. Direct PMS submission when the property has an active pmsConnection
 *      (Entrata / Yardi / Buildium / RealPage / Rent Manager).
 *   2. Email fallback to the property manager when there is no connection,
 *      the provider isn't configured, or the API call fails.
 *
 * Every attempt is recorded in applicationSubmissions so the renter can
 * track status from the dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { buildStandardApplication } from "@/lib/pms/payload";
import { submitToPms } from "@/lib/pms/providers";
import { renderApplicationHtml } from "@/lib/pms/email";
import { sendApplicationEmail } from "@/lib/email/resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { propertyId } = await req.json();
    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // Load the property and everything HomeU knows about the renter
    const [property, connection, bundle] = await Promise.all([
      convex.query(api.multifamilyproperties.getPropertyById, { propertyId }),
      convex.query(api.pms.getConnectionForSubmission, { propertyId }),
      convex.query(api.pms.getApplicationBundle, { userId }),
    ]);

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const { application, sectionsIncluded, missingSections } =
      buildStandardApplication(
        bundle,
        {
          propertyId: property.propertyId,
          propertyName: property.propertyName,
          address: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
        },
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailAddresses?.[0]?.emailAddress,
        }
      );

    // Personal info is the minimum a PMS will accept
    if (missingSections.includes("personal")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your profile is missing basic information (name and email). Complete your profile in Setup before sending your application.",
          missingSections,
        },
        { status: 400 }
      );
    }

    const applicantName =
      `${application.applicant.firstName} ${application.applicant.lastName}`.trim();

    // --- Attempt direct PMS submission -----------------------------------
    let pmsResult = null;
    const hasActiveConnection =
      connection && connection.status === "active" && connection.provider !== "email";

    if (hasActiveConnection) {
      pmsResult = await submitToPms(connection, application);

      if (pmsResult.ok) {
        const submissionId = await convex.mutation(api.pms.recordSubmission, {
          userId,
          propertyId,
          propertyName: property.propertyName,
          propertyAddress: property.address,
          pmCompanyName: property.pmCompanyName ?? undefined,
          channel: "pms",
          provider: connection.provider,
          pmsConnectionId: connection._id,
          status: "submitted",
          externalApplicationId: pmsResult.externalApplicationId,
          payloadSnapshot: application,
          sectionsIncluded,
        });

        return NextResponse.json({
          success: true,
          channel: "pms",
          provider: connection.provider,
          submissionId,
          externalApplicationId: pmsResult.externalApplicationId,
          message: pmsResult.message,
          sectionsIncluded,
          missingSections,
        });
      }
      // fall through to email delivery, keeping the PMS failure reason
    }

    // --- Email fallback ----------------------------------------------------
    const fallbackEmail = connection?.fallbackEmail || property.pmEmail;
    if (!fallbackEmail) {
      const submissionId = await convex.mutation(api.pms.recordSubmission, {
        userId,
        propertyId,
        propertyName: property.propertyName,
        propertyAddress: property.address,
        pmCompanyName: property.pmCompanyName ?? undefined,
        channel: pmsResult ? "pms" : "email",
        provider: connection?.provider,
        pmsConnectionId: connection?._id,
        status: "failed",
        payloadSnapshot: application,
        sectionsIncluded,
        error:
          pmsResult?.message ??
          "This property has no PMS connection and no property manager email on file.",
      });

      return NextResponse.json(
        {
          success: false,
          submissionId,
          error:
            "We couldn't reach this property's management system and there's no property manager email on file yet. Our team has been notified to onboard this property.",
        },
        { status: 502 }
      );
    }

    await sendApplicationEmail({
      pmEmail: fallbackEmail,
      pmName: property.pmContactName || property.pmCompanyName || "Property Manager",
      applicantName,
      propertyName: property.propertyName,
      propertyAddress: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
      applicationHtml: renderApplicationHtml(application),
    });

    const submissionId = await convex.mutation(api.pms.recordSubmission, {
      userId,
      propertyId,
      propertyName: property.propertyName,
      propertyAddress: property.address,
      pmCompanyName: property.pmCompanyName ?? undefined,
      channel: "email",
      provider: connection?.provider,
      pmsConnectionId: connection?._id,
      status: "submitted",
      payloadSnapshot: application,
      sectionsIncluded,
      error: pmsResult ? `PMS delivery failed, sent via email: ${pmsResult.message}` : undefined,
    });

    return NextResponse.json({
      success: true,
      channel: "email",
      submissionId,
      message: pmsResult
        ? `Direct PMS submission wasn't possible (${pmsResult.message}) — your full application was emailed to the property manager instead.`
        : "Your full application was sent to the property manager.",
      sectionsIncluded,
      missingSections,
    });
  } catch (error: any) {
    console.error("submit-pms error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to submit application" },
      { status: 500 }
    );
  }
}
