import axios from "axios";

export const joinMafiaGame = (telegramId: string, name: string, inviteCode?: string) => {
  return axios.post("/api/mafia/join", {
    telegramId,
    name,
    inviteCode,
  });
};

export const getMafiaPlayers = (roomId: string) => {
  return axios.get(`/api/mafia/players/${roomId}`);
};

export const startMafiaGame = (roomId: string) => {
  return axios.post(`/api/mafia/start/${roomId}`);
};

export const createInviteCode = (roomId: string) => {
  return axios.post(`/api/mafia/create-invite/${roomId}`);
};

export const getRoomByInviteCode = (inviteCode: string) => {
  return axios.get(`/api/mafia/room-by-invite?code=${inviteCode}`);
};

export const getGameState = (roomId: string) => {
  return axios.get(`/api/mafia/state/${roomId}`);
};

export const submitRoleAction = (playerId: string, targetId: string, action: string, location?: string) => {
  return axios.post(`/api/mafia/submit-role-action`, {
    playerId,
    targetId,
    action,
    location,
  });
};

export const resolveNight = (roomId: string) => {
  return axios.post(`/api/mafia/resolve-night/${roomId}`);
};

export const submitVote = (voterId: string, targetId: string) => {
  return axios.post(`/api/mafia/vote`, {
    voterId,
    targetId,
  });
};

export const resolveVote = (roomId: string) => {
  return axios.post(`/api/mafia/resolve-vote/${roomId}`);
};

export const checkVictory = (roomId: string) => {
  return axios.post(`/api/mafia/check-victory/${roomId}`);
};

export const finishGame = (roomId: string) => {
  return axios.post(`/api/mafia/finish-game/${roomId}`);
};

export const moveToNextPhase = (roomId: string) => {
  return axios.post(`/api/mafia/next-phase/${roomId}`);
};

export const sendGift = (senderId: string, recipientId: string, giftType: string) => {
  return axios.post(`/api/mafia/send-gift`, {
    senderId,
    recipientId,
    giftType,
  });
};
