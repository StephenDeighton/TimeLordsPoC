export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  interests: string[];
  services_offered: string[];
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}