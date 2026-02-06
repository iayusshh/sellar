import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CREATOR" | "BUYER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CREATOR" | "BUYER" | "ADMIN";
  }
}

// Ensures this file is treated as a module.
export {};
