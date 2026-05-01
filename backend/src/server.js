const app = require('./app');
const env = require('./config/env');
const fs = require('fs');
const path = require('path');

// Ensure upload directories exist
const dirs = [
  path.join(__dirname, '../uploads/materials'),
  path.join(__dirname, '../uploads/ai-data'),
  path.join(__dirname, '../uploads/courses'),
  path.join(__dirname, '../uploads/videos'),
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const PORT = env.PORT;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
  });

  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} đang bị chiếm. Đang tự động giải phóng...`);
      try {
        const { execSync } = require('child_process');
        // Find and kill the process using this port (Windows)
        const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
        const lines = result.trim().split('\n');
        const pids = new Set();
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
        for (const pid of pids) {
          try {
            execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf-8' });
            console.log(`✅ Đã kill tiến trình PID ${pid}`);
          } catch (e) {
            // Process may have already exited
          }
        }
        // Retry after a short delay
        setTimeout(() => {
          console.log('🔄 Đang khởi động lại server...');
          startServer();
        }, 1000);
      } catch (e) {
        console.error(`❌ Không thể giải phóng port ${PORT}. Hãy chạy thủ công: taskkill /PID <PID> /F`);
        process.exit(1);
      }
    } else {
      console.error('❌ Lỗi server:', err);
      process.exit(1);
    }
  });
}

startServer();
