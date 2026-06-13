import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, removeToken } from "../../api.js"
import { useToast } from "../../context/ToastContext.jsx"

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "umkm", label: "UMKM", icon: "🏪" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "pesanan", label: "Pesanan", icon: "📦" },
]

function DashboardAdmin({ user }) {
  const navigate = useNavigate()
  const [page, setPage] = useState("dashboard")

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo" onClick={() => navigate("/")}>Salora</span>
          <span className="sidebar-role">Admin</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.key} className={`sidebar-link ${page === item.key ? "sidebar-link-active" : ""}`}
              onClick={() => setPage(item.key)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user"><span>👤 {user.name}</span></div>
          <button className="sidebar-logout" onClick={() => { removeToken(); navigate("/") }}>🚪 Keluar</button>
        </div>
      </aside>
      <main className="sidebar-content">
        {page === "dashboard" && <AdminDashboard />}
        {page === "umkm" && <AdminUMKM />}
        {page === "users" && <AdminUsers />}
        {page === "pesanan" && <AdminPesanan />}
      </main>
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalUmkm: 0, pendingUmkm: 0, totalUsers: 0, totalOrders: 0 })

  useEffect(() => {
    Promise.all([
      api("/admin/users").then((d) => d.length).catch(() => 0),
      api("/admin/orders").then((d) => d.length).catch(() => 0),
      api("/admin/umkm/pending").then((d) => Array.isArray(d) ? d.length : 0).catch(() => 0),
    ]).then(([u, o, p]) => setStats({ totalUsers: u, totalOrders: o, pendingUmkm: p, totalUmkm: u }))
  }, [])

  return (
    <>
      <div className="page-header"><h2>Dashboard Admin</h2><p>Overview sistem Salora</p></div>
      <div className="stat-grid">
        <div className="stat-card"><span className="stat-icon">👥</span><div><p className="stat-number">{stats.totalUsers}</p><p className="stat-label">Total Users</p></div></div>
        <div className="stat-card"><span className="stat-icon">🏪</span><div><p className="stat-number">{stats.totalUmkm}</p><p className="stat-label">Total UMKM</p></div></div>
        <div className="stat-card"><span className="stat-icon">⏳</span><div><p className="stat-number">{stats.pendingUmkm}</p><p className="stat-label">Pending Verifikasi</p></div></div>
        <div className="stat-card"><span className="stat-icon">📦</span><div><p className="stat-number">{stats.totalOrders}</p><p className="stat-label">Total Pesanan</p></div></div>
      </div>
    </>
  )
}

function AdminUMKM() {
  const { showToast } = useToast()
  const [list, setList] = useState([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    api("/admin/umkm").then(setList).catch(() => {})
  }, [])

  async function verify(id, status) {
    try {
      await api(`/admin/umkm/${id}/verify`, { method: "PUT", body: JSON.stringify({ status }) })
      showToast(`UMKM ${status === "AKTIF" ? "disetujui" : "dinonaktifkan"}`, "success")
      setList((prev) => prev.map((u) => u.id === id ? { ...u, status } : u))
    } catch (err) { showToast(err.message, "error") }
  }

  const filtered = filter === "all" ? list : filter === "pending" ? list.filter((u) => u.status === "MENUNGGU") : list.filter((u) => u.status === filter)

  return (
    <>
      <div className="page-header"><h2>UMKM</h2></div>
      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {["all", "pending", "AKTIF", "NONAKTIF"].map((f) => (
          <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "Semua" : f === "pending" ? "Pending" : f}
          </button>
        ))}
      </div>
      {filtered.map((u) => (
        <div className="order-card" key={u.id} style={{ marginBottom: 12 }}>
          <div className="order-header">
            <strong>{u.nama}</strong>
            <span className={`order-status ${u.status === "AKTIF" ? "status-SELESAI" : u.status === "MENUNGGU" ? "status-MENUNGGU_PEMBAYARAN" : "status-DIBATALKAN"}`}>
              {u.status}
            </span>
          </div>
          <p className="card-text">👤 {u.pemilik?.name || "-"} • 📍 {u.kota} • ⭐ {u.rating}</p>
          {u.status === "MENUNGGU" && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => verify(u.id, "AKTIF")}>✅ Setujui</button>
              <button className="btn btn-outline btn-sm" style={{ borderColor: "#dc2626", color: "#dc2626" }} onClick={() => verify(u.id, "NONAKTIF")}>❌ Tolak</button>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState([])
  useEffect(() => { api("/admin/users").then(setUsers).catch(() => {}) }, [])

  return (
    <>
      <div className="page-header"><h2>Users</h2></div>
      {users.map((u) => (
        <div className="order-card" key={u.id} style={{ marginBottom: 8 }}>
          <div className="order-header">
            <strong>{u.name}</strong>
            <span className="order-status" style={{ background: "#e2e8f0", color: "#334155" }}>{u.role}</span>
          </div>
          <p className="card-text">📧 {u.email} • 📞 {u.phone || "-"}</p>
        </div>
      ))}
    </>
  )
}

function AdminPesanan() {
  const [orders, setOrders] = useState([])
  useEffect(() => { api("/admin/orders").then(setOrders).catch(() => {}) }, [])

  const filterLabels = { MENUNGGU_KONFIRMASI: "Baru", DIPROSES: "Diproses", SIAP_DIANTAR: "Siap Antar", DALAM_PERJALANAN: "Diantar", SELESAI: "Selesai", DIBATALKAN: "Batal" }

  return (
    <>
      <div className="page-header"><h2>Semua Pesanan</h2></div>
      {orders.map((o) => (
        <div className="order-card" key={o.id} style={{ marginBottom: 10 }}>
          <div className="order-header">
            <span className="order-code">{o.kodeOrder}</span>
            <span className={`order-status status-${o.status}`}>{filterLabels[o.status] || o.status}</span>
          </div>
          <p className="card-text">👤 {o.pembeli?.name} • 💳 {o.payment?.metode || "-"} • Rp {o.totalHarga?.toLocaleString()}</p>
          <div className="order-items">
            {o.orderItems?.map((item, i) => (
              <span key={i}>{item.menu?.nama} x{item.quantity}{i < o.orderItems.length - 1 ? ", " : ""}</span>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default DashboardAdmin
