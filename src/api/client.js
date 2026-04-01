import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      cookies: document.cookie
    });
    
    if (error.response?.status === 401) {
      sessionStorage.removeItem("hydra_token");
      sessionStorage.removeItem("productividad_user");
      
      // Solo redirigir a Hydra si NO estamos en desarrollo local
      const isLocalhost = window.location.hostname === "localhost";
      const hydraLogoutUrl = import.meta.env.VITE_HYDRA_LOGOUT_URL;
      
      if (!isLocalhost && hydraLogoutUrl && !hydraLogoutUrl.includes("example.com")) {
        window.location.href = hydraLogoutUrl;
      }
    }
    
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail;
      if (detail?.includes("No tienes acceso")) {
        sessionStorage.removeItem("hydra_token");
        sessionStorage.removeItem("productividad_user");
        window.location.href = "/no-access";
      }
    }
    
    return Promise.reject(error);
  }
);

export function setHydraCookie(token) {
  console.log("Setting hydra cookie...");
  document.cookie = `hydra_access=${token}; path=/; SameSite=Lax`;
  console.log("Cookies after setting:", document.cookie);
}

export function clearHydraCookie() {
  document.cookie = "hydra_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export { api };
export default api;
