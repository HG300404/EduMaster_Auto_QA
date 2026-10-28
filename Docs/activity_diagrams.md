# 🗺️ BẢN VẼ ACTIVITY DIAGRAM (SƠ ĐỒ HOẠT ĐỘNG) CHUẨN PLANTUML

Tài liệu này chứa mã nguồn **PlantUML** cho sơ đồ hoạt động (Activity Diagram) của các Use Case trong hệ thống **EduMaster Auto QA**. Các sơ đồ sử dụng cú pháp làn bơi phân làn (`|User|` và `|System|`) để hiển thị luồng chạy một cách rõ ràng và khoa học nhất.

---

## UC1: Xác thực người dùng (Đăng nhập)

Đây là sơ đồ hoạt động đã được vẽ với làn bơi User/System sạch sẽ và **mũi tên nét mảnh/mở** đúng theo yêu cầu của bạn:

![Sơ đồ hoạt động Xác thực người dùng (UC1)](C:/Users/MaiHuong/.gemini/antigravity-ide/brain/d240788d-00e8-4968-ae67-21d72464e456/login_activity_diagram.png)

### Mã nguồn PlantUML của sơ đồ trên:

```plantuml
@startuml
!theme plain
|User|
start
:Mở trang đăng nhập hệ thống;
repeat
  :Nhập địa chỉ Email và Mật khẩu;
  :Nhấn nút Đăng nhập;
  |System|
  if () then ([Không hợp lệ])
    |System|
    :Hiển thị thông báo lỗi đăng nhập;
    |User|
    :Nhập lại thông tin tài khoản;
  else ([Hợp lệ])
    |System|
    :Sinh mã thông báo bảo mật JWT;
    :Ghi nhận lịch sử đăng nhập vào nhật ký hệ thống;
    |User|
    :Lưu token JWT vào LocalStorage;
    :Chuyển hướng vào màn hình Dashboard chính;
    stop
  endif
repeat while ( ) is ([Đồng ý]) not ([Hủy])
@enduml
```

---

## UC2: Kích hoạt Test thủ công & Theo dõi Log (Polling)

Đây là sơ đồ hoạt động đã được vẽ với làn bơi User/System sạch sẽ, **mũi tên nét mảnh/mở** và **mũi tên quay lui đâm thẳng vào hình chữ nhật** đúng theo yêu cầu của bạn:

![Sơ đồ hoạt động Kích hoạt Test thủ công & Theo dõi Log (UC2)](C:/Users/MaiHuong/.gemini/antigravity-ide/brain/d240788d-00e8-4968-ae67-21d72464e456/uc2_activity_diagram.png)

### Mã nguồn PlantUML của sơ đồ trên:

```plantuml
@startuml
|User|
start
:Chọn kịch bản kiểm thử (Test Case);
:Nhấn nút "Run Test";
|System|
:Tạo bản ghi Test Run (status='pending');
:Đăng ký BackgroundTask thực thi pytest;
:Trả về mã phản hồi HTTP 202 (test_run_id);
|User|
:Nhận phản hồi & chuyển hướng sang trang chi tiết;
:Thực hiện Polling gửi yêu cầu lấy log (mỗi 1.5 giây);
|System|
:Cập nhật trạng thái Test Run (status='running');
:Khởi chạy tiến trình con pytest;
label read_log_loop
:Đọc dòng log console của pytest;
:Ghi dòng log vào file run_{id}.log;
|User|
:Nhận danh sách log qua API Polling và hiển thị;
|System|
if () then ([Đang chạy])
  goto read_log_loop
else ([Hoàn tất])
  |System|
  :Phân tích báo cáo JSON (pytest-json-report);
  :Lưu kết quả chi tiết vào bảng TestResult;
  if () then ([Kiểm thử thành công])
    :Cập nhật trạng thái Test Run (status='completed');
  else ([Có lỗi xảy ra])
    :Cập nhật trạng thái Test Run (status='failed');
  endif
  |User|
  :Hiển thị trạng thái kết quả & dừng Polling;
  stop
endif
@enduml
```

---

## UC3: Xem danh sách bộ test

```plantuml
@startuml
|User|
start
:Mở mục danh sách test trên Dashboard;
|System|
:Gửi yêu cầu GET /testsuites & GET /testcases;
:Truy vấn dữ liệu từ PostgreSQL;
if () then ([Có dữ liệu])
  |System|
  :Trả về danh sách Test Suite kèm Test Case;
  |User|
  :Hiển thị danh sách test (tiêu đề, trạng thái, đường dẫn);
else ([Không có dữ liệu])
  |System|
  :Trả về danh sách rỗng;
  |User|
  :Hiển thị giao diện danh sách trống;
endif
stop
@enduml
```

---

## UC4: Xem kết quả & Thống kê

Đây là sơ đồ hoạt động mô tả luồng lấy và hiển thị dữ liệu báo cáo thống kê:

