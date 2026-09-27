import api from "./api";

export const getConversationsList = () => api.get("/messages").then((r) => r.data);
export const getConversation = (otherUserId) => api.get(`/messages/${otherUserId}`).then((r) => r.data);
export const sendMessage = (receiverId, content) =>
  api.post("/messages", { receiverId, content }).then((r) => r.data);
