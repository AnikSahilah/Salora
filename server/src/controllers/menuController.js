const prisma = require("../config/prisma.js")

async function create(req, res) {
  const umkmId = parseInt(req.params.umkmId)
  const { nama, deskripsi, harga, foto } = req.body

  const umkm = await prisma.umkm.findUnique({ where: { id: umkmId } })

  if (!umkm) {
    return res.status(404).json({ message: "UMKM tidak ditemukan" })
  }

  if (umkm.pemilikId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Tidak punya akses" })
  }

  const menu = await prisma.menu.create({
    data: { umkmId, nama, deskripsi, harga: parseFloat(harga), foto: foto || null },
  })

  res.status(201).json(menu)
}

async function update(req, res) {
  const id = parseInt(req.params.id)
  const { nama, deskripsi, harga, foto, tersedia } = req.body

  const menu = await prisma.menu.findUnique({
    where: { id },
    include: { umkm: { select: { pemilikId: true } } },
  })

  if (!menu) {
    return res.status(404).json({ message: "Menu tidak ditemukan" })
  }

  if (menu.umkm.pemilikId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Tidak punya akses" })
  }

  const updated = await prisma.menu.update({
    where: { id },
      data: {
        nama,
        deskripsi,
        harga: harga ? parseFloat(harga) : undefined,
        foto: foto || menu.foto,
        tersedia,
      },
  })

  res.json(updated)
}

async function remove(req, res) {
  const id = parseInt(req.params.id)

  const menu = await prisma.menu.findUnique({
    where: { id },
    include: { umkm: { select: { pemilikId: true } } },
  })

  if (!menu) {
    return res.status(404).json({ message: "Menu tidak ditemukan" })
  }

  if (menu.umkm.pemilikId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Tidak punya akses" })
  }

  await prisma.menu.delete({ where: { id } })
  res.json({ message: "Menu berhasil dihapus" })
}

module.exports = { create, update, remove }
