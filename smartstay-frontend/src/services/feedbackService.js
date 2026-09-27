import api from "./api";

export const submitFeedback = (data) => api.post("/feedback", data).then((r) => r.data);
export const getMyFeedback = () => api.get("/feedback/me").then((r) => r.data);
export const getAllFeedbackForAdmin = (params) => api.get("/feedback/admin/all", { params }).then((r) => r.data);
