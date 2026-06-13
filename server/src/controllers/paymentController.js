const midtransClient = require("midtrans-client")
const prisma = require("../config/prisma.js")

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
})

async function createSnapTransaction(req, res) {
  const orderId = parseInt(req.params.orderId)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { menu: true } },
      pembeli: { select: { name: true, email: true, phone: true } },
    },
  })

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" })
  }

  if (order.pembeliId !== req.user.id) {
    return res.status(403).json({ message: "Bukan pesanan kamu" })
  }

  const parameter = {
    transaction_details: {
      order_id: order.kodeOrder,
      gross_amount: order.totalHarga,
    },
    credit_card: { secure: true },
    customer_details: {
      first_name: order.pembeli.name,
      email: order.pembeli.email,
      phone: order.pembeli.phone || "",
    },
    item_details: order.orderItems.map((item) => ({
      id: item.menu.id.toString(),
      price: item.hargaSatuan,
      quantity: item.quantity,
      name: item.menu.nama,
    })),
  }

  try {
    const transaction = await snap.createTransaction(parameter)
    res.json({
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
    })
  } catch (err) {
    console.error("Midtrans error:", err)
    res.status(500).json({ message: "Gagal membuat transaksi" })
  }
}

async function notificationHandler(req, res) {
  const apiClient = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  })

  try {
    let statusResponse
    try {
      statusResponse = await apiClient.transaction.notification(req.body)
    } catch {
      statusResponse = req.body
    }

    const orderId = statusResponse.order_id
    const transactionStatus = statusResponse.transaction_status
    const fraudStatus = statusResponse.fraud_status

    const order = await prisma.order.findUnique({ where: { kodeOrder: orderId } })
    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" })
    }

    let paymentStatus = "MENUNGGU"
    let orderStatus = order.status

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      paymentStatus = "DIBAYAR"
      if (order.status === "MENUNGGU_PEMBAYARAN") {
        orderStatus = "MENUNGGU_KONFIRMASI"
      }
    } else if (transactionStatus === "pending") {
      paymentStatus = "MENUNGGU"
    } else if (transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire") {
      paymentStatus = "GAGAL"
      orderStatus = "DIBATALKAN"
    } else if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
      paymentStatus = "REFUND"
    }

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: paymentStatus,
        midtransTransId: statusResponse.transaction_id || null,
      },
    })

    if (orderStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      })
    }

    res.status(200).json({ message: "OK" })
  } catch (err) {
    console.error("Midtrans notification error:", err)
    res.status(500).json({ message: "Error processing notification" })
  }
}

module.exports = { createSnapTransaction, notificationHandler }
