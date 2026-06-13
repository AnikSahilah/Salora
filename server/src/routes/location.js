const express = require("express")
const { updateLocation, getNearestKurir } = require("../controllers/locationController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.put("/me", authenticate, authorize("KURIR"), updateLocation)
router.get("/nearest", authenticate, getNearestKurir)

module.exports = router
