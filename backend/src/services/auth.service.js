const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const env = require('../config/env');
const authRepo = require('../repositories/auth.repository');

const buildAuthPayload = (user) => {
  const token = jwt.sign({ id: user.id, role: user.role_name }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role_name },
    token,
  };
};

const register = async ({ full_name, email, password }) => {
  const existing = await authRepo.findByEmail(email);
  if (existing) {
    const error = new Error('Email đã được sử dụng');
    error.statusCode = 400;
    throw error;
  }

  // Default role is student (role_id = 3)
  const role = await authRepo.getRoleByName('student');
  const password_hash = await bcrypt.hash(password, 10);

  const userId = await authRepo.create({
    full_name,
    email,
    password_hash,
    role_id: role.id,
  });

  const user = await authRepo.findById(userId);
  return buildAuthPayload(user);
};

const login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    const error = new Error('Email hoặc mật khẩu không đúng');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('Tài khoản đã bị khóa');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Email hoặc mật khẩu không đúng');
    error.statusCode = 401;
    throw error;
  }

  return buildAuthPayload(user);
};

const verifyGoogleCredential = async (credential) => {
  if (!env.GOOGLE_CLIENT_ID) {
    const error = new Error('Chưa cấu hình Google Client ID');
    error.statusCode = 500;
    throw error;
  }

  if (!credential) {
    const error = new Error('Google credential không được cung cấp');
    error.statusCode = 400;
    throw error;
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) {
    const error = new Error('Token Google không hợp lệ');
    error.statusCode = 401;
    throw error;
  }

  const profile = await res.json();
  if (profile.aud !== env.GOOGLE_CLIENT_ID) {
    const error = new Error('Google Client ID không khớp');
    error.statusCode = 401;
    throw error;
  }

  if (profile.email_verified !== 'true' && profile.email_verified !== true) {
    const error = new Error('Email Google chưa được xác minh');
    error.statusCode = 403;
    throw error;
  }

  return profile;
};

const googleLogin = async ({ credential }) => {
  const profile = await verifyGoogleCredential(credential);
  const email = String(profile.email || '').toLowerCase();

  let user = await authRepo.findByEmail(email);
  if (user) {
    if (user.role_name !== 'student') {
      const error = new Error('Đăng nhập Gmail chỉ dành cho học viên');
      error.statusCode = 403;
      throw error;
    }

    if (user.status !== 'active') {
      const error = new Error('Tài khoản đã bị khóa');
      error.statusCode = 403;
      throw error;
    }

    return buildAuthPayload(user);
  }

  const role = await authRepo.getRoleByName('student');
  const password_hash = await bcrypt.hash(`google:${profile.sub}:${Date.now()}`, 10);
  const userId = await authRepo.create({
    full_name: profile.name || email.split('@')[0],
    email,
    password_hash,
    role_id: role.id,
  });

  user = await authRepo.findById(userId);
  return buildAuthPayload(user);
};

const getProfile = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) {
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

module.exports = { register, login, googleLogin, getProfile };
