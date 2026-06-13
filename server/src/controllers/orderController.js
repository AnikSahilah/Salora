const prisma = require("../config/prisma.js")
const { buatNotif } = require("../config/notif.js")

async function generateKode() {
  const date = new Date()
  const y = date.getFullYear().toString().slice(2)
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SLR${y}${m}${d}${rand}`
}

async function create(req, res) {
  const { items, catatan, alamatKirim, metodePembayaran } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Minimal 1 item" })
  }

  const metode = metodePembayaran || "COD"
  if (!["COD", "MIDTRANS"].includes(metode)) {
    return res.status(400).json({ message: "Metode pembayaran tidak valid" })
  }

  const menuIds = items.map((i) => i.menuId)
  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds }, tersedia: true },
  })

  if (menus.length !== items.length) {
    return res.status(400).json({ message: "Beberapa menu tidak tersedia" })
  }

  const menuMap = {}
  for (const m of menus) {
    menuMap[m.id] = m
  }

  const orderItems = items.map((i) => ({
    menuId: i.menuId,
    quantity: i.quantity,
    hargaSatuan: menuMap[i.menuId].harga,
    subtotal: menuMap[i.menuId].harga * i.quantity,
  }))

  const totalHarga = orderItems.reduce((sum, i) => sum + i.subtotal, 0)
  const kodeOrder = await generateKode()

  const isCOD = metode === "COD"

  const order = await prisma.order.create({
    data: {
      kodeOrder,
      pembeliId: req.user.id,
      totalHarga,
      catatan,
      alamatKirim,
      status: isCOD ? "MENUNGGU_KONFIRMASI" : "MENUNGGU_PEMBAYARAN",
      orderItems: { create: orderItems },
      payment: {
        create: {
          metode,
          status: "MENUNGGU",
        },
      },
    },
    include: {
      orderItems: { include: { menu: true } },
      payment: true,
    },
  })

  // Notif pemilik
  const umkmPemilikIds = [...new Set(menus.map((m) => m.umkmId))]
  for (const umkmId of umkmPemilikIds) {
    const umkm = await prisma.umkm.findUnique({ where: { id: umkmId }, select: { pemilikId: true } })
    if (umkm) {
      await buatNotif(umkm.pemilikId, "📦 Pesanan Baru", `Pesanan ${kodeOrder} masuk. Segera konfirmasi!`)
    }
  }

  res.status(201).json(order)
}

async function getMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { pembeliId: req.user.id },
    include: {
      orderItems: { include: { menu: true } },
      payment: true,
      delivery: { include: { kurir: { select: { id: true, name: true, phone: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(orders)
}

async function getById(req, res) {
  const id = parseInt(req.params.id)

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      pembeli: { select: { id: true, name: true, phone: true } },
      orderItems: { include: { menu: true } },
      payment: true,
      delivery: { include: { kurir: { select: { id: true, name: true, phone: true } } } },
    },
  })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  if (order.pembeliId !== req.user.id && req.user.role === "PEMBELI") {
    return res.status(403).json({ message: "Bukan pesanan kamu" })
  }

  res.json(order)
}

async function updateStatus(req, res) {
  const id = parseInt(req.params.id)
  const { status } = req.body

  const order = await prisma.order.findUnique({ where: { id } })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  })

  const notifMap = {
    DIPROSES: ["Pesanan Diterima ✅", `Pesanan ${order.kodeOrder} diterima dan sedang dimasak.`],
    SIAP_DIANTAR: ["Siap Diantar 🚚", `Pesanan ${order.kodeOrder} siap diantar!`],
    DIBATALKAN: ["Pesanan Ditolak ❌", `Pesanan ${order.kodeOrder} ditolak oleh pemilik.`],
  }

  const notif = notifMap[status]
  if (notif) {
    await buatNotif(order.pembeliId, notif[0], notif[1])
  }

  res.json(updated)
}

async function getPemilikOrders(req, res) {
  const umkm = await prisma.umkm.findUnique({
    where: { pemilikId: req.user.id },
    select: { id: true },
  })

  if (!umkm) {
    return res.status(404).json({ message: "Kamu belum punya UMKM" })
  }

  const orders = await prisma.order.findMany({
    where: {
      orderItems: { some: { menu: { umkmId: umkm.id } } },
    },
    include: {
      pembeli: { select: { id: true, name: true, phone: true } },
      orderItems: {
        where: { menu: { umkmId: umkm.id } },
        include: { menu: true },
      },
      delivery: { include: { kurir: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(orders)
}

async function cancel(req, res) {
  const id = parseInt(req.params.id)

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  if (order.pembeliId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Tidak punya akses" })
  }

  if (!["MENUNGGU_PEMBAYARAN", "MENUNGGU_KONFIRMASI"].includes(order.status)) {
    return res.status(400).json({ message: "Pesanan tidak bisa dibatalkan" })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: "DIBATALKAN" },
  })

  if (order.payment) {
    await prisma.payment.update({
      where: { orderId: id },
      data: { status: "GAGAL" },
    })
  }

  res.json(updated)
}

async function changeToCOD(req, res) {
  const id = parseInt(req.params.id)

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  if (order.pembeliId !== req.user.id) {
    return res.status(403).json({ message: "Bukan pesanan kamu" })
  }

  if (order.status !== "MENUNGGU_PEMBAYARAN") {
    return res.status(400).json({ message: "Pesanan sudah diproses" })
  }

  if (!order.payment || order.payment.metode !== "MIDTRANS") {
    return res.status(400).json({ message: "Hanya bisa dari Midtrans ke COD" })
  }

  await prisma.payment.update({
    where: { orderId: id },
    data: { metode: "COD", status: "MENUNGGU", midtransTransId: null },
  })

  await prisma.order.update({
    where: { id },
    data: { status: "MENUNGGU_KONFIRMASI" },
  })

  res.json({ message: "Metode berhasil diubah ke COD" })
}

module.exports = { create, getMyOrders, getById, updateStatus, getPemilikOrders, cancel, changeToCOD }
