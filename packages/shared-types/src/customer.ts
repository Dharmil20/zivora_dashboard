// ──────────────────────────────────────────────
// Customer DTOs / Interfaces
// ──────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}
