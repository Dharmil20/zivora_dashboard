// ──────────────────────────────────────────────
// User DTOs / Interfaces
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "staff" | "viewer";

export interface CreateUserDto {
  email: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: UserRole;
}
