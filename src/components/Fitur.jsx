const fiturList = [
  {
    icon: "🔍",
    title: "Cari UMKM",
    desc: "Temukan UMKM kuliner favorit berdasarkan kategori, lokasi, atau rating.",
  },
  {
    icon: "📋",
    title: "Lihat Menu",
    desc: "Jelajahi menu lengkap dengan harga, deskripsi, dan foto dari setiap UMKM.",
  },
  {
    icon: "🛵",
    title: "Pesan Antar",
    desc: "Pesan langsung dari UMKM dan dapatkan pengiriman cepat ke lokasi kamu.",
  },
  {
    icon: "⭐",
    title: "Review & Rating",
    desc: "Beri penilaian dan ulasan untuk membantu UMKM terus meningkatkan kualitas.",
  },
  {
    icon: "📢",
    title: "Promosi UMKM",
    desc: "Fitur promosi khusus agar UMKM lokal makin dikenal masyarakat luas.",
  },
  {
    icon: "💳",
    title: "Bayar Mudah",
    desc: "Berbagai metode pembayaran digital untuk kemudahan transaksi.",
  },
]

function Fitur() {
  return (
    <section className="fitur" id="fitur">
      <div className="container">
        <h2 className="section-label">Fitur Unggulan</h2>
        <h3 className="section-title">Kenapa Harus Salora?</h3>
        <p className="section-desc">
          Salora hadir dengan berbagai fitur yang memudahkan kamu menemukan
          dan menikmati kuliner Nusantara.
        </p>

        <div className="fitur-grid">
          {fiturList.map((fitur, index) => (
            <div className="fitur-card" key={index}>
              <span className="fitur-icon">{fitur.icon}</span>
              <h4 className="fitur-title">{fitur.title}</h4>
              <p className="fitur-desc">{fitur.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Fitur
