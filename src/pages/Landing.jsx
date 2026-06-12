import { Link } from "react-router-dom"
import Hero from "../components/Hero.jsx"
import Tentang from "../components/Tentang.jsx"
import Fitur from "../components/Fitur.jsx"
import DaftarUMKM from "../components/DaftarUMKM.jsx"
import Testimoni from "../components/Testimoni.jsx"
import { isAuthenticated, removeToken } from "../api.js"

function Landing() {
  const loggedIn = isAuthenticated()

  function handleLogout() {
    removeToken()
    window.location.reload()
  }

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">Salora</Link>
          <div className="navbar-links">
            <a href="#tentang">Tentang</a>
            <a href="#fitur">Fitur</a>
            <a href="#umkm">UMKM</a>
            <a href="#testimoni">Testimoni</a>
          </div>
          <div className="navbar-actions">
            {loggedIn ? (
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Keluar
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Masuk</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Daftar</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        <Tentang />
        <Fitur />
        <DaftarUMKM />
        <Testimoni />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-logo">Salora</span>
          <p className="footer-desc">Santapan Lokal Nusantara</p>
          <p className="footer-copy">&copy; 2026 Salora. Dukung UMKM Lokal.</p>
        </div>
      </footer>
    </>
  )
}

export default Landing
