const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const prisma = require("../config/prisma.js")

async function register(req, res) {
  const { name, email, password, role, phone, alamat } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(400).json({ message: "Email sudah terdaftar" })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, phone, alamat },
  })

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )

  res.status(201).json({
    message: "Registrasi berhasil",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

async function login(req, res) {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ message: "Email atau password salah" })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ message: "Email atau password salah" })
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )

  res.json({
    message: "Login berhasil",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, alamat: true },
  })

  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" })
  }

  res.json(user)
}

module.exports = { register, login, me }
