export type TaskStatus = "backlog" | "planned" | "doing" | "done";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";

export type Domain = "RISE" | "Thesis" | "Work" | "Personal" | string;

export type Task = {
  id: string;
  title: string;
  due_at: string | null; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
  eta_min: number; // minutes
  priority: TaskPriority;
  status: TaskStatus;
  domain: Domain;
  next_action: string;
  planned_for: string | null; // "YYYY-MM-DD"
  created_at: number;
  updated_at: number;
};
