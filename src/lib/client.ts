"use client";

/** Thin fetch wrapper shared by every dashboard interaction. */
export async function callApi<T = Record<string, unknown>>(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "POST",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}). Please try again.`);
  }
  return data;
}

export const apiPost = <T,>(url: string, body?: unknown) => callApi<T>(url, "POST", body);
export const apiPatch = <T,>(url: string, body?: unknown) => callApi<T>(url, "PATCH", body);
export const apiDelete = <T,>(url: string) => callApi<T>(url, "DELETE");
