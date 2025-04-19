import axios from "axios"

export const authTelegram = (user: any) => {
  return axios.post("/api/auth/telegram", {
    telegramId: user.id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    photoUrl: user.photo_url,
    isPremium: user.is_premium,
  })
}
