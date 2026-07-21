export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  tracking_enabled: boolean;
  created_at: string;
}

export interface LocationRecord {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}
