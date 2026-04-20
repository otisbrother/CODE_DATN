const app = require('./app');
const env = require('./config/env');
const fs = require('fs');
const path = require('path');

// Ensure upload directories exist
const dirs = [
  path.join(__dirname, '../uploads/materials'),
  path.join(__dirname, '../uploads/ai-data'),
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
});
