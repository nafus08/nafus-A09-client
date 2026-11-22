import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';

const API = typeof window === 'undefined'
  ? 'http://127.0.0.1:5000'
  : window.location.origin;

export const authClient = createAuthClient({
  baseURL: API,
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [jwtClient()],
});
