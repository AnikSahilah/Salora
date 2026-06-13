require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")

const authRoutes = require("./routes/auth.js")
const umkmRoutes = require("./routes/umkm.js")
const menuRoutes = require("./routes/menu.js")
const orderRoutes = require("./routes/order.js")
const reviewRoutes = require("./routes/review.js")
const deliveryRoutes = require("./routes/delivery.js")
const adminRoutes = require("./routes/admin.js")
const paymentRoutes = require("./routes/payment.js")
const notificationRoutes = require("./routes/notification.js")
const uploadRoutes = require("./routes/upload.js")

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

app.get("/api", (req, res) => {
  res.json({ message: "Salora API siap!" })
})

app.use("/api/auth", authRoutes)
app.use("/api/umkm", umkmRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/delivery", deliveryRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/upload", uploadRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: "Terjadi kesalahan server" })
})

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`)
})
