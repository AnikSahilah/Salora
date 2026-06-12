import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, removeToken } from "../../api.js"

function DashboardKurir({ user }) {
  const navigate = useNavigate()
  const [available, setAvailable] = useState([])
  const [myDeliveries, setMyDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("tersedia")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [avail, mine] = await Promise.all([
        api("/delivery/available"),
        api("/delivery/me"),
      ])
      setAvailable(avail)
      setMyDeliveries(mine)
    } catch {}
    setLoading(false)
  }

  async function handleClaim(orderId) {
    try {
      await api(`/delivery/${orderId}/claim`, { method: "PUT" })
      loadData()
    } catch {}
  }

  async function handleUpdateStatus(orderId, status) {
    const label = status === "DIJEMPUT" ? "Jemput pesanan?" :
      status === "DALAM_PERJALANAN" ? "Tandai dalam perjalanan?" : "Tandai terkirim?"
    if (!confirm(label)) return

    try {
      await api(`/delivery/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      loadData()
    } catch {}
  }

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div className="container navbar-inner">
          <span className="navbar-logo">Salora</span>
          <span className="navbar-role">Kurir</span>
          <button className="btn btn-outline btn-sm" onClick={() => { removeToken(); navigate("/") }}>
            Keluar
          </button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Tabs */}
        <div className="kurir-tabs">
          <button
            className={`kurir-tab ${tab === "tersedia" ? "kurir-tab-active" : ""}`}
            onClick={() => setTab("tersedia")}
          >
            📦 Tersedia ({available.length})
          </button>
          <button
            className={`kurir-tab ${tab === "tugas" ? "kurir-tab-active" : ""}`}
            onClick={() => setTab("tugas")}
          >
            🚚 Tugasku ({myDeliveries.length})
          </button>
        </div>

        {loading ? (
          <p className="dashboard-loading">Memuat...</p>
        ) : tab === "tersedia" ? (
          available.length === 0 ? (
            <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>
              Tidak ada pesanan yang tersedia saat ini.
            </p>
          ) : (
            <div className="kurir-list">
              {available.map((order) => (
                <div className="kurir-card" key={order.id}>
                  <div className="kurir-card-header">
                    <span className="order-code">{order.kodeOrder}</span>
                    <span className="order-status status-SIAP_DIANTAR">SIAP DIANTAR</span>
                  </div>
                  <div className="kurir-card-body">
                    <p>👤 {order.pembeli.name}</p>
                    <p>📍 {order.pembeli.alamat}</p>
                    <p>📞 {order.pembeli.phone}</p>
                    <div className="kurir-items">
                      {order.orderItems.map((item, i) => (
                        <span key={i}>
                          {item.menu.nama} x{item.quantity}
                          {i < order.orderItems.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                    <p className="menu-price" style={{ margin: "8px 0 0" }}>
                      Rp {order.totalHarga.toLocaleString()}
                    </p>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={() => handleClaim(order.id)}>
                    Ambil Pesanan
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          myDeliveries.length === 0 ? (
            <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>
              Belum ada tugas.
            </p>
          ) : (
            <div className="kurir-list">
              {myDeliveries.map((d) => (
                <div className="kurir-card" key={d.id}>
                  <div className="kurir-card-header">
                    <span className="order-code">{d.order.kodeOrder}</span>
                    <span className={`order-status status-${d.order.status}`}>
                      {d.order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="kurir-card-body">
                    <p>👤 {d.order.pembeli.name}</p>
                    <p>📍 {d.order.pembeli.alamat}</p>
                    <p>📞 {d.order.pembeli.phone}</p>
                    <div className="kurir-items">
                      {d.order.orderItems.map((item, i) => (
                        <span key={i}>
                          {item.menu.nama} x{item.quantity}
                          {i < d.order.orderItems.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                    <p className="menu-price" style={{ margin: "8px 0 0" }}>
                      Rp {d.order.totalHarga.toLocaleString()}
                    </p>
                  </div>
                  <div className="kurir-actions">
                    {d.status === "MENUNGGU_KURIR" && (
                      <button className="btn btn-primary btn-full" onClick={() => handleUpdateStatus(d.orderId, "DIJEMPUT")}>
                        ✅ Jemput Pesanan
                      </button>
                    )}
                    {d.status === "DIJEMPUT" && (
                      <button className="btn btn-primary btn-full" onClick={() => handleUpdateStatus(d.orderId, "DALAM_PERJALANAN")}>
                        🚚 Dalam Perjalanan
                      </button>
                    )}
                    {d.status === "DALAM_PERJALANAN" && (
                      <button className="btn btn-success btn-full" onClick={() => handleUpdateStatus(d.orderId, "TERKIRIM")}>
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
          )
        )}
      </div>
    </div>
  )
}

export default DashboardKurir
