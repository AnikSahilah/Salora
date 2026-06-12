const prisma = require("../config/prisma.js")

async function create(req, res) {
  const { orderId, umkmId, rating, komentar } = req.body

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  if (order.pembeliId !== req.user.id) {
    return res.status(403).json({ message: "Bukan pesanan kamu" })
  }

  if (order.status !== "SELESAI") {
    return res.status(400).json({ message: "Pesanan belum selesai" })
  }

  const existing = await prisma.review.findUnique({
    where: { orderId },
  })

  if (existing) {
    return res.status(400).json({ message: "Sudah pernah review" })
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating 1-5" })
  }

  const review = await prisma.review.create({
    data: { pembeliId: req.user.id, umkmId, orderId, rating, komentar },
  })

  const reviews = await prisma.review.findMany({
    where: { umkmId },
    select: { rating: true },
  })

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  await prisma.umkm.update({
    where: { id: umkmId },
    data: { rating: Math.round(avgRating * 10) / 10 },
  })

  res.status(201).json(review)
}

async function getByUmkm(req, res) {
  const umkmId = parseInt(req.params.umkmId)

  const reviews = await prisma.review.findMany({
    where: { umkmId },
    include: { pembeli: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  })

  res.json(reviews)
}

module.exports = { create, getByUmkm }
