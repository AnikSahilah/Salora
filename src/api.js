const API_URL = "http://localhost:5000/api"

export async function api(url, options = {}) {
  const token = localStorage.getItem("token")

  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || "Terjadi kesalahan")
  }

  return data
}

export function setToken(token) {
  localStorage.setItem("token", token)
}

export function getToken() {
  return localStorage.getItem("token")
}

export function removeToken() {
  localStorage.removeItem("token")
}

export function isAuthenticated() {
  return !!getToken()
}
