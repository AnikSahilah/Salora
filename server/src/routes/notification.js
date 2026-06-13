const express = require("express")
const { getNotifications, markRead, markAllRead } = require("../controllers/notificationController.js")
const { authenticate } = require("../middleware/auth.js")

const router = express.Router()

router.get("/", authenticate, getNotifications)
router.put("/read-all", authenticate, markAllRead)
router.put("/:id/read", authenticate, markRead)

module.exports = router
