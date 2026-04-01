import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("hydra_token");
  
  if (token) {
    config.headers["X-Access-Token"] = token;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("hydra_token");
      sessionStorage.removeItem("productividad_user");
    }
    
    return Promise.reject(error);
  }
);

export function setHydraCookie(token) {
  document.cookie = `hydra_access=${token}; path=/; SameSite=Lax; max-age=86400`;
  sessionStorage.setItem("hydra_token", token);
}

export function clearHydraCookie() {
  document.cookie = "hydra_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export { api };
export default api;