// Auth.js v5 catch-all API route
// Handles: /api/auth/signin, /api/auth/signout, /api/auth/session, /api/auth/callback/credentials

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
