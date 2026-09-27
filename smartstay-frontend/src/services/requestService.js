import api from "./api";

export const sendRequest = (receiverId, message) =>
  api.post("/requests", { receiverId, message }).then((r) => r.data);
export const getReceivedRequests = () => api.get("/requests/received").then((r) => r.data);
export const getSentRequests = () => api.get("/requests/sent").then((r) => r.data);
export const respondToRequest = (id, action) =>
  api.put(`/requests/${id}/respond`, { action }).then((r) => r.data);
export const cancelRequest = (id) => api.delete(`/requests/${id}`).then((r) => r.data);
export const getAllRequestsForAdmin = (params) =>
  api.get("/requests/admin/all", { params }).then((r) => r.data);
