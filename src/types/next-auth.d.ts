import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: string;
    sid?: string;
  }
  interface Session {
    sid?: string;
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    sid?: string;
  }
}
