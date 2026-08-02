import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getRefresh, setTokens, scheduleRefresh } from "./auth";

const base = ((): string => {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    if (envBase) return envBase;
    if (typeof window === "undefined") return "http://127.0.0.1:8000/api/";
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:8000/api/`;
})();

const api = axios.create({
    baseURL: base,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access");

    if (token) {
        const prev = (config.headers as Record<string, string>) || {};
        config.headers = {
            ...prev,
            Authorization: `Bearer ${token}`,
        } as any;
    }

    return config;
});

// handle 401 responses: clear tokens and redirect to login
// response interceptor with refresh-token handling
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error?.config;
        const status = error?.response?.status;

        if (status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            const refresh = getRefresh();
            if (refresh) {
                try {
                    const r = await axios.post(api.defaults.baseURL + "token/refresh/", { refresh });
                    const newAccess = r.data?.access;
                    if (newAccess) {
                        setTokens(newAccess, refresh);
                        scheduleRefresh(newAccess);
                        originalRequest.headers = {
                            ...(originalRequest.headers || {}),
                            Authorization: `Bearer ${newAccess}`,
                        };
                        return axios(originalRequest);
                    }
                } catch (e) {
                    // refresh failed
                }
            }
            clearTokens();
            if (typeof window !== "undefined") window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default api;
