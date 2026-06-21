# BÁO CÁO KIỂM THỬ & ĐÁNH GIÁ HỆ THỐNG E-LEARNING TÍCH HỢP AI

**Sinh viên:** Nguyễn Huy Tỏa — Lớp 64 HTTT3 · **Ngày kiểm thử:** 18/06/2026
**Phạm vi:** (1) Kiểm thử & đánh giá hiệu quả hệ thống thực tế; (2) Đánh giá độ chính xác AI/ML/thuật toán áp dụng.

> **Tính trung thực của số liệu:** Các chỉ số ở Phần B được sinh **tự động bằng script chạy thật** trên mã nguồn thật của hệ thống (`backend/eval/evaluate.js`), dùng dữ liệu có **đáp án chuẩn (ground truth)**. Phần kiểm thử tích hợp/E2E (cần MySQL + backend + frontend chạy đồng thời) được trình bày dưới dạng **kịch bản kiểm thử có kỳ vọng**; trạng thái thực thi được ghi rõ trong cột "Hình thức".

---

## 1. Phương pháp & môi trường

| Mục | Nội dung |
|---|---|
| Kỹ thuật kiểm thử | Unit test thuật toán (white-box), kiểm thử chức năng (black-box), đánh giá độ chính xác bằng ground truth |
| Công cụ đo | Script Node.js thuần (`backend/eval/evaluate.js`), không phụ thuộc dịch vụ ngoài |
| Chỉ số dùng | Tỉ lệ chính xác (accuracy), Top‑1 accuracy, Pass/Fail theo kịch bản |
| Đối tượng đo thật | 3 thuật toán đang vận hành: **chấm điểm tự động**, **engine chạy code**, **chatbot (phân loại ý định + khớp khóa học)** |
| Cách chạy lại | `cd backend && node eval/evaluate.js` |

---

## 2. PHẦN A — KIỂM THỬ & ĐÁNH GIÁ HIỆU QUẢ HỆ THỐNG THỰC TẾ

### 2.1. Mức độ bao phủ theo module

| Module | Chức năng chính | Hình thức kiểm thử |
|---|---|---|
| Xác thực & phân quyền | Đăng ký, đăng nhập (JWT), middleware role | Kịch bản + soát mã |
| Khóa học / Bài học / Học liệu | CRUD, upload (Multer) | Kịch bản + soát mã |
| Thanh toán & Voucher | Chuyển khoản, áp mã giảm giá | Kịch bản + soát mã |
| Ghi danh & Tiến độ | Mở khóa sau thanh toán, completion_rate | Kịch bản + soát mã |
| **Bài tập – Chấm tự động** | Quiz/tự luận/code, tính điểm | ✅ **Đã chạy thật (unit)** |
| **Engine chạy code** | Sandbox `vm`, chống lặp vô hạn | ✅ **Đã chạy thật (unit)** |
| **Chatbot tư vấn (AI)** | Phân loại ý định, khớp khóa học, gọi Gemini | ✅ **Đã chạy thật (phần thuật toán)** |
| Đánh giá khóa học (reviews) | Rating 1–5, phản hồi ≤2 sao gửi GV/Admin | Kịch bản + soát mã |

### 2.2. Bảng kịch bản kiểm thử chức năng (trích)

| ID | Module | Kịch bản | Dữ liệu vào | Kết quả kỳ vọng | Hình thức |
|---|---|---|---|---|---|
| TC-01 | Auth | Đăng nhập sai mật khẩu | email đúng, pass sai | 401, không cấp token | Kịch bản |
| TC-02 | Auth | Truy cập API admin bằng token student | token role=student | 403 Forbidden | Kịch bản |
| TC-03 | Review | Học viên chưa hoàn thành 100% gửi review | completion < 100 | Bị chặn (403) | Kịch bản |
| TC-04 | Review | Review ≤2 sao không nhập lý do | rating=2, comment rỗng | Báo lỗi 400 bắt nhập lý do | Kịch bản |
| TC-05 | Payment | Áp voucher quá hạn | voucher ends_at < now | Không áp dụng | Kịch bản |
| TC-06 | Grading | Quiz 2/2 đúng, thang 10 | đáp án đúng | Điểm = 10 | ✅ Đã chạy: **PASS** |
| TC-07 | Grading | Tự luận khớp 2/4 từ khóa | answer chứa 2 ý | Điểm = 5 | ✅ Đã chạy: **PASS** |
| TC-08 | Code | Code nộp bị lặp vô hạn | `while(true){}` | Timeout, không pass, không treo server | ✅ Đã chạy: **PASS** |
| TC-09 | Chatbot | Hỏi "cách đăng ký" | câu thủ tục | Phân loại = procedural, không spam khóa học | ✅ Đã chạy: **PASS** |
| TC-10 | Chatbot | Hỏi "học mysql" | câu hỏi khóa học | Gợi ý đúng khóa MySQL | ✅ Đã chạy: **PASS** |

### 2.3. Đánh giá hiệu quả phi chức năng (qua soát mã + chạy thật)

- **An toàn:** Mật khẩu băm `bcrypt`; phân quyền theo `role.middleware`; chatbot có chỉ thị "không lộ prompt/API key". Engine code chạy trong sandbox `vm` có **giới hạn 2 giây/testcase** → chống tấn công vòng lặp vô hạn (đã kiểm chứng TC-08).
- **Khả năng chịu lỗi:** Chatbot **fallback rule-based** khi Gemini lỗi/thiếu key → không bao giờ "chết" câu trả lời (kiến trúc hybrid).
- **Hiệu năng:** Tất cả thuật toán cốt lõi là O(n) trên số khóa học/câu hỏi, chạy đồng bộ trong tiến trình, không gọi mạng (trừ Gemini) → độ trễ thấp.
- **Điểm cần cải thiện:** chưa có test tự động cho tầng API/E2E; dữ liệu review bị "đóng khuôn" (auto-điền comment mẫu cho 3–5 sao) làm giảm giá trị phân tích.

