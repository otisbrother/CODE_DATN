const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const authRepo = require('../repositories/auth.repository');

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
  const token = jwt.sign({ id: user.id, role: user.role_name }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role_name },
    token,
  };
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

  const token = jwt.sign({ id: user.id, role: user.role_name }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role_name },
    token,
  };
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

module.exports = { register, login, getProfile };
