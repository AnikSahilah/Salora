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

const filterLabels = { MENUNGGU_KONFIRMASI: "Baru", DIPROSES: "Dimasak", SIAP_DIANTAR: "Siap Antar", DALAM_PERJALANAN: "Diantar", SELESAI: "Selesai", DIBATALKAN: "Batal" }

function DashboardPembeli({ user }) {
  const navigate = useNavigate()
  const [page, setPage] = useState("jelajah")
  const [refreshPesanan, setRefreshPesanan] = useState(0)

  function goToPesanan() {
    setPage("pesanan")
    setRefreshPesanan((n) => n + 1)
  }

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
        {page === "jelajah" && <JelajahiView userId={user.id} onPesanSukses={goToPesanan} />}
        {page === "pesanan" && <PesananSayaView key={refreshPesanan} />}
      </main>
    </div>
  )
}

/* ========== Jelajahi UMKM ========== */
function JelajahiView({ userId, onPesanSukses }) {
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
    return <DetailUmkmView umkm={detailUmkm} onBack={() => setDetailUmkm(null)} userId={userId} onPesanSukses={onPesanSukses} />
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
              {umkm.foto && <div className="pembeli-card-img" style={{ backgroundImage: `url(${umkm.foto})` }} />}
              <div className="pembeli-card-body">
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
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ========== Detail UMKM (full page) ========== */
function DetailUmkmView({ umkm, onBack, userId, onPesanSukses }) {
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

      <div className="detail-header-card" style={umkm.foto ? { padding: 0, overflow: "hidden" } : {}}>
        {umkm.foto && <img src={umkm.foto} alt={umkm.nama} className="detail-foto" />}
        <div style={{ padding: umkm.foto ? 28 : 0 }}>
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
                  {menu.foto && <img src={menu.foto} alt={menu.nama} className="menu-foto-thumb" />}
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
                  onSuccess={onPesanSukses}
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
  const navigate = useNavigate()
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
      const order = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: menus.map((m) => ({ menuId: m.menu.id, quantity: m.qty })),
          catatan,
          alamatKirim,
          metodePembayaran: metodeBayar,
        }),
      })

      if (metodeBayar === "COD") {
        showToast("Pesanan berhasil dibuat! 🎉", "success")
        setShowForm(false)
        onSuccess()
      } else if (metodeBayar === "MIDTRANS") {
        const snap = await api(`/payments/${order.id}/snap`, { method: "POST" })

        window.snap.pay(snap.snapToken, {
          onSuccess: () => {
            showToast("Pembayaran berhasil! Pesanan diproses 🎉", "success")
            setShowForm(false)
            onSuccess()
          },
          onPending: () => {
            showToast("Menunggu pembayaran...", "info")
            setShowForm(false)
            onSuccess()
          },
          onError: () => {
            showToast("Pembayaran gagal, coba lagi", "error")
          },
          onClose: () => {
            showToast("Pembayaran dibatalkan", "info")
          },
        })
      }
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
                  onClick={() => setMetodeBayar("MIDTRANS")}>
                  <span className="alamat-option-icon">💳</span>
                  <span>Online (Midtrans)</span>
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
const pembeliFilters = ["Semua", "MENUNGGU_KONFIRMASI", "DIPROSES", "SIAP_DIANTAR", "DALAM_PERJALANAN", "SELESAI", "DIBATALKAN"]

