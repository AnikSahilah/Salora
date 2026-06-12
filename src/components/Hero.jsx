function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-badge">Platform Kuliner UMKM Lokal</span>
        <h1 className="hero-title">
          <span className="hero-salora">Salora</span>
          <br />
          Santapan Lokal Nusantara
        </h1>
        <p className="hero-desc">
          Temukan dan jelajahi ribuan UMKM kuliner terbaik dari seluruh
          Nusantara. Dukung usaha lokal dengan satu sentuhan!
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary">Jelajahi Kuliner</button>
          <button className="btn btn-outline">Daftarkan UMKM Kamu</button>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-icon-platter">
          <span className="hero-icon">🍽️</span>
          <span className="hero-icon-sm hero-icon-sm-1">🍜</span>
          <span className="hero-icon-sm hero-icon-sm-2">🥘</span>
          <span className="hero-icon-sm hero-icon-sm-3">🍛</span>
          <span className="hero-icon-sm hero-icon-sm-4">🍢</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
