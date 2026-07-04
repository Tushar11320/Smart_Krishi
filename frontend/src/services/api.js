import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && token !== "null" && token !== "undefined" && token.trim() !== "") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

export function unwrapPage(response) {
  const body = response?.data?.data ?? response?.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.content)) {
    return body.content;
  }

  return [];
}

export function getPrimaryImage(item) {
  const image = item?.images?.find((img) => img.isPrimary) || item?.images?.[0];

  return (
    item?.image ||
    image?.imageUrl ||
    "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=900&q=80"
  );
}

export function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Price on request";
  }

  return `Rs ${Number(price).toLocaleString("en-IN")}`;
}

export default api;
