const express = require("express")
const {
  getAllUsers,
  verifyUmkm,
  getPendingUmkm,
  getAllOrders,
} = require("../controllers/adminController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.get("/users", authenticate, authorize("ADMIN"), getAllUsers)
router.get("/umkm/pending", authenticate, authorize("ADMIN"), getPendingUmkm)
router.get("/orders", authenticate, authorize("ADMIN"), getAllOrders)
router.put("/umkm/:id/verify", authenticate, authorize("ADMIN"), verifyUmkm)

module.exports = router
