const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Hapus data lama biar seeds bisa jalan ulang
  await prisma.delivery.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menu.deleteMany()
  await prisma.umkm.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash("123456", 12)

  const admin = await prisma.user.create({
    data: {
      name: "Admin Salora",
      email: "admin@salora.com",
      password,
      role: "ADMIN",
      phone: "08111111111",
    },
  })

  const pembeli = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@test.com",
      password,
      role: "PEMBELI",
      phone: "08122222222",
      alamat: "Jl. Merdeka No. 10, Jakarta",
    },
  })

  const pembeli2 = await prisma.user.create({
    data: {
      name: "Sari Dewi",
      email: "sari@test.com",
      password,
      role: "PEMBELI",
      phone: "08133333333",
      alamat: "Jl. Sudirman No. 25, Bandung",
    },
  })

  const pemilik1 = await prisma.user.create({
    data: {
      name: "Sumini",
      email: "sumini@warung.com",
      password,
      role: "PEMILIK",
      phone: "08144444444",
    },
  })

  const pemilik2 = await prisma.user.create({
    data: {
      name: "Agus Prasetyo",
      email: "agus@sate.com",
      password,
      role: "PEMILIK",
      phone: "08155555555",
    },
  })

  const pemilik3 = await prisma.user.create({
    data: {
      name: "Rina Marlina",
      email: "rina@kue.com",
      password,
      role: "PEMILIK",
      phone: "08166666666",
    },
  })

  const kurir = await prisma.user.create({
    data: {
      name: "Joko Susilo",
      email: "joko@kurir.com",
      password,
      role: "KURIR",
      phone: "08177777777",
    },
  })

  const umkm1 = await prisma.umkm.create({
    data: {
      pemilikId: pemilik1.id,
      nama: "Warung Mbok Sum",
      deskripsi: "Nasi liwet, ayam goreng, dan sambal khas Solo.",
      kategori: "Makanan Berat",
      alamat: "Jl. Slamet Riyadi No. 50",
      kota: "Solo",
      provinsi: "Jawa Tengah",
      status: "AKTIF",
      rating: 4.5,
    },
  })

  const umkm2 = await prisma.umkm.create({
    data: {
      pemilikId: pemilik2.id,
      nama: "Sate Pak Agus",
      deskripsi: "Sate ayam & kambing dengan bumbu kacang khas Madura.",
      kategori: "Sate & Bakar",
      alamat: "Jl. Raya Kertapati No. 12",
      kota: "Madura",
      provinsi: "Jawa Timur",
      status: "AKTIF",
      rating: 4.8,
    },
  })

  const umkm3 = await prisma.umkm.create({
    data: {
      pemilikId: pemilik3.id,
      nama: "Kue Cubit Bu Rina",
      deskripsi: "Kue cubit aneka topping: coklat, keju, green tea.",
      kategori: "Cemilan",
      alamat: "Jl. Dago No. 88",
      kota: "Bandung",
      provinsi: "Jawa Barat",
      status: "AKTIF",
      rating: 4.3,
    },
  })

  await prisma.menu.createMany({
    data: [
      { umkmId: umkm1.id, nama: "Nasi Liwet", deskripsi: "Nasi liwet komplit dengan ayam suwir", harga: 25000, tersedia: true },
      { umkmId: umkm1.id, nama: "Ayam Goreng", deskripsi: "Ayam goreng kampung bumbu kuning", harga: 20000, tersedia: true },
      { umkmId: umkm1.id, nama: "Sambal Terasi", deskripsi: "Sambal terasi segar", harga: 5000, tersedia: true },

      { umkmId: umkm2.id, nama: "Sate Ayam (10 tusuk)", deskripsi: "Sate ayam dengan bumbu kacang", harga: 30000, tersedia: true },
      { umkmId: umkm2.id, nama: "Sate Kambing (10 tusuk)", deskripsi: "Sate kambing muda empuk", harga: 45000, tersedia: true },
      { umkmId: umkm2.id, nama: "Lontong", deskripsi: "Lontong pendamping sate", harga: 5000, tersedia: true },

      { umkmId: umkm3.id, nama: "Kue Cubit Coklat", deskripsi: "Kue cubit topping coklat meleleh", harga: 15000, tersedia: true },
      { umkmId: umkm3.id, nama: "Kue Cubit Keju", deskripsi: "Kue cubit topping keju mozarella", harga: 17000, tersedia: true },
      { umkmId: umkm3.id, nama: "Kue Cubit Green Tea", deskripsi: "Kue cubit matcha dengan whipped cream", harga: 18000, tersedia: true },
    ],
  })

  console.log("Seeding selesai!")
  console.log("")
  console.log("=== Akun Seeder ===")
  console.log("Admin  : admin@salora.com / 123456")
  console.log("Pembeli: budi@test.com / 123456")
  console.log("Pembeli: sari@test.com / 123456")
  console.log("Pemilik: sumini@warung.com / 123456")
  console.log("Pemilik: agus@sate.com / 123456")
  console.log("Pemilik: rina@kue.com / 123456")
  console.log("Kurir  : joko@kurir.com / 123456")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
