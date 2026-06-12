const prisma = require("../config/prisma.js")

async function getAll(req, res) {
  const { kategori, kota } = req.query

  const where = { status: "AKTIF" }
  if (kategori) where.kategori = kategori
  if (kota) where.kota = { contains: kota }

  const umkm = await prisma.umkm.findMany({
    where,
    include: {
      pemilik: { select: { id: true, name: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { rating: "desc" },
  })

  res.json(umkm)
}

async function getById(req, res) {
  const id = parseInt(req.params.id)

  const umkm = await prisma.umkm.findUnique({
    where: { id },
    include: {
      pemilik: { select: { id: true, name: true, phone: true } },
      menus: { where: { tersedia: true } },
      reviews: {
        include: { pembeli: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!umkm) {
    return res.status(404).json({ message: "UMKM tidak ditemukan" })
  }

  res.json(umkm)
}

async function create(req, res) {
  const { nama, deskripsi, kategori, alamat, kota, provinsi } = req.body

  if (req.user.role !== "PEMILIK") {
    return res.status(403).json({ message: "Hanya pemilik UMKM" })
  }

  const existing = await prisma.umkm.findUnique({
    where: { pemilikId: req.user.id },
  })

  if (existing) {
    return res.status(400).json({ message: "Kamu sudah punya UMKM" })
  }

  const umkm = await prisma.umkm.create({
    data: {
      pemilikId: req.user.id,
      nama,
      deskripsi,
      kategori,
      alamat,
      kota,
      provinsi,
    },
  })

  res.status(201).json(umkm)
}

async function update(req, res) {
  const id = parseInt(req.params.id)
  const { nama, deskripsi, kategori, alamat, kota, provinsi } = req.body

  const umkm = await prisma.umkm.findUnique({ where: { id } })

  if (!umkm) {
    return res.status(404).json({ message: "UMKM tidak ditemukan" })
  }

  if (umkm.pemilikId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Tidak punya akses" })
  }

  const updated = await prisma.umkm.update({
    where: { id },
    data: { nama, deskripsi, kategori, alamat, kota, provinsi },
  })

  res.json(updated)
}

async function remove(req, res) {
  const id = parseInt(req.params.id)

  const umkm = await prisma.umkm.findUnique({ where: { id } })

  if (!umkm) {
    return res.status(404).json({ message: "UMKM tidak ditemukan" })
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Hanya admin" })
  }

  await prisma.umkm.delete({ where: { id } })
  res.json({ message: "UMKM berhasil dihapus" })
}

async function getMyUmkm(req, res) {
  if (req.user.role !== "PEMILIK") {
    return res.status(403).json({ message: "Hanya pemilik UMKM" })
  }

  const umkm = await prisma.umkm.findUnique({
    where: { pemilikId: req.user.id },
    include: {
      menus: true,
      _count: { select: { reviews: true } },
    },
  })

  if (!umkm) {
    return res.status(404).json({ message: "Kamu belum punya UMKM" })
  }

  res.json(umkm)
}

module.exports = { getAll, getById, create, update, remove, getMyUmkm }
