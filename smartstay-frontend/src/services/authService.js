import api from "./api";

export const signup = (data) => api.post("/auth/signup", data).then((r) => r.data);
export const login = (data) => api.post("/auth/login", data).then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
export const updateMe = (data) => api.put("/auth/me", data).then((r) => r.data);
