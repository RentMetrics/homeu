import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { handleSnapshotRequest } from "./lib/businessSignal";

const http = httpRouter();

// AI Marketing Hub polls this every 15 min (HMAC-signed; 503 until
// BUSINESS_SIGNAL_SECRET is set on this deployment).
http.route({
  path: "/business-signal/snapshot",
  method: "GET",
  handler: httpAction(async (ctx, req) =>
    handleSnapshotRequest(req, {
      business: "homeu",
      secret: process.env.BUSINESS_SIGNAL_SECRET,
      collect: () => ctx.runAction(internal.businessSignal.collect, {}),
    })
  ),
});

export default http;
