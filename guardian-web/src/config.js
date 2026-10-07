// All environment-driven settings live here (no URLs hardcoded elsewhere).
const trim = (v = "") => v.replace(/\/+$/, "");

export const API_URL = trim(import.meta.env.VITE_API_URL);
export const SOCKET_URL =
  trim(import.meta.env.VITE_SOCKET_URL) || API_URL.replace(/\/api$/, "");
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
console.log("ENV:", import.meta.env.VITE_API_URL, import.meta.env.VITE_USE_MOCK);