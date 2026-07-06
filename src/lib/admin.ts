/**
 * Admin access control — single source of truth for the admin allowlist,
 * usable from both client components (AdminAuth) and server API routes.
 */

export const ADMIN_EMAILS = [
  'curtisholder91@gmail.com',
  'curtisholder@gmail.com',
  'curtis@homeu.co',
  'cholder@excelsaholding.com',
];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
