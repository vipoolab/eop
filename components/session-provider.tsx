"use client";

// Wrapper สำหรับใช้ Auth.js context ใน client components
// เช่น useSession(), signIn(), signOut()

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
