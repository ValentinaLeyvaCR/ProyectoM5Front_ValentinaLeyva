export type UserRole = "customer" | "admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
}
