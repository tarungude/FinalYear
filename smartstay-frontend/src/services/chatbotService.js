import api from "./api";

export const sendChatbotMessage = (message, history) =>
  api.post("/chatbot/message", { message, history }).then((r) => r.data);
