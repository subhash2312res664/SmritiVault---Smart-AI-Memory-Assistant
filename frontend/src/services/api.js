import axios from "axios";

// ── Base URL ─────────────────────────────────────────────────────────────────
// Change this to your deployed backend URL when you go to production
const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error?.response?.data?.detail ||
      error?.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(msg));
  }
);

// ── API Methods ───────────────────────────────────────────────────────────────

/** Health check */
export const checkHealth = () => api.get("/");

/** Log a new item */
export const logItem = (item_name, location, log_type = "manual") =>
  api.post("/log_item", { item_name, location, log_type });

/** Search item by name (returns latest match) */
export const searchItem = (item_name) =>
  api.get(`/search_item/${encodeURIComponent(item_name)}`);

/** Update item location */
export const updateItem = (item_name, location) =>
  api.put(`/update_item/${encodeURIComponent(item_name)}`, { item_name, location });

/** Delete item */
export const deleteItem = (item_name) =>
  api.delete(`/delete_item/${encodeURIComponent(item_name)}`);

/** Get all logged items */
export const getAllItems = () => api.get("/all_items");

/** Upload image (Phase 2) */
export const uploadImage = (formData) =>
  api.post("/upload_image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/** AI Detect (Phase 3 - YOLO) */
export const detectItem = (formData) =>
  api.post("/detect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export default api;
export { BASE_URL };
