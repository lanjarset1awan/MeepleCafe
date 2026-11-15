import { supabase } from "./src/config/supabaseClient.js";

const games = [
  {
    title: "UNO Classic",
    category_id: "a190ca0a-ca64-41b1-941d-a10bba1d7cdd", // Party Game
    min_players: 2,
    max_players: 10,
    duration_minutes: 20,
    difficulty: "Easy",
    image_url: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500",
    description: "Game kartu paling populer di Indonesia dan dunia. Cocokkan warna atau angka kartu, dan jangan lupa teriak 'UNO!' saat kartu tinggal satu.",
    rules_summary: "Keluarkan kartu sesuai warna atau angka yang sama. Gunakan kartu aksi Draw Two (+2), Skip, Reverse, dan Wild Draw Four (+4) untuk mengalahkan lawan.",
    is_available: true
  },
  {
    title: "Monopoly Indonesia",
    category_id: "bca5b3fa-1121-42ef-99d7-b1072f0c27ac", // Family
    min_players: 2,
    max_players: 6,
    duration_minutes: 90,
    difficulty: "Medium",
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8Ae6I467lJ25MZ19twZ11NIpemioePCAs-GeIGuqOsQ&s=10",
    description: "Permainan papan transaksi properti paling legendaris. Beli petak kota-kota besar di Indonesia, bangun rumah dan hotel, serta buat lawan bangkrut dengan biaya sewa.",
    rules_summary: "Lempar dadu untuk berkeliling papan. Beli tanah yang kosong, tarik uang sewa jika pemain lain singgah di propertimu. Hindari masuk penjara!",
    is_available: true
  },
  {
    title: "UNO Stacko",
    category_id: "a190ca0a-ca64-41b1-941d-a10bba1d7cdd", // Party Game
    min_players: 2,
    max_players: 8,
    duration_minutes: 15,
    difficulty: "Easy",
    image_url: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=500",
    description: "Perpaduan seru antara menara balok Jenga dan aturan warna kartu UNO. Menguji ketenangan tangan dan strategi agar menara balok tidak runtuh.",
    rules_summary: "Tarik balok dari bawah atau tengah menara sesuai warna atau angka balok sebelumnya, lalu letakkan di puncak menara dengan satu tangan.",
    is_available: true
  },
  {
    title: "Scrabble",
    category_id: "9b7b06eb-e194-443c-a65c-1fa7405d974f", // Strategy
    min_players: 2,
    max_players: 4,
    duration_minutes: 45,
    difficulty: "Medium",
    image_url: "https://images.unsplash.com/photo-1585503418537-88331351ad99?w=500",
    description: "Game susun kata klasik mengasah kosakata dan strategi. Buat kata-kata di kotak premium (Double Word, Triple Letter) untuk meraih poin tertinggi.",
    rules_summary: "Setiap pemain memegang 7 huruf di rak. Bentuk kata seperti teka-teki silang yang terhubung dengan kata di papan, hitung nilai tiap huruf.",
    is_available: true
  },
  {
    title: "Cluedo (Misteri Pembunuhan)",
    category_id: "81b57e12-38ac-453b-8bdc-90ae8f9ec4bb", // Social Deduction
    min_players: 3,
    max_players: 6,
    duration_minutes: 45,
    difficulty: "Medium",
    image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500",
    description: "Permainan misteri detektif klasik. Pemain harus memecahkan kasus pembunuhan misterius di sebuah rumah besar Tudor Mansion.",
    rules_summary: "Kumpulkan petunjuk dan eliminasi kemungkinan untuk menebak 3 kartu rahasia di dalam amplop: Siapa pelakunya, di ruangan mana, dan memakai senjata apa.",
    is_available: true
  },
  {
    title: "Exploding Kittens",
    category_id: "a190ca0a-ca64-41b1-941d-a10bba1d7cdd", // Party Game
    min_players: 2,
    max_players: 5,
    duration_minutes: 15,
    difficulty: "Easy",
    image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500",
    description: "Game kartu Russian Roulette versi kucing penuh humor dan strategi licik. Sangat populer di seluruh kafe board game Indonesia.",
    rules_summary: "Pemain menarik kartu bergiliran sampai ada yang mendapat Exploding Kitten dan tereliminasi, kecuali punya kartu Defuse untuk menjinakkan bom.",
    is_available: true
  },
  {
    title: "Waroong Wars (Kuliner Nusantara)",
    category_id: "bca5b3fa-1121-42ef-99d7-b1072f0c27ac", // Family
    min_players: 3,
    max_players: 5,
    duration_minutes: 30,
    difficulty: "Easy",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
    description: "Board game asli karya anak bangsa Indonesia! Berperan sebagai pemilik warung kuliner tradisional yang bersaing membeli bahan baku di pasar dan memasak hidangan khas Nusantara.",
    rules_summary: "Kunjungi pasar tradisional, kumpulkan resep Rendang, Sate, Gado-Gado, layani pelanggan dan raih reputasi warung nomor satu di Indonesia.",
    is_available: true
  },
  {
    title: "Catur Klasik",
    category_id: "9b7b06eb-e194-443c-a65c-1fa7405d974f", // Strategy
    min_players: 2,
    max_players: 2,
    duration_minutes: 30,
    difficulty: "Medium",
    image_url: "https://image.made-in-china.com/202f0j00fULZksbyENcT/High-Quality-Wooden-Chess-Game-Set-Outdoor-Game-Gift.webp",
    description: "Permainan papan strategi dua pemain paling terkenal dan abadi sepanjang masa. Menggunakan papan kayu 64 petak, pemain mengendalikan 16 buah catur (Raja, Ratu, Benteng, Gajah, Kuda, dan Pion) untuk menyusun taktik dan menyekakmat (checkmate) Raja lawan.",
    rules_summary: "Setiap buah catur memiliki pola langkah unik (Benteng lurus, Gajah diagonal, Kuda berbentuk L, Ratu ke segala arah). Lindungi Raja sendiri sembari mengancam dan mengunci posisi Raja lawan hingga Skakmat.",
    is_available: true
  }
];

async function seed() {
  const { data, error } = await supabase.from("board_games").insert(games).select();
  if (error) {
    console.error("Error inserting games:", error);
  } else {
    console.log(`Success! Inserted ${data.length} Indonesian popular board games.`);
  }
}

seed();

