import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('Authentication')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      ssoUserId: decoded.sub.toString(),
      email: decoded.username || decoded.email,
      ...decoded
    };
  } catch (err) {
    return null;
  }
}
