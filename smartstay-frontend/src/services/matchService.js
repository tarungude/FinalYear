import api from "./api";

export const getRecommendations = () => api.get("/matches/recommendations").then((r) => r.data);
export const getRoomRecommendations = () => api.get("/matches/rooms-for-me").then((r) => r.data);
export const getMatchExplanation = (matchId) =>
  api.get(`/matches/${matchId}/explanation`).then((r) => r.data);
export const getMatchOverview = () => api.get("/matches/overview").then((r) => r.data);
