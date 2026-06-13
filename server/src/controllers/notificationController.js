const prisma = require("../config/prisma.js")

async function getNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  res.json(notifications)
}

async function markRead(req, res) {
  const id = parseInt(req.params.id)

  await prisma.notification.updateMany({
    where: { id, userId: req.user.id },
    data: { read: true },
  })

  res.json({ message: "OK" })
}

async function markAllRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  })

  res.json({ message: "OK" })
}

module.exports = { getNotifications, markRead, markAllRead }
