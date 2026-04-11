SRS – HỆ THỐNG QUẢN LÝ TRUNG TÂM NHẬT NGỮ & TƯ VẤN DU HỌC – LAO ĐỘNG

Phiên bản: 1.0
Ngày soạn: …
Đơn vị yêu cầu: Trung tâm Nhật ngữ & Tư vấn Du học – Lao động
Đơn vị phát triển: …

1. MỤC ĐÍCH TÀI LIỆU

Tài liệu SRS mô tả đầy đủ các yêu cầu chức năng và phi chức năng của hệ thống nhằm:

Số hóa quản lý đào tạo tiếng Nhật (học vụ – giảng viên – học sinh).

Quản lý tư vấn du học và chương trình xuất khẩu lao động.

Quản lý sales – marketing – CRM – tuyển sinh.

Tích hợp LMS để học online/offline.

Tối ưu vận hành, giảm sai sót thủ công.

2. PHẠM VI HỆ THỐNG

Hệ thống bao gồm 4 phân hệ chính:

LMS – Quản lý học tập (như Edulive / EduSpace)

Quản lý trung tâm (lớp học – giảng viên – tài chính – điểm danh)

CRM & Tuyển sinh

Quản lý Du học – Lao động Nhật Bản

Các đối tượng sử dụng:

Quản trị viên trung tâm

Giáo viên

Học viên

Nhân viên tư vấn – Sales

Phòng du học – XKLĐ

Kế toán

3. YÊU CẦU TỔNG THỂ
3.1 Mục tiêu hệ thống

Tập trung dữ liệu một nơi (One-Platform).

Dễ dùng, đa nền tảng (web + mobile).

Tích hợp lớp học online chất lượng cao.

CRM mạnh để tăng tỉ lệ chốt đơn.

Theo dõi đầy đủ lộ trình du học & xuất khẩu lao động.

3.2 Giả định

Hệ thống chạy trên cloud.

Người dùng có kết nối Internet.

Học viên có smartphone.

3.3 Ràng buộc

Tuân thủ luật Việt Nam: bảo mật dữ liệu cá nhân.

Tương thích các trình duyệt phổ biến.

4. YÊU CẦU CHỨC NĂNG (Functional Requirements)
4.1 PHÂN HỆ 1 — LMS (Learning Management System)

(Tái hiện tính năng tương tự Edulive/EduSpace)

4.1.1 Quản lý khóa học

Tạo khóa học N5–N1, tiếng Nhật giao tiếp, JLPT, đào tạo kỹ năng LNG/XKLĐ.

Phân loại: online – offline – hybrid.

Cho phép thiết lập: thời lượng, học phí, tài liệu, giảng viên.

4.1.2 Quản lý bài giảng

Upload bài giảng (PDF, Video, SCORM, PPT).

Tạo bài tập, quiz, đề thi JLPT.

Ngân hàng câu hỏi, random đề.

4.1.3 Lớp học trực tuyến (Live Class)

Tích hợp Zoom/Google Meet, hoặc live built-in như Edulive.

Điểm danh tự động, thống kê tham gia.

Ghi hình bài giảng – xem lại.

4.1.4 Lộ trình học cá nhân

Xem tổng tiến độ.

Điểm số, học bạ, bài tập đã nộp.

Cảnh báo: nghỉ buổi, học kém, nợ học phí.

4.1.5 Mobile App học viên

Nhận thông báo về lịch học, lịch thi, điểm.

Làm bài tập online.

Thanh toán học phí online.

4.2 PHÂN HỆ 2 — QUẢN LÝ TRUNG TÂM
4.2.1 Quản lý học viên

Lưu trữ hồ sơ học viên (avatar, CCCD optional).

Ghi nhận lịch sử học tập.

Lọc theo khóa/lớp/tình trạng.

4.2.2 Quản lý lớp học

Tạo lớp học: lịch học, phòng, giảng viên.

Danh sách học viên.

Xếp lớp tự động theo đầu vào.

4.2.3 Điểm danh

Điểm danh bằng app giáo viên (QR code / thủ công).

Xuất báo cáo chuyên cần.

Cảnh báo nghỉ nhiều.

4.2.4 Quản lý học phí

Tạo hóa đơn học phí.

Ghi nhận thanh toán: tiền mặt, QR, chuyển khoản.

Theo dõi công nợ học viên.

4.2.5 Quản lý giáo viên

Lịch dạy, giờ dạy, lương.

Quy định mức lương theo ca.

4.2.6 Báo cáo trung tâm

