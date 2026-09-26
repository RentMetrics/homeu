// Clerk → Convex auth. Set CLERK_JWT_ISSUER_DOMAIN on the Convex deployment
// to the Clerk Frontend API URL (e.g. https://clerk.homeu.co or
// https://<slug>.clerk.accounts.dev). Either enable Clerk's native Convex
// integration (session token aud="convex") or create a JWT template named
// "convex"; ConvexProviderWithClerk supports both.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
