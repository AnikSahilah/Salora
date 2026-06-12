const express = require("express")
const {
  create,
  getMyOrders,
  getById,
  updateStatus,
  getPemilikOrders,
} = require("../controllers/orderController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.get("/me", authenticate, authorize("PEMBELI"), getMyOrders)
router.get("/pemilik", authenticate, authorize("PEMILIK"), getPemilikOrders)
router.get("/:id", authenticate, getById)
router.post("/", authenticate, authorize("PEMBELI"), create)
router.put("/:id/status", authenticate, authorize("PEMILIK", "KURIR", "ADMIN"), updateStatus)

module.exports = router