Số lượng học viên mới.

Báo cáo doanh thu hàng tháng.

Tỉ lệ đỗ JLPT.

4.3 PHÂN HỆ 3 — CRM & TUYỂN SINH

(Lấy ý tưởng từ EduNext CRM)

4.3.1 Quản lý lead (khách hàng tiềm năng)

Nhập lead từ Facebook Ads, landing page, Zalo OA.

Chia lead tự động theo nhân viên.

Gắn tag: Du học – XKLĐ – tiếng Nhật.

4.3.2 Pipeline bán hàng

Tư vấn → hẹn test đầu vào → chốt lớp → thu học phí.

Trạng thái: mới, quan tâm, no-show, chuyển đổi.

Tự động gửi SMS chăm sóc.

4.3.3 Marketing Automation

Gửi email/SMS theo kịch bản.

Giáo trình giới thiệu khóa học.

Chúc mừng sinh nhật học viên.

4.3.4 Chatbot/Livechat

Chat với khách từ website/Facebook.

Lưu lịch sử tư vấn.

4.4 PHÂN HỆ 4 — DU HỌC & XUẤT KHẨU LAO ĐỘNG (Nổi bật cho trung tâm Nhật ngữ)
4.4.1 Quản lý hồ sơ du học

Hồ sơ học viên: học bạ, bằng cấp, hộ chiếu, đơn xin du học.

Theo dõi tiến trình:

Tư vấn ban đầu

Chọn trường Nhật

Chuẩn bị hồ sơ COE

Gửi trường

Nhận COE

Xin Visa

Bay – nhập cảnh

Có checklist từng bước.

4.4.2 Quản lý chương trình XKLĐ Nhật

Quản lý nghiệp đoàn – đơn hàng.

Điều kiện đơn hàng: chiều cao, sức khỏe, N4/N3.

Ghép ứng viên phù hợp.

4.4.3 Lưu trữ hồ sơ sức khỏe

Hồ sơ khám tổng quát – form XKLĐ.

Ngày hết hạn hồ sơ.

4.4.4 Nhắc nhở tự động

Nhắc ngày phỏng vấn tuyển dụng.

Nhắc ngày xuất cảnh.

Nhắc học phí – phí hồ sơ.

4.4.5 Báo cáo du học – XKLĐ

Số lượng COE được duyệt.

Tỉ lệ đỗ phỏng vấn nghề.

Số học viên đã xuất cảnh.

5. YÊU CẦU GIAO DIỆN (UI/UX)

Dashboard riêng cho từng vai trò.

Side menu: Học tập – Tuyển sinh – Du học/XKLĐ – Tài chính.

UI gần giống Edulive/EduSpace: phẳng, icon rõ, màu xanh dương – trắng.

Mobile responsive.

6. YÊU CẦU TÍCH HỢP

Zoom/Meet hoặc hệ thống live riêng.

Zalo OA API.

Cổng thanh toán: Momo, ZaloPay, OnePay.

SCORM/xAPI cho LMS.

7. YÊU CẦU BẢO MẬT

Role-based Access Control (RBAC).

Bảo mật dữ liệu cá nhân theo Nghị định 13/2023.

Mã hóa dữ liệu nhạy cảm.

OTP khi đăng nhập (tùy chọn).

Log audit toàn hệ thống.

8. YÊU CẦU HIỆU NĂNG

1.000 người dùng online đồng thời.

200 lớp live học/giờ.

Backup dữ liệu theo ngày.

Tối ưu truy vấn (PostgreSQL).

9. PHÂN TÍCH USE CASE CHÍNH (TÓM TẮT)
UC-01: Học viên đăng ký khóa học
UC-02: Sales nhận lead và tư vấn
UC-03: Giáo viên mở lớp live
UC-04: Học viên nộp bài tập
UC-05: Quản lý kiểm tra tiến độ du học
UC-06: Ghép ứng viên vào đơn hàng XKLĐ
UC-07: Thu học phí & báo cáo doanh thu
10. PHỤ LỤC
10.1 Danh sách báo cáo

Báo cáo doanh thu

Báo cáo học viên nợ học phí

Báo cáo tiến độ du học

Báo cáo XKLĐ theo nghiệp đoàn

Báo cáo tình hình học tập theo lớp

10.2 Tính năng tương lai

AI chấm bài JLPT.

Gợi ý đơn hàng XKLĐ theo hồ sơ ứng viên.

Dashboard AI dự đoán tỉ lệ đỗ COE.

Giao bài + nhắc học tập bằng AI.