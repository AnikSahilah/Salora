const express = require("express")
const { createSnapTransaction, notificationHandler } = require("../controllers/paymentController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.post("/:orderId/snap", authenticate, authorize("PEMBELI"), createSnapTransaction)
router.post("/notification", notificationHandler)

module.exports = router
