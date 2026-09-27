import api from "./api";

export const getAllStudents = (params) => api.get("/admin/students", { params }).then((r) => r.data);
export const getStudentById = (id) => api.get(`/admin/students/${id}`).then((r) => r.data);
export const getDashboardStats = () => api.get("/admin/stats").then((r) => r.data);
