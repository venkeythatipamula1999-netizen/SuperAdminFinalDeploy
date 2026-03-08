// src/services/api.ts
import { auth } from "@/lib/firebase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getToken = async (): Promise<string | null> => {
  try { return auth.currentUser ? await auth.currentUser.getIdToken() : null; }
  catch { return null; }
};

const request = async <T>(path: string, method = "GET", body?: unknown): Promise<T | null> => {
  try {
    const token   = await getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const opts: RequestInit = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json();
    return data as T;
  } catch (e) {
    console.warn(`[API] ${method} ${path} failed:`, e);
    return null;
  }
};

export const api = {
  get:    <T>(path: string)              => request<T>(path, "GET"),
  post:   <T>(path: string, body: unknown) => request<T>(path, "POST", body),
  delete: <T>(path: string)              => request<T>(path, "DELETE"),
};
