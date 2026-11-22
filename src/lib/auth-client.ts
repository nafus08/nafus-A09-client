import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const authClient = createAuthClient({
  baseURL: API,
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [jwtClient()],
});
