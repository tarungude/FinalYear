import api from "./api";

export const submitPreferences = (data) => api.post("/preferences", data).then((r) => r.data);
export const getMyPreferences = () => api.get("/preferences/me").then((r) => r.data);
