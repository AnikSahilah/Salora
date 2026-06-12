import { Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Landing from "./pages/Landing.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
