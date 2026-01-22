import api from "./axios"

export async function login(username: string, password: string) {
  const formData = new URLSearchParams()
  formData.append("username", username)
  formData.append("password", password)

  const res = await api.post("/auth/login", formData)
  return res.data
}

export async function logout() {
  await api.post("/auth/logout")
}
