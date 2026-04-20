const usersRepo = require('../repositories/users.repository');
const bcrypt = require('bcryptjs');

const getAll = async (page, limit, filters = {}) => {
  const offset = (page - 1) * limit;
  return await usersRepo.findAll(limit, offset, filters);
};

const getById = async (id) => {
  const user = await usersRepo.findById(id);
  if (!user) { const e = new Error('Người dùng không tồn tại'); e.statusCode = 404; throw e; }
  return user;
};

const update = async (id, data) => {
  await getById(id);
  if (data.password) {
    data.password_hash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }
  await usersRepo.update(id, data);
  return await usersRepo.findById(id);
};

const remove = async (id) => {
  await getById(id);
  await usersRepo.remove(id);
};

module.exports = { getAll, getById, update, remove };
