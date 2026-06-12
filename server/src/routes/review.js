const express = require("express")
const { create, getByUmkm } = require("../controllers/reviewController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.get("/umkm/:umkmId", getByUmkm)
router.post("/", authenticate, authorize("PEMBELI"), create)

module.exports = router
