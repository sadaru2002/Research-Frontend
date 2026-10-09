export interface User {
  id: number;
  email: string;
}
export interface Credentials {
  email: string;
  password: string;
}
export interface Project {
  id: number;
  name: string;
  created_at: string;
}
export interface ApiKey {
  id: number;
  project_id: number;
  key_value: string;
  created_at: string;
}
