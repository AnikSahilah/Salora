import umkmData from "../data/umkmData.js"

function DaftarUMKM() {
  return (
    <section className="umkm" id="umkm">
      <div className="container">
        <h2 className="section-label">Jelajahi UMKM</h2>
        <h3 className="section-title">Kuliner Terbaik dari Seluruh Nusantara</h3>
        <p className="section-desc">
          Berbagai pilihan UMKM kuliner lokal siap memanjakan lidah kamu.
        </p>

        <div className="umkm-grid">
          {umkmData.map((umkm) => (
            <div className="umkm-card" key={umkm.id}>
              <div className="umkm-icon-wrapper">
                <span className="umkm-icon">{umkm.icon}</span>
              </div>
              <div className="umkm-body">
                <span className="umkm-category">{umkm.category}</span>
                <h4 className="umkm-name">{umkm.name}</h4>
                <p className="umkm-desc">{umkm.description}</p>
                <div className="umkm-footer">
                  <span className="umkm-location">📍 {umkm.location}</span>
                  <span className="umkm-rating">⭐ {umkm.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DaftarUMKM
