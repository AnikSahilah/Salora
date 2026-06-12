const express = require("express")
const { register, login, me } = require("../controllers/authController.js")
const { authenticate } = require("../middleware/auth.js")

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.get("/me", authenticate, me)

module.exports = router
