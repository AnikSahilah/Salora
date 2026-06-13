const express = require("express")
const {
  create,
  getMyOrders,
  getById,
  updateStatus,
  getPemilikOrders,
  cancel,
  changeToCOD,
} = require("../controllers/orderController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.get("/me", authenticate, authorize("PEMBELI"), getMyOrders)
router.get("/pemilik", authenticate, authorize("PEMILIK"), getPemilikOrders)
router.get("/:id", authenticate, getById)
router.post("/", authenticate, authorize("PEMBELI"), create)
router.put("/:id/status", authenticate, authorize("PEMILIK", "KURIR", "ADMIN"), updateStatus)
router.put("/:id/cancel", authenticate, authorize("PEMBELI", "ADMIN"), cancel)
router.put("/:id/change-to-cod", authenticate, authorize("PEMBELI"), changeToCOD)

module.exports = router
