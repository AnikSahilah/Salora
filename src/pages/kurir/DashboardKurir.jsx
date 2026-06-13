import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, removeToken } from "../../api.js"
import { useToast } from "../../context/ToastContext.jsx"
import ConfirmModal from "../../components/ConfirmModal.jsx"

const sidebarItems = [
  { key: "ambil", label: "Ambil Pesanan", icon: "📦" },
  { key: "tugas", label: "Tugasku", icon: "🚚" },
]

function DashboardKurir({ user }) {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [page, setPage] = useState("ambil")
  const [refresh, setRefresh] = useState(0)

  async function updateLokasiKurir() {
    if (!navigator.geolocation) {
      showToast("Browser tidak mendukung geolokasi", "error")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api("/location/me", {
            method: "PUT",
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          })
          showToast("Lokasi berhasil diperbarui! 📍", "success")
        } catch {
          showToast("Gagal update lokasi", "error")
        }
      },
      () => showToast("Gagal mendapatkan lokasi", "error"),
      { timeout: 10000 }
    )
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo" onClick={() => navigate("/")}>Salora</span>
          <span className="sidebar-role">Kurir</span>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-link ${page === item.key ? "sidebar-link-active" : ""}`}
              onClick={() => setPage(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="sidebar-link" onClick={updateLokasiKurir}>
            <span>📍</span>
            <span>Update Lokasi Saya</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span>👤 {user.name}</span>
          </div>
          <button className="sidebar-logout" onClick={() => { removeToken(); navigate("/") }}>
            🚪 Keluar
          </button>
        </div>
      </aside>

      <main className="sidebar-content">
        {page === "ambil" && <AmbilPesananView key={refresh} onAmbil={() => setRefresh((n) => n + 1)} />}
        {page === "tugas" && <TugaskuView key={refresh} onUpdate={() => setRefresh((n) => n + 1)} />}
      </main>
    </div>
  )
}

function AmbilPesananView({ onAmbil }) {
  const { showToast } = useToast()
  const [available, setAvailable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api("/delivery/available").then((data) => setAvailable(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleClaim(orderId) {
    try {
      await api(`/delivery/${orderId}/claim`, { method: "PUT" })
      showToast("Pesanan berhasil diambil! 🚚", "success")
      onAmbil()
    } catch (err) {
      showToast(err.message, "error")
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Ambil Pesanan</h2>
        <p>Pesanan yang siap diantar dan belum ada kurir</p>
      </div>

      {loading ? (
        <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Memuat...</p>
      ) : available.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📭</span>
          <p>Tidak ada pesanan yang tersedia saat ini.</p>
        </div>
      ) : (
        <div className="kurir-list">
          {available.map((order) => (
            <div className="kurir-card" key={order.id}>
              <div className="kurir-card-header">
                <div>
                  <span className="order-code">{order.kodeOrder}</span>
                  <span className={`order-status status-SIAP_DIANTAR`} style={{ marginLeft: 8 }}>SIAP DIANTAR</span>
                </div>
                <span className="menu-price">Rp {order.totalHarga.toLocaleString()}</span>
              </div>
              <div className="kurir-card-body">
                <p>👤 {order.pembeli.name} • 📞 {order.pembeli.phone}</p>
                <p>📍 {order.pembeli.alamat}</p>
                <div className="kurir-items">
                  {order.orderItems.map((item, i) => (
                    <span key={i}>{item.menu.nama} x{item.quantity}{i < order.orderItems.length - 1 ? ", " : ""}</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={() => handleClaim(order.id)}>
                📦 Ambil Pesanan
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function TugaskuView({ onUpdate }) {
  const { showToast } = useToast()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("Semua")
  const [confirmTarget, setConfirmTarget] = useState(null)

  useEffect(() => {
    api("/delivery/me").then((data) => setDeliveries(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === "Semua" ? deliveries :
    filter === "Aktif" ? deliveries.filter((d) => d.status !== "TERKIRIM") :
    deliveries.filter((d) => d.status === "TERKIRIM")

  async function handleStatus(orderId, status) {
    try {
      await api(`/delivery/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) })
      showToast("Status berhasil diupdate", "success")
      onUpdate()
    } catch (err) {
      showToast(err.message, "error")
    }
    setConfirmTarget(null)
  }

  function confirmSebelum(orderId, status) {
    const label = status === "DIJEMPUT" ? "Jemput pesanan ini?" :
      status === "DALAM_PERJALANAN" ? "Tandai dalam perjalanan?" : "Tandai pesanan terkirim?"
    setConfirmTarget({ orderId, status, label })
  }

  return (
    <>
      <div className="page-header">
        <h2>Tugasku</h2>
        <p>Daftar pesanan yang sedang kamu antar</p>
      </div>

      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {["Semua", "Aktif", "Selesai"].map((f) => (
          <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {f} ({f === "Semua" ? deliveries.length : f === "Aktif" ? deliveries.filter((d) => d.status !== "TERKIRIM").length : deliveries.filter((d) => d.status === "TERKIRIM").length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏍️</span>
          <p>Tidak ada tugas dengan filter ini.</p>
        </div>
      ) : (
        <div className="kurir-list">
          {deliveries.map((d) => (
            <div className={`kurir-card ${d.status === "TERKIRIM" ? "kurir-card-done" : ""}`} key={d.id}>
              <div className="kurir-card-header">
                <div>
                  <span className="order-code">{d.order.kodeOrder}</span>
                  <span className={`order-status status-${d.order.status}`} style={{ marginLeft: 8 }}>
                    {d.order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="menu-price">Rp {d.order.totalHarga.toLocaleString()}</span>
              </div>
              <div className="kurir-card-body">
                <p>👤 {d.order.pembeli.name} • 📞 {d.order.pembeli.phone}</p>
                <p>📍 {d.order.pembeli.alamat}</p>
                <div className="kurir-items">
                  {d.order.orderItems.map((item, i) => (
                    <span key={i}>{item.menu.nama} x{item.quantity}{i < d.order.orderItems.length - 1 ? ", " : ""}</span>
                  ))}
                </div>
              </div>
              <div className="kurir-actions">
                {d.status === "MENUNGGU_KURIR" && (
                  <button className="btn btn-primary btn-full" onClick={() => confirmSebelum(d.orderId, "DIJEMPUT")}>
                    ✅ Jemput Pesanan
                  </button>
                )}
                {d.status === "DIJEMPUT" && (
                  <button className="btn btn-primary btn-full" onClick={() => confirmSebelum(d.orderId, "DALAM_PERJALANAN")}>
                    🚚 Dalam Perjalanan
                  </button>
                )}
                {d.status === "DALAM_PERJALANAN" && (
                  <button className="btn btn-success btn-full" onClick={() => confirmSebelum(d.orderId, "TERKIRIM")}>
                    ✅ Tandai Terkirim
                  </button>
                )}
                {d.status === "TERKIRIM" && (
                  <p className="kurir-done">✓ Pesanan terkirim</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmTarget && (
        <ConfirmModal
          message={confirmTarget.label}
          confirmText="Ya, Lanjutkan"
          danger={false}
          onConfirm={() => handleStatus(confirmTarget.orderId, confirmTarget.status)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </>
  )
}

export default DashboardKurir
