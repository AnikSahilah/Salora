const prisma = require("./prisma.js")

async function buatNotif(userId, title, message) {
  try {
    await prisma.notification.create({ data: { userId, title, message } })
  } catch (err) {
    console.error("Gagal buat notif:", err.message)
  }
}

module.exports = { buatNotif }
