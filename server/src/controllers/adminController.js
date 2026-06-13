const prisma = require("../config/prisma.js")

async function getAllUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  res.json(users)
}

async function verifyUmkm(req, res) {
  const id = parseInt(req.params.id)
  const { status } = req.body

  if (!["AKTIF", "NONAKTIF"].includes(status)) {
    return res.status(400).json({ message: "Status tidak valid" })
  }

  const umkm = await prisma.umkm.update({
    where: { id },
    data: { status },
  })

  res.json(umkm)
}

async function getPendingUmkm(req, res) {
  const umkm = await prisma.umkm.findMany({
    where: { status: "MENUNGGU" },
    include: { pemilik: { select: { id: true, name: true, email: true } } },
  })

  res.json(umkm)
}

async function getAllOrders(req, res) {
  const orders = await prisma.order.findMany({
    include: {
      pembeli: { select: { id: true, name: true } },
      orderItems: { include: { menu: true } },
      payment: true,
      delivery: { include: { kurir: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(orders)
}

async function getAllUmkm(req, res) {
  const umkm = await prisma.umkm.findMany({
    include: { pemilik: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  res.json(umkm)
}

module.exports = { getAllUsers, verifyUmkm, getPendingUmkm, getAllOrders, getAllUmkm }