![Sơ đồ hoạt động Xem kết quả & Thống kê (UC4)](C:/Users/MaiHuong/.gemini/antigravity-ide/brain/d240788d-00e8-4968-ae67-21d72464e456/uc4_activity_diagram.png)

### Mã nguồn PlantUML của sơ đồ trên:
```plantuml
@startuml
!theme plain
|User|
start
:Chọn mục "Test Reports" trên Dashboard;
|System|
:Gửi yêu cầu truy vấn danh sách Test Run và kết quả;
:Truy vấn dữ liệu từ PostgreSQL;
:Tính toán tỷ lệ Pass/Fail và tổng hợp thời gian chạy;
:Trả về dữ liệu JSON báo cáo;
|User|
:Hiển thị biểu đồ thống kê và bảng kết quả chi tiết;
stop
@enduml
```

---

## UC5: Theo dõi Log real-time (Polling logs)

Đây là sơ đồ hoạt động mô tả luồng polling logs thời gian thực:

![Sơ đồ hoạt động Theo dõi Log real-time (UC5)](C:/Users/MaiHuong/.gemini/antigravity-ide/brain/d240788d-00e8-4968-ae67-21d72464e456/uc5_activity_diagram.png)

### Mã nguồn PlantUML của sơ đồ trên:
```plantuml
@startuml
|User|
start
:Nhấn vào ID của Test Run đang chạy;
label poll_logs_loop
:Gửi yêu cầu GET /testruns/{id} (Polling mỗi 1.5 giây);
|System|
:Đọc file log cục bộ run_{id}.log;
:Trả về danh sách dòng log mới nhất;
|User|
:Hiển thị log lên Terminal & tự động cuộn xuống;
|System|
if () then ([Đang chạy])
  goto poll_logs_loop
else ([Hoàn tất])
  stop
endif
@enduml
```

---

## UC6: Quản lý Người dùng (Admin)

Đây là sơ đồ hoạt động mô tả luồng quản lý tài khoản người dùng của đặc quyền Admin:

![Sơ đồ hoạt động Quản lý Người dùng (UC6)](C:/Users/MaiHuong/.gemini/antigravity-ide/brain/d240788d-00e8-4968-ae67-21d72464e456/uc6_activity_diagram.png)

### Mã nguồn PlantUML của sơ đồ trên:
```plantuml
@startuml
|Admin|
start
:Mở trang User Management;
|System|
:Gửi yêu cầu GET /auth/users (kèm token Admin);
:Xác thực token & kiểm tra vai trò admin;
:Truy vấn danh sách người dùng từ Database;
:Trả về danh sách người dùng JSON;
|Admin|
:Hiển thị bảng danh sách người dùng;
fork
  note left
    Thay đổi vai trò
  end note
  :Chọn vai trò mới (admin/user) & Xác nhận;
  |System|
  :Gửi yêu cầu PUT /auth/users/{id}/role;
  :Cập nhật vai trò & ghi nhận vào Audit Log;
  :Trả về mã phản hồi HTTP 200 OK;
  |Admin|
  :Hiển thị thông báo thành công;
fork again
  note right
    Xóa tài khoản
  end note
  :Nhấn nút Xóa & Xác nhận trong Modal;
  |System|
  :Gửi yêu cầu DELETE /auth/users/{id};
  if () then ([Tự xóa])
    :Trả về mã lỗi HTTP 400 Bad Request;
    |Admin|
    :Hiển thị thông báo lỗi "Không thể tự xóa chính mình";
  else ([Hợp lệ])
    |System|
    :Xóa bản ghi & ghi nhận Audit Log;
    |Admin|
    :Hiển thị thông báo xóa thành công;
  endif
end fork
stop
@enduml
```

---

## UC7: Xem lịch sử hệ thống (Audit Logs - Admin)

Đây là sơ đồ hoạt động mô tả luồng kiểm tra lịch sử thao tác hệ thống của đặc quyền Admin:

![Sơ đồ hoạt động Xem lịch sử hệ thống (UC7)](C:/Users/MaiHuong/.gemini/antigravity-ide/brain/d240788d-00e8-4968-ae67-21d72464e456/uc7_activity_diagram.png)

### Mã nguồn PlantUML của sơ đồ trên:
```plantuml
@startuml
|Admin|
start
:Mở trang Audit Logs;
|System|
:Gửi yêu cầu GET /auth/audit (kèm token Admin);
:Xác thực token & kiểm tra vai trò admin;
repeat
  |System|
  :Truy vấn danh sách Audit Log từ Database;
  :Trả về danh sách lịch sử JSON;
  |Admin|
  :Hiển thị bảng lịch sử hoạt động;
  backward:Nhập từ khóa tìm kiếm (email/hành động) hoặc nhấn Refresh;
repeat while ( ) is ([Lọc / Làm mới]) not ([Thoát])
stop
@enduml
```

