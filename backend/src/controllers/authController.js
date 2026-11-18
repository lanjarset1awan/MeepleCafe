import { UserModel } from "../models/userModel.js";

export const AuthController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, username, email, phone, nim, major, password } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Nama lengkap wajib diisi" });
      }
      if (!username || !username.trim()) {
        return res.status(400).json({ error: "Username wajib diisi" });
      }
      if (!password || password.trim().length < 3) {
        return res.status(400).json({ error: "Kata sandi minimal 3 karakter" });
      }

      // Cek apakah username atau email sudah digunakan
      const existingUser = await UserModel.findByIdentifier(username);
      if (existingUser) {
        return res.status(400).json({ error: `Username "${username}" sudah terdaftar` });
      }

      if (email && email.trim()) {
        const existingEmail = await UserModel.findByIdentifier(email);
        if (existingEmail) {
          return res.status(400).json({ error: `Email "${email}" sudah terdaftar` });
        }
      }

      const createdUser = await UserModel.create({
        name,
        username,
        email,
        phone,
        nim,
        major,
        password
      });

      return res.status(201).json({
        message: "Registrasi berhasil!",
        user: createdUser,
        token: `token-${createdUser.id}-${Date.now()}`
      });
    } catch (err) {
      console.error("Auth register error:", err);
      return res.status(500).json({ error: err.message || "Gagal melakukan registrasi" });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !identifier.trim() || !password || !password.trim()) {
        return res.status(400).json({ error: "Username/Email dan kata sandi wajib diisi" });
      }

      const user = await UserModel.findByIdentifier(identifier);
      if (!user) {
        return res.status(401).json({ error: "Username/Email tidak ditemukan" });
      }

      if (user.password !== password.trim()) {
        return res.status(401).json({ error: "Kata sandi salah. Silakan coba lagi" });
      }

      const { password: _, ...safeUser } = user;
      return res.json({
        message: "Login berhasil!",
        user: safeUser,
        token: `token-${safeUser.id}-${Date.now()}`
      });
    } catch (err) {
      console.error("Auth login error:", err);
      return res.status(500).json({ error: err.message || "Gagal melakukan login" });
    }
  },

  // GET /api/auth/profile/:id
  async getProfile(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }
      return res.json(user);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /api/auth/users
  async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAll();
      return res.json(users);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};
