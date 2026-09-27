import api from "./api";

export const getMyAllocation = () => api.get("/allocations/me").then((r) => r.data);
export const getAllocations = (params) => api.get("/allocations", { params }).then((r) => r.data);
export const createAllocation = (data) => api.post("/allocations", data).then((r) => r.data);
export const updateAllocation = (id, data) => api.put(`/allocations/${id}`, data).then((r) => r.data);
export const endAllocation = (id) => api.delete(`/allocations/${id}`).then((r) => r.data);
