import type { Member } from "./Member";

export interface Project {
  id: string;
  name: string;
  version: string;
  owner: string;
  project_status: string;
  members: Member[];
  created_at: string;
}