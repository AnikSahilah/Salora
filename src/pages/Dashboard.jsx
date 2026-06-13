import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, removeToken } from "../api.js"
import { useToast } from "../context/ToastContext.jsx"
import useNotificationPolling from "../hooks/useNotificationPolling.js"
import DashboardPemilik from "./pemilik/DashboardPemilik.jsx"
import DashboardPembeli from "./pembeli/DashboardPembeli.jsx"
import DashboardKurir from "./kurir/DashboardKurir.jsx"

function Dashboard() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useNotificationPolling(showToast)

  useEffect(() => {
    api("/auth/me")
      .then((data) => setUser(data))
      .catch(() => {
        removeToken()
        navigate("/login")
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return <div className="dashboard-loading">Memuat...</div>
  }

  if (!user) return null

  if (user.role === "PEMILIK") return <DashboardPemilik user={user} />
  if (user.role === "PEMBELI") return <DashboardPembeli user={user} />
  if (user.role === "KURIR") return <DashboardKurir user={user} />

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div className="container navbar-inner">
          <span className="navbar-logo">Salora</span>
          <span className="navbar-role">Dashboard {user.role}</span>
          <button className="btn btn-outline btn-sm" onClick={() => { removeToken(); navigate("/") }}>
            Keluar
          </button>
        </div>
      </nav>
      <div className="container" style={{ paddingTop: 40 }}>
        <p>Halaman {user.role} — menyusul.</p>
      </div>
    </div>
  )
}

export default Dashboard
