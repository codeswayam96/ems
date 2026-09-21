import { withCSWAuth } from "@codeswayam/auth/middleware";

/**
 * EMS Frontend — SSO Middleware
 *
 * All routes except /auth/callback and /api/* require authentication.
 * The SSO flow redirects unauthenticated users to the central auth service,
 * which issues a one-time ticket that /auth/callback exchanges for a JWT.
 *
 * The JWT is stored as both:
 *  - `Authentication` cookie (works for *.codeswayam.com subdomains + same-origin)
 *  - `csw_token` in localStorage (client-side fallback for custom domains)
 */
export default withCSWAuth({
    ssoUrl:       process.env.NEXT_PUBLIC_APP_AUTH_URL,
    callbackPath: "/auth/callback",
    publicPaths: [
        "/api",     // internal API routes (keep open for webhooks / health checks)
    ],
});

export const config = {
    matcher: [
        // Protect everything except Next.js internals, static assets, PWA files
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
    ],
};
