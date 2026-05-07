import axios from 'axios';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Always inject the stored Bearer token for every request.
// This is the cross-domain fix: cookies can't cross origins, but the
// Authorization header works from localhost → production API.
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('csw_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isAuthPage = pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup';
        
        if (isAuthPage) {
          console.warn("[EMS API] Unauthorized on auth page, avoiding loop.");
          return Promise.reject(error);
        }

        // Resolve SSO URL from window global (set by CSWProvider) or env var
        const ssoUrl =
          (window as any).__CSW_SSO_URL ||
          process.env.NEXT_PUBLIC_APP_AUTH_URL ||
          'https://auth.codeswayam.com/sso';

        // Pass the callback URL as the redirect target.
        const callbackUrl = `${window.location.origin}/auth/callback`;
        const redirectUrl = new URL(ssoUrl);
        redirectUrl.searchParams.set('redirect', callbackUrl);
        window.location.href = redirectUrl.toString();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
