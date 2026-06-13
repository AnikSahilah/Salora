const prisma = require("../config/prisma.js")

async function updateLocation(req, res) {
  const { latitude, longitude } = req.body

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude dan longitude harus diisi" })
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { latitude, longitude },
    select: { id: true, name: true, latitude: true, longitude: true },
  })

  res.json(user)
}

async function getNearestKurir(req, res) {
  const { latitude, longitude } = req.query

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude dan longitude diperlukan" })
  }

  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)

  const kurir = await prisma.user.findMany({
    where: {
      role: "KURIR",
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      latitude: true,
      longitude: true,
    },
  })

  const withDistance = kurir.map((k) => {
    const jarak = haversine(lat, lng, k.latitude, k.longitude)
    return { ...k, jarak: Math.round(jarak * 10) / 10 }
  })

  withDistance.sort((a, b) => a.jarak - b.jarak)

  res.json(withDistance)
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

module.exports = { updateLocation, getNearestKurir }
