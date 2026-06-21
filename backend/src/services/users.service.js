const usersRepo = require('../repositories/users.repository');
const bcrypt = require('bcryptjs');

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const ensureManagedUser = (user) => {
  if (!user) throw makeError('Người dùng không tồn tại', 404);
  if (user.role_name === 'admin') {
    throw makeError('Không quản lý tài khoản admin tại màn hình này', 403);
  }
  return user;
};

const getAll = async (page, limit, filters = {}) => {
  const offset = (page - 1) * limit;
  return await usersRepo.findAll(limit, offset, filters);
};

const getById = async (id) => {
  const user = await usersRepo.findById(id);
  return ensureManagedUser(user);
};

const createLecturer = async (payload) => {
  const data = {
    full_name: String(payload.full_name || '').trim(),
    email: normalizeEmail(payload.email),
    password: String(payload.password || ''),
    status: payload.status || 'active',
  };

  if (!data.full_name) throw makeError('Họ tên giáo viên không được để trống');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw makeError('Email không hợp lệ');
  if (data.password.length < 6) throw makeError('Mật khẩu phải có ít nhất 6 ký tự');
  if (!['active', 'locked'].includes(data.status)) throw makeError('Trạng thái không hợp lệ');

  const existing = await usersRepo.findByEmail(data.email);
  if (existing) throw makeError('Email đã được sử dụng');

  const role = await usersRepo.getRoleByName('lecturer');
  if (!role) throw makeError('Vai trò giáo viên chưa được cấu hình', 500);

  const password_hash = await bcrypt.hash(data.password, 10);
  const id = await usersRepo.create({
    full_name: data.full_name,
    email: data.email,
    password_hash,
    role_id: role.id,
    status: data.status,
  });

  return await usersRepo.findById(id);
};

const update = async (id, data) => {
  await getById(id);

  const payload = {
    full_name: data.full_name,
    email: data.email ? normalizeEmail(data.email) : undefined,
    status: data.status,
  };

  if (payload.email) {
    const existing = await usersRepo.findByEmail(payload.email);
    if (existing && Number(existing.id) !== Number(id)) {
      throw makeError('Email đã được sử dụng');
    }
  }

  if (data.password) {
    if (String(data.password).length < 6) throw makeError('Mật khẩu phải có ít nhất 6 ký tự');
    payload.password_hash = await bcrypt.hash(data.password, 10);
  }

  await usersRepo.update(id, payload);
  return await usersRepo.findById(id);
};

const remove = async (id) => {
  await getById(id);
  await usersRepo.remove(id);
};

module.exports = { getAll, getById, createLecturer, update, remove };
