function Tentang() {
  return (
    <section className="tentang" id="tentang">
      <div className="container">
        <h2 className="section-label">Tentang Salora</h2>
        <h3 className="section-title">Mengangkat Kuliner Lokal ke Level Berikutnya</h3>
        <p className="section-desc">
          Salora adalah platform digital yang menghubungkan pecinta kuliner
          dengan UMKM lokal Nusantara. Kami percaya bahwa setiap masakan
          daerah punya cerita dan cita rasa yang layak dinikmati seluruh
          Indonesia.
        </p>

        <div className="tentang-stats">
          <div className="tentang-stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">UMKM Tergabung</span>
          </div>
          <div className="tentang-stat">
            <span className="stat-number">50rb+</span>
            <span className="stat-label">Pesanan Terpenuhi</span>
          </div>
          <div className="tentang-stat">
            <span className="stat-number">34</span>
            <span className="stat-label">Provinsi Tersebar</span>
          </div>
          <div className="tentang-stat">
            <span className="stat-number">4.8</span>
            <span className="stat-label">Rating Pengguna</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Tentang
