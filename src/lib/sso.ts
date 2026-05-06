const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchUsersBatch(
  ids: (string | number)[],
  options?: RequestInit,
): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/users/batch`, {
    ...options,
    method: 'POST',
    body: JSON.stringify({ ids }),
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function populateSsoUsers<T extends Record<string, any>>(
  items: T[],
  ssoKey: keyof T = 'ssoUserId' as keyof T,
  targetKey?: string,
  options?: RequestInit,
): Promise<T[]> {
  if (!items || items.length === 0) return items;

  const idsToFetch = new Set<string | number>();
  items.forEach((item) => {
    const val = item[ssoKey];
    if (typeof val === 'string' || typeof val === 'number') idsToFetch.add(val);
  });

  if (idsToFetch.size === 0) return items;

  const users = await fetchUsersBatch(Array.from(idsToFetch), options).catch(() => []);
  const userMap: Record<string, any> = {};
  users.forEach((u: any) => { userMap[String(u.id)] = u; });

  return items.map((item) => {
    const val = item[ssoKey];
    const user = userMap[String(val)];
    if ((typeof val === 'string' || typeof val === 'number') && user) {
      return { ...item, [targetKey ?? (ssoKey as string)]: user };
    }
    return item;
  });
}
