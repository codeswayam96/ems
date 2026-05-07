import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const CORE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://core.codeswayam.com';

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    cookieStore.get('Authentication')?.value ||
    headerStore.get('authorization')?.replace('Bearer ', '');

  if (!token) return null;

  // Try local JWT verification first (works when JWT_SECRET matches issuer)
  if (JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        ssoUserId: decoded.sub.toString(),
        email: decoded.username || decoded.email,
        ...decoded
      };
    } catch {
      // Fall through to remote validation
    }
  }

  // Remote validation: ask core-api to validate the token
  try {
    const res = await fetch(`${CORE_API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.data || data;
    return {
      ssoUserId: (user.id || user.sub).toString(),
      email: user.email,
      ...user
    };
  } catch {
    return null;
  }
}
