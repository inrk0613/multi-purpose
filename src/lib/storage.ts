import { Task } from "./types";

const TASKS_KEY = "silent-control-tasks-v1";
const SETTINGS_KEY = "silent-control-settings-v1";

export type Settings = {
  weekly_capacity_min: number; // minutes
};

export const defaultSettings: Settings = {
  weekly_capacity_min: 25 * 60
};

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Task[];
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const data = JSON.parse(raw) as Partial<Settings>;
    const weekly = typeof data.weekly_capacity_min === "number" ? data.weekly_capacity_min : defaultSettings.weekly_capacity_min;
    return { weekly_capacity_min: weekly };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
