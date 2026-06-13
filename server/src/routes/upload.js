const express = require("express")
const upload = require("../config/upload.js")
const { authenticate } = require("../middleware/auth.js")

const router = express.Router()

router.post("/", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File tidak ditemukan" })
  }

  const url = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`
  res.json({ url, filename: req.file.filename })
})

module.exports = router
