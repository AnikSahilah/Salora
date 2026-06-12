const express = require("express")
const {
  getAll,
  getById,
  create,
  update,
  remove,
  getMyUmkm,
} = require("../controllers/umkmController.js")
const { authenticate, authorize } = require("../middleware/auth.js")

const router = express.Router()

router.get("/", getAll)
router.get("/me", authenticate, authorize("PEMILIK"), getMyUmkm)
router.get("/:id", getById)
router.post("/", authenticate, authorize("PEMILIK"), create)
router.put("/:id", authenticate, authorize("PEMILIK", "ADMIN"), update)
router.delete("/:id", authenticate, authorize("ADMIN"), remove)

module.exports = router
