import { useState, useEffect, useRef } from 'react';
import { lecturerService } from '../../services/lecturer.service';
import useAuthStore from '../../store/auth.store';
import './MyProfilePage.css';

export default function MyProfilePage() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ full_name: '', headline: '', bio: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);   // ảnh hiện tại trên server
  const [preview, setPreview] = useState(null);       // ảnh xem trước khi chọn file
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    lecturerService.getMyProfile()
      .then(res => {
        const p = res.data.data;
        setForm({ full_name: p.full_name || '', headline: p.headline || '', bio: p.bio || '' });
        setAvatarUrl(p.avatar_url || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setMsg({ text: 'Vui lòng chọn file ảnh', type: 'error' }); return; }
    if (f.size > 5 * 1024 * 1024) { setMsg({ text: 'Ảnh tối đa 5MB', type: 'error' }); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('headline', form.headline);
      fd.append('bio', form.bio);
      if (file) fd.append('avatar', file);
      const res = await lecturerService.updateMyProfile(fd);
      const p = res.data.data;
      setAvatarUrl(p.avatar_url || null);
      setPreview(null);
      setFile(null);
      // cập nhật tên + avatar hiển thị ở sidebar
      updateUser({ ...user, full_name: p.full_name, avatar_url: p.avatar_url });
      setMsg({ text: '✅ Cập nhật hồ sơ thành công!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi cập nhật hồ sơ', type: 'error' });
    }
    setSaving(false);
  };

  if (loading) return <div className="loading">Đang tải hồ sơ...</div>;

  const shownAvatar = preview || avatarUrl;
  const initials = form.full_name?.trim()?.[0]?.toUpperCase() || 'GV';

  return (
    <div className="profile-page">
      <div className="page-header"><h1>👤 Hồ sơ giáo viên</h1></div>
      <p className="profile-subtitle">
        Thông tin này hiển thị ở khu <strong>“Người Truyền Lửa”</strong> ngoài trang chủ và trang khóa học của bạn.
      </p>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <form className="profile-card" onSubmit={handleSubmit}>
        {/* Avatar */}
        <div className="profile-avatar-block">
          <div className="profile-avatar">
            {shownAvatar ? <img src={shownAvatar} alt="avatar" /> : <span>{initials}</span>}
          </div>
          <div className="profile-avatar-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
              📷 Chọn ảnh đại diện
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <span className="profile-hint">JPG, PNG, WEBP • tối đa 5MB</span>
          </div>
        </div>

        <div className="profile-fields">
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="VD: Nguyễn Văn A"
              required
            />
          </div>
          <div className="form-group">
            <label>Chức danh / Giới thiệu ngắn <span className="profile-muted">(hiện dưới tên ở thẻ giáo viên)</span></label>
            <input
              type="text"
              maxLength={160}
              value={form.headline}
              onChange={e => setForm({ ...form, headline: e.target.value })}
              placeholder="VD: 5 năm kinh nghiệm Backend Spring • Giải KK Tin học QG"
            />
            <span className="profile-counter">{form.headline.length}/160</span>
          </div>
          <div className="form-group">
            <label>Tiểu sử chi tiết</label>
            <textarea
              rows={6}
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Giới thiệu về kinh nghiệm, thành tích, phong cách giảng dạy của bạn..."
            />
          </div>
        </div>

        <div className="profile-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : '💾 Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </div>
  );
}
