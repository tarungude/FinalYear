import api from "./api";

export const getRooms = (params) => api.get("/rooms", { params }).then((r) => r.data);
export const createRoom = (data) => api.post("/rooms", data).then((r) => r.data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`).then((r) => r.data);
