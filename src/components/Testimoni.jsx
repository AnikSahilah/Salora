import testimoniData from "../data/testimoniData.js"

function Testimoni() {
  return (
    <section className="testimoni" id="testimoni">
      <div className="container">
        <h2 className="section-label">Testimoni</h2>
        <h3 className="section-title">Apa Kata Mereka?</h3>
        <p className="section-desc">
          Pengalaman pengguna dan mitra UMKM setelah menggunakan Salora.
        </p>

        <div className="testimoni-grid">
          {testimoniData.map((item) => (
            <div className="testimoni-card" key={item.id}>
              <div className="testimoni-stars">
                {"★".repeat(5)}
              </div>
              <p className="testimoni-review">&ldquo;{item.review}&rdquo;</p>
              <div className="testimoni-user">
                <span className="testimoni-avatar">{item.avatar}</span>
                <span className="testimoni-name">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimoni
