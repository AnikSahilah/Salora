import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, removeToken } from "../../api.js"
import { useToast } from "../../context/ToastContext.jsx"
import ConfirmModal from "../../components/ConfirmModal.jsx"
import ImageUploader from "../../components/ImageUploader.jsx"

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "menu", label: "Menu", icon: "🍽️" },
  { key: "pesanan", label: "Pesanan", icon: "📦" },
  { key: "pengaturan", label: "Pengaturan", icon: "⚙️" },
]

function DashboardPemilik({ user }) {
  const navigate = useNavigate()
  const [page, setPage] = useState("dashboard")
  const [umkm, setUmkm] = useState(null)
  const [menus, setMenus] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const umkmData = await api("/umkm/me")
      setUmkm(umkmData)
      setMenus(umkmData.menus || [])
    } catch {
      setUmkm(null)
    }

    try {
      const orderData = await api("/orders/pemilik")
      setOrders(orderData)
    } catch {}

    setLoading(false)
  }

  if (loading) return <div className="dashboard-loading">Memuat...</div>

  if (!umkm) {
    return <CreateUmkmForm onCreated={loadData} />
  }

  const stats = {
    totalMenu: menus.length,
    tersedia: menus.filter((m) => m.tersedia).length,
    pesananBaru: orders.filter((o) => o.status === "DIPROSES").length,
    selesai: orders.filter((o) => o.status === "SELESAI").length,
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo" onClick={() => navigate("/")}>Salora</span>
          <span className="sidebar-role">Pemilik UMKM</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-link ${page === item.key ? "sidebar-link-active" : ""}`}
              onClick={() => setPage(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
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

      {/* Content */}
      <main className="sidebar-content">
        {page === "dashboard" && (
          <DashboardView umkm={umkm} stats={stats} orders={orders} menus={menus} />
        )}
        {page === "menu" && (
          <MenuView umkmId={umkm.id} menus={menus} onRefresh={loadData} />
        )}
        {page === "pesanan" && (
          <PesananView orders={orders} onRefresh={loadData} />
        )}
        {page === "pengaturan" && (
          <PengaturanView umkm={umkm} onRefresh={loadData} />
        )}
      </main>
    </div>
  )
}

/* ========== Dashboard Overview ========== */
function DashboardView({ umkm, stats, orders, menus }) {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Selamat datang kembali di {umkm.nama} 👋</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">🍽️</span>
          <div>
            <p className="stat-number">{stats.totalMenu}</p>
            <p className="stat-label">Total Menu</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div>
            <p className="stat-number">{stats.tersedia}</p>
            <p className="stat-label">Menu Tersedia</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <p className="stat-number">{stats.pesananBaru}</p>
            <p className="stat-label">Pesanan Baru</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div>
            <p className="stat-number">{umkm.rating}</p>
            <p className="stat-label">Rating</p>
          </div>
        </div>
      </div>

      <div className="card mt-24">
        <h3 className="card-title-sm">Info UMKM</h3>
        <div className="info-grid">
          <div><strong>Nama</strong><p>{umkm.nama}</p></div>
          <div><strong>Kategori</strong><p>{umkm.kategori}</p></div>
          <div><strong>Status</strong><p><span className="menu-status available">{umkm.status}</span></p></div>
          <div><strong>Alamat</strong><p>{umkm.alamat}, {umkm.kota}, {umkm.provinsi}</p></div>
          <div><strong>Rating</strong><p>⭐ {umkm.rating}</p></div>
          <div><strong>Ulasan</strong><p>{umkm._count?.reviews || 0} ulasan</p></div>
        </div>
      </div>

      {/* Pesanan Terbaru */}
      {orders.length > 0 && (
        <div className="card mt-24">
          <h3 className="card-title-sm">Pesanan Terbaru</h3>
          <div className="order-list">
            {orders.slice(0, 3).map((order) => (
              <div className="order-row" key={order.id}>
                <span className="order-code">{order.kodeOrder}</span>
                <span className="card-text">Rp {order.totalHarga.toLocaleString()}</span>
                <span className={`order-status status-${order.status}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/* ========== Menu Management ========== */
function MenuView({ umkmId, menus, onRefresh }) {
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editMenu, setEditMenu] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function handleDelete(id) {
    try {
      await api(`/menu/${id}`, { method: "DELETE" })
      showToast("Menu berhasil dihapus", "success")
      onRefresh()
    } catch (err) {
      showToast(err.message, "error")
    }
    setDeleteTarget(null)
  }

  async function toggleTersedia(menu) {
    try {
      await api(`/menu/${menu.id}`, {
        method: "PUT",
        body: JSON.stringify({ tersedia: !menu.tersedia }),
      })
      showToast(menu.tersedia ? "Menu dinonaktifkan" : "Menu diaktifkan", "success")
      onRefresh()
    } catch (err) {
      showToast(err.message, "error")
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Menu</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditMenu(null); setShowForm(true) }}>
          + Tambah Menu
        </button>
      </div>

      {menus.length === 0 ? (
        <p className="text-muted">Belum ada menu.</p>
      ) : (
        <div className="menu-grid">
          {menus.map((menu) => (
            <div className="menu-card" key={menu.id}>
              <div className="menu-body">
                <h4 className="menu-name">{menu.nama}</h4>
                <p className="menu-desc">{menu.deskripsi}</p>
                <p className="menu-price">Rp {menu.harga.toLocaleString()}</p>
                <label className="toggle-status" onClick={(e) => e.stopPropagation()}>
                  <span className={`menu-status ${menu.tersedia ? "available" : "unavailable"}`}>
                    {menu.tersedia ? "Tersedia" : "Habis"}
                  </span>
                  <span className={`toggle-switch ${menu.tersedia ? "toggle-on" : ""}`} onClick={() => toggleTersedia(menu)}>
                    <span className="toggle-slider" />
                  </span>
                </label>
              </div>
              <div className="menu-actions">
                <button className="btn-icon" onClick={() => { setEditMenu(menu); setShowForm(true) }}>✏️</button>
                <button className="btn-icon" onClick={() => setDeleteTarget(menu.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MenuFormModal
          umkmId={umkmId}
          editMenu={editMenu}
          onClose={() => { setShowForm(false); setEditMenu(null) }}
          onSave={onRefresh}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message="Yakin ingin menghapus menu ini?"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

function MenuFormModal({ umkmId, editMenu, onClose, onSave }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    nama: editMenu?.nama || "",
    deskripsi: editMenu?.deskripsi || "",
    harga: editMenu?.harga || "",
    foto: editMenu?.foto || "",
    tersedia: editMenu?.tersedia ?? true,
  })
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editMenu) {
        await api(`/menu/${editMenu.id}`, { method: "PUT", body: JSON.stringify(form) })
        showToast("Menu berhasil diupdate", "success")
      } else {
        await api(`/menu/${umkmId}`, { method: "POST", body: JSON.stringify(form) })
        showToast("Menu berhasil ditambahkan", "success")
      }
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleChange(e) {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editMenu ? "Edit Menu" : "Tambah Menu"}</h3>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Menu</label>
            <input type="text" name="nama" value={form.nama} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Harga (Rp)</label>
            <input type="number" name="harga" value={form.harga} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Foto Menu</label>
            <ImageUploader currentImage={form.foto} onUpload={(url) => setForm({ ...form, foto: url })} />
          </div>
          {(editMenu) && (
            <div className="form-group form-checkbox">
              <label>
                <input type="checkbox" name="tersedia" checked={form.tersedia} onChange={handleChange} />
                <span>Menu tersedia</span>
              </label>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary">{editMenu ? "Simpan" : "Tambah"}</button>
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ========== Pesanan ========== */
const pemilikFilters = ["Semua", "MENUNGGU_KONFIRMASI", "DIPROSES", "SIAP_DIANTAR", "DALAM_PERJALANAN", "SELESAI", "DIBATALKAN"]
const filterLabels = { MENUNGGU_KONFIRMASI: "Baru", DIPROSES: "Dimasak", SIAP_DIANTAR: "Siap Antar", DALAM_PERJALANAN: "Diantar", SELESAI: "Selesai", DIBATALKAN: "Batal" }

function PesananView({ orders, onRefresh }) {
  const { showToast } = useToast()
  const [filter, setFilter] = useState("Semua")

  const filtered = filter === "Semua" ? orders : orders.filter((o) => o.status === filter)

  async function handleStatus(orderId, status) {
    try {
      await api(`/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) })
      const label = status === "DIPROSES" ? "Pesanan diproses" : "Pesanan siap antar"
      showToast(label, "success")
      onRefresh()
    } catch (err) {
      showToast(err.message, "error")
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Pesanan Masuk</h2>
      </div>

      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {pemilikFilters.map((f) => (
          <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {filterLabels[f] || f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">Tidak ada pesanan.</p>
      ) : (
        <div className="order-list">
          {filtered.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <span className="order-code">{order.kodeOrder}</span>
                <span className={`order-status status-${order.status}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="card-text">👤 {order.pembeli.name} • 📞 {order.pembeli.phone}</p>
              <p className="card-text">📍 {order.orderItems[0]?.menu.umkmId ? "Lihat pesanan" : ""}</p>
              <div className="order-items">
                {order.orderItems.map((item, i) => (
                  <span key={i}>
                    {item.menu.nama} x{item.quantity}
                    {i < order.orderItems.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
              <p className="menu-price">Rp {order.totalHarga.toLocaleString()}</p>

              {order.status === "MENUNGGU_KONFIRMASI" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatus(order.id, "DIPROSES")}>
                    ✅ Terima Pesanan
                  </button>
                  <button className="btn btn-outline btn-sm"
                    style={{ borderColor: "#dc2626", color: "#dc2626" }}
                    onClick={() => handleStatus(order.id, "DIBATALKAN")}>
                    ❌ Tolak
                  </button>
                </div>
              )}
              {order.status === "DIPROSES" && (
                <button className="btn btn-primary btn-sm" onClick={() => handleStatus(order.id, "SIAP_DIANTAR")}>
                  Tandai Siap Antar
                </button>
              )}
              {order.delivery && (
                <p className="card-text" style={{ marginTop: 8 }}>
                  🚚 Kurir: {order.delivery.kurir?.name || "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ========== Pengaturan ========== */
function PengaturanView({ umkm, onRefresh }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    nama: umkm.nama || "",
    deskripsi: umkm.deskripsi || "",
    kategori: umkm.kategori || "",
    alamat: umkm.alamat || "",
    kota: umkm.kota || "",
    provinsi: umkm.provinsi || "",
    foto: umkm.foto || "",
  })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await api(`/umkm/${umkm.id}`, { method: "PUT", body: JSON.stringify(form) })
      showToast("Data UMKM berhasil disimpan", "success")
      onRefresh()
    } catch (err) {
      showToast(err.message, "error")
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <>
      <div className="page-header">
        <h2>Pengaturan UMKM</h2>
      </div>

      <div className="form-card" style={{ maxWidth: "100%" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama UMKM</label>
            <input type="text" name="nama" value={form.nama} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Kategori</label>
            <select name="kategori" value={form.kategori} onChange={handleChange} required>
              <option value="Makanan Berat">Makanan Berat</option>
              <option value="Sate & Bakar">Sate & Bakar</option>
              <option value="Cemilan">Cemilan</option>
              <option value="Minuman">Minuman</option>
              <option value="Kue">Kue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Alamat</label>
            <input type="text" name="alamat" value={form.alamat} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Foto UMKM</label>
            <ImageUploader currentImage={form.foto} onUpload={(url) => setForm({ ...form, foto: url })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Kota</label>
              <input type="text" name="kota" value={form.kota} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Provinsi</label>
              <input type="text" name="provinsi" value={form.provinsi} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
        </form>
      </div>
    </>
  )
}

/* ========== Create UMKM (kalo belum punya) ========== */
function CreateUmkmForm({ onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nama: "", deskripsi: "", kategori: "", alamat: "", kota: "", provinsi: "", foto: "" })
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await api("/umkm", { method: "POST", body: JSON.stringify(form) })
      onCreated()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="dashboard-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="form-card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>🏪</span>
          <h3 style={{ marginTop: 8, fontSize: 22 }}>Daftarkan UMKM Kamu</h3>
          <p className="card-text">Isi data UMKM kamu untuk mulai berjualan di Salora</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama UMKM</label>
            <input type="text" name="nama" value={form.nama} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Kategori</label>
            <select name="kategori" value={form.kategori} onChange={handleChange} required>
              <option value="">Pilih kategori</option>
              <option value="Makanan Berat">Makanan Berat</option>
              <option value="Sate & Bakar">Sate & Bakar</option>
              <option value="Cemilan">Cemilan</option>
              <option value="Minuman">Minuman</option>
              <option value="Kue">Kue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Alamat</label>
            <input type="text" name="alamat" value={form.alamat} onChange={handleChange} required />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Kota</label>
              <input type="text" name="kota" value={form.kota} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Provinsi</label>
              <input type="text" name="provinsi" value={form.provinsi} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full">Daftarkan UMKM</button>
        </form>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="btn btn-outline btn-sm" onClick={() => { removeToken(); navigate("/") }}>Kembali</button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPemilik
