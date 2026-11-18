import { UserModel } from "../models/userModel.js";
import { supabase } from "../config/supabaseClient.js";

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

  // PUT /api/auth/profile/:id
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, nim, major, avatar } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Nama lengkap wajib diisi" });
      }

      const updated = await UserModel.update(id, { name, phone, nim, major, avatar });
      if (!updated) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }

      return res.json({
        message: "Profil berhasil diperbarui!",
        user: updated
      });
    } catch (err) {
      console.error("Auth update error:", err);
      return res.status(500).json({ error: err.message || "Gagal memperbarui profil" });
    }
  },

  // POST /api/auth/upload-avatar
  async uploadAvatar(req, res) {
    try {
      const { userId, base64, mimeType = "image/jpeg" } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId wajib disertakan" });
      }
      if (!base64) {
        return res.status(400).json({ error: "Data gambar (base64) wajib disertakan" });
      }

      // Bersihkan prefix data URL jika ada
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

      let avatarUrl = null;

      // 1. Coba upload ke Supabase Storage bucket 'avatars'
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          avatarUrl = publicData?.publicUrl || null;
        } else {
          console.warn("Supabase storage upload note:", uploadErr?.message);
        }
      } catch (storageErr) {
        console.warn("Storage upload exception:", storageErr.message);
      }

      // 2. Fallback: jika bucket belum dibuat atau storage policy belum run, gunakan data URI
      if (!avatarUrl) {
        avatarUrl = `data:${mimeType};base64,${cleanBase64}`;
      }

      // Simpan URL avatar ke tabel users
      const updatedUser = await UserModel.update(userId, { avatar: avatarUrl });

      return res.json({
        message: "Foto profil berhasil diperbarui!",
        avatarUrl,
        user: updatedUser
      });
    } catch (err) {
      console.error("Upload avatar error:", err);
      return res.status(500).json({ error: err.message || "Gagal mengunggah foto profil" });
    }
  },

  // DELETE /api/auth/profile/:id/avatar
  async deleteAvatar(req, res) {
    try {
      const { id } = req.params;
      const updated = await UserModel.update(id, { avatar: null });
      if (!updated) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }
      return res.json({
        message: "Foto profil berhasil dihapus!",
        user: updated
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Gagal menghapus foto profil" });
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
