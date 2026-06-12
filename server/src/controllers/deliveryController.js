const prisma = require("../config/prisma.js")

async function assign(req, res) {
  const { orderId, kurirId } = req.body

  const order = await prisma.order.findUnique({ where: { id: orderId } })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  const existing = await prisma.delivery.findUnique({
    where: { orderId },
  })

  if (existing) {
    return res.status(400).json({ message: "Sudah ada kurir" })
  }

  const delivery = await prisma.delivery.create({
    data: { orderId, kurirId },
    include: { kurir: { select: { id: true, name: true, phone: true } } },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SIAP_DIANTAR" },
  })

  res.status(201).json(delivery)
}

async function updateStatus(req, res) {
  const orderId = parseInt(req.params.orderId)
  const { status } = req.body

  const delivery = await prisma.delivery.findUnique({
    where: { orderId },
  })

  if (!delivery) {
    return res.status(404).json({ message: "Delivery tidak ditemukan" })
  }

  if (delivery.kurirId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Bukan kurir kamu" })
  }

  const updated = await prisma.delivery.update({
    where: { orderId },
    data: { status },
  })

  let orderStatus
  if (status === "DIJEMPUT") orderStatus = "DALAM_PERJALANAN"
  else if (status === "TERKIRIM") orderStatus = "SELESAI"

  if (orderStatus) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus },
    })
  }

  if (status === "TERKIRIM") {
    const payment = await prisma.payment.findUnique({ where: { orderId } })
    if (payment && payment.metode === "COD") {
      await prisma.payment.update({
        where: { orderId },
        data: { status: "DIBAYAR" },
      })
    }
  }

  res.json(updated)
}

async function getMyDeliveries(req, res) {
  if (req.user.role !== "KURIR") {
    return res.status(403).json({ message: "Hanya kurir" })
  }

  const deliveries = await prisma.delivery.findMany({
    where: { kurirId: req.user.id },
    include: {
      order: {
        include: {
          pembeli: { select: { id: true, name: true, phone: true, alamat: true } },
          orderItems: { include: { menu: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(deliveries)
}

async function claim(req, res) {
  const orderId = parseInt(req.params.orderId)

  const order = await prisma.order.findUnique({ where: { id: orderId } })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  const existing = await prisma.delivery.findUnique({ where: { orderId } })

  if (existing) {
    return res.status(400).json({ message: "Sudah ada kurir" })
  }

  const delivery = await prisma.delivery.create({
    data: { orderId, kurirId: req.user.id },
    include: { kurir: { select: { id: true, name: true, phone: true } } },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SIAP_DIANTAR" },
  })

  res.status(201).json(delivery)
}

async function getAvailable(req, res) {
  if (req.user.role !== "KURIR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Tidak punya akses" })
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "SIAP_DIANTAR",
      delivery: null,
    },
    include: {
      pembeli: { select: { id: true, name: true, phone: true, alamat: true } },
      orderItems: { include: { menu: true } },
    },
  })

  res.json(orders)
}

module.exports = { assign, claim, updateStatus, getMyDeliveries, getAvailable }
