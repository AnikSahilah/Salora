import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, removeToken } from "../../api.js"
import { useToast } from "../../context/ToastContext.jsx"

const sidebarItems = [
  { key: "jelajah", label: "Jelajahi", icon: "🔍" },
  { key: "pesanan", label: "Pesanan Saya", icon: "📋" },
]

const categories = [
  "Semua", "Makanan Berat", "Sate & Bakar", "Cemilan", "Minuman", "Kue",
]

function DashboardPembeli({ user }) {
  const navigate = useNavigate()
  const [page, setPage] = useState("jelajah")

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo" onClick={() => navigate("/")}>Salora</span>
          <span className="sidebar-role">Pembeli</span>
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
        {page === "jelajah" && <JelajahiView userId={user.id} />}
        {page === "pesanan" && <PesananSayaView />}
      </main>
    </div>
  )
}

/* ========== Jelajahi UMKM ========== */
function JelajahiView({ userId }) {
  const [umkmList, setUmkmList] = useState([])
  const [search, setSearch] = useState("")
  const [kategori, setKategori] = useState("Semua")
  const [detailUmkm, setDetailUmkm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api("/umkm").then((data) => setUmkmList(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = umkmList.filter((u) => {
    const matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.deskripsi?.toLowerCase().includes(search.toLowerCase())
    const matchKategori = kategori === "Semua" || u.kategori === kategori
    return matchSearch && matchKategori
  })

  if (detailUmkm) {
    return <DetailUmkmView umkm={detailUmkm} onBack={() => setDetailUmkm(null)} userId={userId} />
  }

  return (
    <>
      <div className="page-header">
        <h2>Jelajahi Kuliner</h2>
        <p>Temukan UMKM favorit dari seluruh Nusantara</p>
      </div>

      <div className="pembeli-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Cari UMKM atau menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${kategori === cat ? "chip-active" : ""}`}
              onClick={() => setKategori(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>UMKM tidak ditemukan</p>
      ) : (
        <div className="pembeli-grid">
          {filtered.map((umkm) => (
            <div className="pembeli-card" key={umkm.id} onClick={() => setDetailUmkm(umkm)}>
              <div className="pembeli-card-header">
                <span className="umkm-category">{umkm.kategori}</span>
                <span className="pembeli-rating">⭐ {umkm.rating}</span>
              </div>
              <h3 className="pembeli-card-title">{umkm.nama}</h3>
              <p className="pembeli-card-desc">{umkm.deskripsi}</p>
              <div className="pembeli-card-footer">
                <span>📍 {umkm.kota}</span>
                <span>{umkm._count?.reviews || 0} ulasan</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ========== Detail UMKM (full page) ========== */
function DetailUmkmView({ umkm, onBack, userId }) {
  const { showToast } = useToast()
  const [detail, setDetail] = useState(null)
  const [cart, setCart] = useState({})

  useEffect(() => {
    api(`/umkm/${umkm.id}`).then(setDetail).catch(() => {})
  }, [umkm.id])

  function toggleCart(menuId) {
    setCart((prev) => {
      const next = { ...prev }
      if (next[menuId]) {
        delete next[menuId]
      } else {
        next[menuId] = 1
      }
      return next
    })
  }

  function updateQty(menuId, qty) {
    if (qty <= 0) {
      setCart((prev) => {
        const next = { ...prev }
        delete next[menuId]
        return next
      })
    } else {
      setCart((prev) => ({ ...prev, [menuId]: qty }))
    }
  }

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalHarga = detail
    ? Object.entries(cart).reduce((sum, [menuId, qty]) => {
        const menu = detail.menus.find((m) => m.id === parseInt(menuId))
        return sum + (menu ? menu.harga * qty : 0)
      }, 0)
    : 0

  function getSelectedMenus() {
    if (!detail) return []
    return Object.entries(cart).map(([menuId, qty]) => {
      const menu = detail.menus.find((m) => m.id === parseInt(menuId))
      return { menu, qty }
    })
  }

  return (
    <>
      <div className="page-header">
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Kembali</button>
      </div>

      <div className="detail-header-card">
        <div>
          <h2 className="detail-title">{umkm.nama}</h2>
          <p className="detail-meta">
            {umkm.kategori} • ⭐ {umkm.rating} • 📍 {umkm.kota}, {umkm.provinsi}
          </p>
          <p className="detail-desc">{umkm.deskripsi}</p>
        </div>
      </div>

      <div className="detail-two-column">
        {/* Left: Menu + Reviews */}
        <div className="detail-main">
          <h3 className="detail-section-title">Menu</h3>
          {detail && detail.menus.length === 0 ? (
            <p className="text-muted">Belum ada menu.</p>
          ) : detail ? (
            <div className="detail-menu-list">
              {detail.menus.map((menu) => (
                <div className={`detail-menu-item ${cart[menu.id] ? "detail-menu-selected" : ""}`} key={menu.id}>
                  <div className="detail-menu-info">
                    <h4>{menu.nama}</h4>
                    <p>{menu.deskripsi}</p>
                    <span className="menu-price">Rp {menu.harga.toLocaleString()}</span>
                  </div>
                  <div className="detail-menu-cart">
                    {cart[menu.id] ? (
                      <div className="cart-qty">
                        <button className="qty-btn" onClick={() => updateQty(menu.id, cart[menu.id] - 1)}>−</button>
                        <span className="qty-num">{cart[menu.id]}</span>
                        <button className="qty-btn" onClick={() => updateQty(menu.id, cart[menu.id] + 1)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => toggleCart(menu.id)}>+ Tambah</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Memuat...</p>
          )}

          <h3 className="detail-section-title">Ulasan</h3>
          {detail && detail.reviews.length === 0 ? (
            <p className="text-muted">Belum ada ulasan.</p>
          ) : detail ? (
            <div className="detail-review-list">
              {detail.reviews.map((review) => (
                <div className="detail-review-item" key={review.id}>
                  <div className="detail-review-header">
                    <strong>{review.pembeli.name}</strong>
                    <span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  </div>
                  <p>{review.komentar}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Memuat...</p>
          )}
        </div>

        {/* Right: Cart */}
        <div className="detail-sidebar-cart">
          <div className="cart-sticky">
            <h3 className="detail-section-title" style={{ borderTop: "none", marginTop: 0 }}>🛒 Pesanan</h3>
            {totalItems === 0 ? (
              <p className="text-muted">Belum ada item dipilih.</p>
            ) : (
              <>
                <div className="cart-items-list">
                  {getSelectedMenus().map(({ menu, qty }) => (
                    <div className="cart-item" key={menu.id}>
                      <div className="cart-item-info">
                        <p className="cart-item-name">{menu.nama}</p>
                        <p className="cart-item-price">Rp {(menu.harga * qty).toLocaleString()}</p>
                      </div>
                      <div className="cart-qty-sm">
                        <button className="qty-btn-sm" onClick={() => updateQty(menu.id, qty - 1)}>−</button>
                        <span>{qty}</span>
                        <button className="qty-btn-sm" onClick={() => updateQty(menu.id, qty + 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <span>Total</span>
                  <span className="cart-total-price">Rp {totalHarga.toLocaleString()}</span>
                </div>
                <CheckoutButton
                  menus={getSelectedMenus()}
                  totalHarga={totalHarga}
                  umkmId={umkm.id}
                  onSuccess={onBack}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ========== Checkout ========== */
function CheckoutButton({ menus, totalHarga, umkmId, onSuccess }) {
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [metodeAlamat, setMetodeAlamat] = useState("manual")
  const [alamatKirim, setAlamatKirim] = useState("")
  const [catatan, setCatatan] = useState("")
  const [loading, setLoading] = useState(false)
  const [mendeteksi, setMendeteksi] = useState(false)
  const [metodeBayar, setMetodeBayar] = useState("COD")

  function deteksiLokasi() {
    if (!navigator.geolocation) {
      showToast("Browser tidak mendukung geolokasi", "error")
      return
    }

    setMendeteksi(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=id`,
            { headers: { "User-Agent": "Salora/1.0" } }
          )
          const data = await res.json()
          const addr = data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`
          setAlamatKirim(addr)
          showToast("Lokasi berhasil dideteksi", "success")
        } catch {
          setAlamatKirim(`${pos.coords.latitude}, ${pos.coords.longitude}`)
          showToast("Lokasi berhasil didapat (tanpa detail alamat)", "info")
        }
        setMendeteksi(false)
      },
      () => {
        showToast("Gagal mendapatkan lokasi. Coba isi manual.", "error")
        setMendeteksi(false)
      },
      { timeout: 10000 }
    )
  }

  async function handleCheckout() {
    if (!alamatKirim.trim()) {
      showToast("Alamat pengiriman harus diisi", "error")
      return
    }

    setLoading(true)
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: menus.map((m) => ({ menuId: m.menu.id, quantity: m.qty })),
          catatan,
          alamatKirim,
          metodePembayaran: metodeBayar,
        }),
      })
      showToast("Pesanan berhasil dibuat! 🎉", "success")
      setShowForm(false)
      onSuccess()
    } catch (err) {
      showToast(err.message, "error")
    }
    setLoading(false)
  }

  return (
    <>
      <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
        Pesan Sekarang
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <h3>Konfirmasi Pesanan</h3>

            <div className="checkout-summary">
              {menus.map(({ menu, qty }) => (
                <div className="checkout-item" key={menu.id}>
                  <span>{menu.nama} x{qty}</span>
                  <span>Rp {(menu.harga * qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="checkout-total">
                <strong>Total</strong>
                <strong>Rp {totalHarga.toLocaleString()}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Metode Pembayaran</label>
              <div className="alamat-options">
                <label className={`alamat-option ${metodeBayar === "COD" ? "alamat-option-active" : ""}`}
                  onClick={() => setMetodeBayar("COD")}>
                  <span className="alamat-option-icon">💵</span>
                  <span>COD (Bayar di Tempat)</span>
                </label>
                <label className={`alamat-option ${metodeBayar === "MIDTRANS" ? "alamat-option-active" : ""}`}
                  onClick={() => {
                    setMetodeBayar("MIDTRANS")
                    showToast("Segera hadir! Pilih COD dulu ya", "info")
                    setMetodeBayar("COD")
                  }}>
                  <span className="alamat-option-icon">💳</span>
                  <span>Online (Midtrans)</span>
                  <span className="badge-coming">Segera</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Alamat Pengiriman</label>

              <div className="alamat-options">
                <label className={`alamat-option ${metodeAlamat === "manual" ? "alamat-option-active" : ""}`}
                  onClick={() => { setMetodeAlamat("manual"); setAlamatKirim("") }}>
                  <span className="alamat-option-icon">✏️</span>
                  <span>Input Manual</span>
                </label>
                <label className={`alamat-option ${metodeAlamat === "lokasi" ? "alamat-option-active" : ""}`}
                  onClick={() => setMetodeAlamat("lokasi")}>
                  <span className="alamat-option-icon">📍</span>
                  <span>Lokasi Terkini</span>
                </label>
              </div>

              {metodeAlamat === "manual" ? (
                <textarea
                  rows={3}
                  value={alamatKirim}
                  onChange={(e) => setAlamatKirim(e.target.value)}
                  placeholder="Jl. Contoh No. 123, Kota, Kecamatan"
                  style={{ marginTop: 12 }}
                />
              ) : (
                <div style={{ marginTop: 12 }}>
                  {alamatKirim ? (
                    <div className="lokasi-terdeteksi">
                      <p>📍 {alamatKirim}</p>
                      <button className="btn btn-outline btn-sm" onClick={deteksiLokasi} disabled={mendeteksi}>
                        {mendeteksi ? "Mendeteksi..." : "Deteksi Ulang"}
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-primary" onClick={deteksiLokasi} disabled={mendeteksi}>
                      {mendeteksi ? "Mendeteksi lokasi..." : "📍 Deteksi Lokasi Saya"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Catatan (opsional)</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: jangan pakai cabai"
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-full" onClick={handleCheckout} disabled={loading}>
                {loading ? "Memproses..." : `Bayar Rp ${totalHarga.toLocaleString()}`}
              </button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ========== Pesanan Saya ========== */
function PesananSayaView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api("/orders/me").then((data) => setOrders(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Memuat...</p>

  return (
    <>
      <div className="page-header">
        <h2>Pesanan Saya</h2>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Belum ada pesanan.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <span className="order-code">{order.kodeOrder}</span>
                <span className={`order-status status-${order.status}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="order-items">
                {order.orderItems.map((item, i) => (
                  <span key={i}>
                    {item.menu.nama} x{item.quantity}
                    {i < order.orderItems.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
              <p className="menu-price">Rp {order.totalHarga.toLocaleString()}</p>
              <div className="order-meta">
                {order.payment?.status && <span>💳 {order.payment.status}</span>}
                {order.delivery?.kurir?.name && <span>🚚 {order.delivery.kurir.name}</span>}
              </div>
              <p className="card-text" style={{ fontSize: 12 }}>
                {new Date(order.createdAt).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default DashboardPembeli
