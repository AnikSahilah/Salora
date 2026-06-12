const express = require("express")
const {
  assign,
  claim,
  updateStatus,
  getMyDeliveries,
  getAvailable,
} = require("../controllers/deliveryController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.get("/me", authenticate, authorize("KURIR"), getMyDeliveries)
router.get("/available", authenticate, authorize("KURIR", "ADMIN"), getAvailable)
router.post("/assign", authenticate, authorize("ADMIN"), assign)
router.put("/:orderId/claim", authenticate, authorize("KURIR"), claim)
router.put("/:orderId/status", authenticate, authorize("KURIR", "ADMIN"), updateStatus)

module.exports = router