---

## 3. PHẦN B — ĐÁNH GIÁ ĐỘ CHÍNH XÁC AI/ML/THUẬT TOÁN

### 3.1. Kết quả thực đo (chạy `node eval/evaluate.js`, 18/06/2026)

| Thuật toán áp dụng | Loại | Số ca | Đúng | **Độ chính xác** |
|---|---|---|---|---|
| Chấm điểm tự động (`gradeAssignment`) | Rule + so khớp | 5 | 5 | **100%** |
| Engine chạy code (`runJsSolution`) | Sandbox thực thi | 4 | 4 | **100%** |
| Chatbot – phân loại ý định | Rule-based NLP | 8 | 8 | **100%** |
| Chatbot – khớp khóa học (Top-1) | TF-token scoring | 7 | 5 | **71.4%** |
| **TỔNG HỢP** | | **24** | **22** | **91.7%** |

### 3.2. Phân tích & nhận xét

- **Chấm điểm tự động (100%):** Tính điểm đúng cho cả 3 loại (quiz tỉ lệ đúng/tổng, tự luận theo từ khóa & đáp án mẫu, code theo số testcase pass). Đây là thành phần **đáng tin cậy nhất** để vận hành thực tế.
- **Engine code (100%):** Bắt đúng lời giải đúng/sai, **timeout** với vòng lặp vô hạn, và hỗ trợ cả `return` lẫn `console.log`. Bảo đảm an toàn khi học viên nộp code tùy ý.
- **Chatbot phân loại ý định (100%):** Phân biệt chuẩn 4 nhóm (mất gốc / voucher / thủ tục / hỏi chung) → định tuyến câu trả lời đúng hướng.
- **Chatbot khớp khóa học (71.4%) — phát hiện hạn chế thật:** 2 ca sai:
  1. *"Lập trình web html css"* → gợi ý nhầm **"Nhập môn lập trình"** thay vì **"Lập trình Web"**.
  2. *"Học lập trình hướng đối tượng"* → gợi ý nhầm **"Nhập môn lập trình"** thay vì **"OOP nâng cao"**.
  → **Nguyên nhân:** từ chung "lập trình" xuất hiện trong nhiều tiêu đề, cộng điểm tiêu đề (+4/token) làm khóa "Nhập môn" bị thiên vị; khi điểm bằng nhau, tie-break theo `recommended_order` nhỏ hơn càng đẩy sai.
  → **Khuyến nghị cải thiện:** (a) tăng trọng số cho **cụm từ khóa (bigram)** "lập trình web", "hướng đối tượng"; (b) giảm trọng số token đơn lẻ quá phổ biến (IDF); (c) ưu tiên khớp đặc trưng riêng (web/html/oop) hơn từ generic.

### 3.3. Đánh giá mô hình MLP phân tích phản hồi (đề xuất — *chưa triển khai*)

Như đã trao đổi, dữ liệu `course_reviews` hiện bị đóng khuôn nên **chưa thể** cho ra số liệu MLP thật ngay. Khung đánh giá chuẩn để bảo vệ trước hội đồng:

| Hạng mục | Đề xuất |
|---|---|
| Dữ liệu huấn luyện | **UIT-VSFC** (~16.000 câu phản hồi sinh viên VN, nhãn cảm xúc + chủ đề) |
| Tiền xử lý | Tách từ (underthesea/pyvi) → vector hóa TF-IDF / embedding |
| Mô hình | MLP (1–2 lớp ẩn) làm baseline; đối chứng với SVM/PhoBERT |
| Chia dữ liệu | Train/Val/Test = 70/15/15, hoặc dùng split chuẩn của UIT-VSFC |
| **Chỉ số đánh giá** | **Accuracy, Precision, Recall, F1 (macro)**, **ma trận nhầm lẫn** |
| Đánh giá ứng dụng | Áp mô hình lên `course_reviews.comment` (đặc biệt nhóm ≤2 sao là text thật) → thống kê cảm xúc/chủ đề trên dashboard GV/Admin |
| Mốc tham chiếu | MLP/TF-IDF trên UIT-VSFC thường đạt **F1 ~0.85–0.90** (cảm xúc 3 lớp) — dùng làm ngưỡng kỳ vọng |

---

## 4. KẾT LUẬN & KHUYẾN NGHỊ

1. **Hệ thống vận hành hiệu quả ở các thành phần cốt lõi:** chấm điểm tự động và engine code đạt **100%**; chatbot phân loại ý định **100%**.
2. **Điểm yếu định lượng được:** thuật toán khớp khóa học của chatbot đạt **71.4%** Top‑1 → cần nâng cấp theo hướng bigram + IDF (mục 3.2).
3. **MLP phân tích phản hồi khả thi** nhưng cần (a) bộ dữ liệu có nhãn (UIT-VSFC) và (b) bỏ auto-điền comment mẫu để dữ liệu in-house dùng được; sau đó báo cáo Accuracy/F1/ma trận nhầm lẫn.
4. **Đề xuất bước tiếp theo:** bổ sung test API/E2E tự động; nâng cấp matcher; triển khai MLP theo khung mục 3.3.

---

### Phụ lục — Tái lập số liệu
```bash
cd backend
node eval/evaluate.js     # in toàn bộ PASS/FAIL và % chính xác
```
Mã nguồn bộ đo: [backend/eval/evaluate.js](backend/eval/evaluate.js).
