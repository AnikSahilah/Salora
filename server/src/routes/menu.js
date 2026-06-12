const express = require("express")
const { create, update, remove } = require("../controllers/menuController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.post("/:umkmId", authenticate, authorize("PEMILIK", "ADMIN"), create)
router.put("/:id", authenticate, authorize("PEMILIK", "ADMIN"), update)
router.delete("/:id", authenticate, authorize("PEMILIK", "ADMIN"), remove)

module.exports = router
