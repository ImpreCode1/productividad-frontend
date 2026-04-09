import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let isRedirecting = false;

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("hydra_token");
  
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      sessionStorage.removeItem("hydra_token");
      sessionStorage.removeItem("productividad_user");
      
      const loginUrl = import.meta.env.VITE_HYDRA_LOGOUT_URL || "/login";
      window.location.href = loginUrl;
      return new Promise(() => {});
    }
    
    return Promise.reject(error);
  }
);

export function setHydraCookie(token) {
  const ONE_HOUR = 3600;
  document.cookie = `hydra_access=${token}; path=/; SameSite=Lax; max-age=${ONE_HOUR}`;
  sessionStorage.setItem("hydra_token", token);
}

export function clearHydraCookie() {
  document.cookie = "hydra_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export { api };
export default api;