function PesananSayaView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("Semua")
  const [selectedOrder, setSelectedOrder] = useState(null)

  function loadOrders() {
    api("/orders/me").then((data) => setOrders(data.filter((o) => o.status !== "MENUNGGU_PEMBAYARAN"))).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [])

  const filtered = filter === "Semua" ? orders : orders.filter((o) => o.status === filter)
  const count = (status) => status === "Semua" ? orders.length : orders.filter((o) => o.status === status).length

  if (loading) return <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Memuat...</p>

  return (
    <>
      <div className="page-header">
        <h2>Pesanan Saya</h2>
      </div>

      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {pembeliFilters.map((f) => (
          <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {filterLabels[f] || f} ({count(f)})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center", marginTop: 60 }}>Tidak ada pesanan.</p>
      ) : (
        <div className="order-list">
          {filtered.map((order) => (
            <div className="order-card clickable" key={order.id} onClick={() => setSelectedOrder(order)}>
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

      {selectedOrder && (
        <DetailPesananModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={loadOrders}
        />
      )}
    </>
  )
}

function GantiCODButton({ orderId, onSuccess }) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleGanti() {
    if (!confirm("Ganti metode pembayaran ke COD?")) return
    setLoading(true)
    try {
      await api(`/orders/${orderId}/change-to-cod`, { method: "PUT" })
      showToast("Berhasil ganti ke COD. Pesanan langsung diproses!", "success")
      onSuccess()
    } catch (err) {
      showToast(err.message, "error")
    }
    setLoading(false)
  }

  return (
    <button className="btn btn-primary btn-full" onClick={handleGanti} disabled={loading}>
      {loading ? "Memproses..." : "Ganti ke COD (Bayar di Tempat)"}
    </button>
  )
}

function DetailPesananModal({ order, onClose, onRefresh }) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, komentar: "" })

  async function handleReview() {
    try {
      const umkmId = order.orderItems[0]?.menu.umkmId
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, umkmId, ...reviewForm }),
      })
      showToast("Ulasan berhasil dikirim! ⭐", "success")
      setShowReview(false)
      onRefresh()
      onClose()
    } catch (err) {
      showToast(err.message, "error")
    }
  }

  async function handleCancel() {
    if (!confirm("Yakin batalkan pesanan ini?")) return
    setLoading(true)
    try {
      await api(`/orders/${order.id}/cancel`, { method: "PUT" })
      showToast("Pesanan dibatalkan", "success")
      onRefresh()
      onClose()
    } catch (err) {
      showToast(err.message, "error")
    }
    setLoading(false)
  }

  const bisaBatal = order.status === "MENUNGGU_PEMBAYARAN"
  const pakaiMidtrans = order.payment?.metode === "MIDTRANS" && order.status === "MENUNGGU_PEMBAYARAN"

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="order-header" style={{ marginBottom: 16 }}>
          <span className="order-code" style={{ fontSize: 18 }}>{order.kodeOrder}</span>
          <span className={`order-status status-${order.status}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="checkout-summary">
          {order.orderItems.map((item, i) => (
            <div className="checkout-item" key={i}>
              <span>{item.menu.nama} x{item.quantity}</span>
              <span>Rp {(item.hargaSatuan * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="checkout-total">
            <strong>Total</strong>
            <strong>Rp {order.totalHarga.toLocaleString()}</strong>
          </div>
        </div>

        <div className="detail-info-grid">
          <div>
            <strong>Alamat Kirim</strong>
            <p>{order.alamatKirim}</p>
          </div>
          {order.catatan && (
            <div>
              <strong>Catatan</strong>
              <p>{order.catatan}</p>
            </div>
          )}
          <div>
            <strong>Pembayaran</strong>
            <p>{order.payment?.metode === "COD" ? "COD (Bayar di Tempat)" : "Online (Midtrans)"}</p>
            <p>Status: {order.payment?.status?.replace(/_/g, " ") || "-"}</p>
          </div>
          <div>
            <strong>Kurir</strong>
            <p>{order.delivery?.kurir?.name || "Belum ditugaskan"}</p>
          </div>
        </div>

        <div className="detail-actions">
          {bisaBatal && (
            <button className="btn btn-outline" onClick={handleCancel} disabled={loading}
              style={{ borderColor: "#dc2626", color: "#dc2626" }}>
              {loading ? "Memproses..." : "Batalkan Pesanan"}
            </button>
          )}
          {pakaiMidtrans && (
            <GantiCODButton orderId={order.id} onSuccess={() => { onRefresh(); onClose() }} />
          )}
          {order.status === "SELESAI" && !showReview && (
            <button className="btn btn-primary btn-full" onClick={() => setShowReview(true)}>
              ⭐ Beri Ulasan
            </button>
          )}
          {showReview && (
            <div className="review-form">
              <h4 style={{ marginBottom: 8 }}>Beri Ulasan</h4>
              <div className="review-stars">
                {[1,2,3,4,5].map((b) => (
                  <span key={b} className={`star ${b <= reviewForm.rating ? "star-on" : ""}`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: b })}>★</span>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder="Tulis komentar..."
                value={reviewForm.komentar}
                onChange={(e) => setReviewForm({ ...reviewForm, komentar: e.target.value })}
                style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontFamily: "var(--sans)", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={handleReview}>Kirim</button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowReview(false)}>Batal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPembeli
