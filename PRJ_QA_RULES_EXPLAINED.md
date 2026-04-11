# Giải thích chi tiết PRJ_QA_RULES.md (EduMaster Automation Rules)

Tài liệu này phân tích chi tiết từng phần trong file `PRJ_QA_RULES.md` của dự án EduMaster, giúp thành viên đội QC/Automation hiểu rõ định hướng, tư duy cốt lõi và cách thức triển khai tự động hóa kiểm thử (Automation Test) một cách vững chắc, ổn định và chuyên nghiệp.

---

## 1. Core Testing Philosophy (Triết lý Kiểm thử Cốt lõi)

### Mô hình Arrange-Act-Assert (AAA)
*   **Là gì?** Chia cấu trúc của một hàm kiểm thử thành 3 bước riêng rẽ, không dính líu với nhau:
    *   **Arrange (Chuẩn bị):** Set up môi trường, biến, khởi tạo dữ liệu.
    *   **Act (Hành động):** Gọi trực tiếp vào tính năng cần được test.
    *   **Assert (Xác minh):** So sánh kết quả trả về của hàm Act xem có khớp với kỳ vọng thực tế không.
*   **Ý nghĩa & Tầm quan trọng:** Đóng vai trò như "chuẩn mực rõ ràng". Dù project có 100 hay 1000 file tests, khi ai đó đọc code, họ có thể quét mắt nhanh chóng và hiểu test case này đang test thao tác gì. Code không bị rối rắm chồng chéo.
*   **Ví dụ:**
    ```python
    def test_calculate_cart_total():
        # Arrange: Tạo giỏ hàng và thêm 2 món đồ
        cart = Cart()
        cart.add_item({"price": 50})
        cart.add_item({"price": 100})
        
        # Act: Yêu cầu tính tổng tiền
        total = cart.get_total()
        
        # Assert: Xác minh kết quả phải là 150
        assert total == 150
    ```

### Idempotency (Tính độc lập / Bất biến)
*   **Là gì?** Bất kỳ test case nào cũng phải thực thi được một mình, không phụ thuộc vào kết quả hoặc dữ liệu của test case trước đó tạo ra. Test case này chạy trước hay chạy sau đều phải Pass. Luôn phải dùng `db_seed` (chèn dữ liệu mẫu) hoặc gọi API trực tiếp (API calls) để tự tạo dữ liệu mồi trước khi chạy kịch bản chính, và dùng các hàm dọn dẹp (`teardown` hooks) ở cuối mỗi test để xóa sạch chúng đi.
*   **Ý nghĩa & Tầm quan trọng:** Khắc phục triệt để lỗi "Flaky Test" (chạy lúc Pass lúc Fail). Nó đảm bảo rằng dữ liệu rác từ test A không làm test B bị sai. Hỗ trợ chạy hàng loạt test song song an toàn, không sợ bị phụ thuộc thay đổi dữ liệu tĩnh của nhau.
*   **Ví dụ:** Tình huống Kiểm tra thông báo lỗi khi trùng lặp email.
    *   **Bước 1:** Gọi API phụ tạo nháp 1 tài khoản `test_trung_lap@email.com` vào DB.
    *   **Bước 2:** Mở trình duyệt Web lên test kịch bản Đăng ký tài khoản và điền form bằng chính email trên ➡️ Assert có chữ báo lỗi màu đỏ.
    *   **Bước 3 (Hủy data):** Chạy hàm dọn vệ sinh gọi API gạch tên `test_trung_lap@email.com` khỏi DB ngay lập tức để lần chạy sau không bị lỗi.

### Environment (Kiểm soát Môi trường)
*   **Là gì?** Không bao giờ hardcode (gán cứng) các đường dẫn API hay Website vào thẳng code test. Phải đưa chúng ra file biến môi trường (Ví dụ `.env.test`) thông qua các biến cấu hình `BACKEND_URL`, `FRONTEND_URL`. Cách ly hoàn toàn bộ test khỏi Database Production (dữ liệu thật).
*   **Ý nghĩa & Tầm quan trọng:** Đảm bảo bộ test chạy được linh hoạt trên mọi máy (Local, Staging hay CI) mà không phải sửa code. Tránh rủi ro chạy script automation và làm hỏng cơ sở dữ liệu thật chạy thực tế của hệ thống.

---

## 2. UI Testing Standards (Tiêu chuẩn Kiểm thử Giao diện Playwright + TypeScript)

### Architecture (Mô hình POM - Page Object Model)
*   **Là gì?** Sử dụng Page Object Model (`tests/ui/pages/`). Là kỹ thuật tách rời 2 thành phần: **Cách tìm các phần tử trên web (UI Locators)** và **Các bước kịch bản test (Testing Logic)** ra thành 2 file khác nhau. Thay vì viết lệnh tương tác web thẳng vào file kịch bản test, ta gom tất cả các nút bấm, ô nhập của một trang (ví dụ Trang Đăng nhập) vào một đối tượng Class (ví dụ: `LoginPage`).
*   **Ví dụ để hiểu về "Sự tách rời":**
    *   ❌ **Khi KHÔNG dùng POM (Dính chặt):** Trong file test, bạn viết thẳng lệnh: `page.locator('#btn-login').click()`. Thử tưởng tượng hệ thống có 50 test cases đều cần đăng nhập lúc đầu, bạn sẽ phải viết lại dòng `locator('#btn-login')` này ở 50 file khác nhau.
    *   ✅ **Khi dùng POM (Tách rời):** 
        - Bạn gom giao diện vào file `LoginPage.ts` chứa: `nút_đăng_nhập = page.locator('#btn-login')` và hàm `click_đăng_nhập()`.
        - Trong 50 file test, bạn chỉ cần gọi hàm: `LoginPage.click_đăng_nhập()`.
        👉 File test bây giờ chỉ lo **"Bước này gọi hành động gì"** (Logic Test), chứ không thèm quan tâm **"Cái nút đó cấu tạo HTML thẻ ID là gì để mà bấm"** (UI Locators) nữa. Chữ "Tách rời" chính là như vậy.
*   **Ý nghĩa & Tầm quan trọng:** Tái sử dụng code và bảo trì siêu nhàn. Giả sử ngày mai đội Frontend đổi mã nguồn, xóa ID `#btn-login` thay bằng class `.btn-submit`.
    *   Nếu code dính chặt: Bạn phải mở 50 file test tìm dòng chứa `#btn-login` để sửa thành `.btn-submit` (Rất dễ sót và mất vài tiếng đồng hồ).
    *   Nếu dùng Class POM: Bạn chỉ cần mở CHỈ 1 FILE `LoginPage.ts` ra sửa lại cái `nút_đăng_nhập`. 50 file test kia vốn dĩ chỉ gọi hàm `click_đăng_nhập()` nên chúng tự động bắt được sửa đổi và chạy tiếp trơn tru.

### Selectors (Bộ chỉ thị vị trí phần tử / Cách tìm HTML)
*   **Là gì?** Cách bạn ra lệnh cho Playwright "Nhìn vào đâu trên trang web để tìm cái thẻ HTML đó".
    *   **Ưu tiên 1 (Dùng `data-testid`):** Đây **KHÔNG** phải là thuộc tính `id="..."` hay `class="..."` thông thường của thẻ HTML. Nó là một thuộc tính *chuyên biệt* do chính lập trình viên (Dev) gắn thêm vào thẻ HTML chỉ với mục đích duy nhất: Phục vụ cho đội Test.
        *   *Ví dụ mã HTML:* `<button class="btn primary" id="submit-form" data-testid="login-btn">Đăng Nhập</button>`
        *   *Lệnh Test tương ứng:* `page.getByTestId('login-btn').click()`
        *   *Tại sao Ưu tiên 1?* Vì thuộc tính `class` hay `id` sinh ra là để cho Dev dùng (để gắn màu sắc CSS, gắn sự kiện Javascript). Dev có xu hướng **RẤT HAY THAY ĐỔI / XÓA BỎ** các `class` và `id` này khi làm giao diện mới. Nhưng bù lại, họ sẽ KHÔNG BAO GIỜ dám động vào trường `data-testid` (vì họ biết nếu xóa là Automation của đội QA sẽ bị sập). Do đó, tìm nút bằng `data-testid` là **An toàn và Ổn định nhất**.
    *   **Ưu tiên 2 (Chọn theo hành vi Người dùng):** Nếu không có `data-testid`, hãy định vị như một người mù lướt nét. Bạn muốn bấm chữ "Gửi đi"? Hãy dùng mã `page.getByRole('button', { name: 'Gửi đi' })`. 
    *   **Hạn chế/Tránh tuyệt đối (Tránh CSS Selector/XPath thô):** Đây là cách tìm phần tử dựa trên sơ đồ cây của mã nguồn HTML.
*   **Ý nghĩa giải thích tại sao gọi là "Giòn / Dễ gãy (Fragile)":** 
    *   *Ví dụ bạn vi phạm (Dùng CSS):* Bạn viết code test bảo Playwright đi tìm cái nút nằm ở: `div > ul > li:nth-child(2) > a`. (Nghĩa là: Vào thẻ div, xuống danh sách ul, tìm dòng li thứ 2, chọn cái Link). Đoạn code này chạy rất ngon!
    *   *Cái kết:* Hôm sau, Dev chèn thêm một cái biểu tượng logo (`<img/>`) xen vào giữa dòng thẻ `li` và cái đường link `a`. Lúc này cấu trúc đã tự động biến thành: `div > ul > li:nth-child(2) > img > a`.
    *   👉 **Code Test của bạn sập ngay lập tức! (Lỗi Không Tìm Thấy Phần Tử)**. Bạn sẽ dành cả ngày trời chỉ để đi sửa lại đường dẫn cấu trúc này thay vì viết Test mới. Đó chính là sự "giòn/dễ gãy" của CSS/XPath mà thư viện chuẩn khuyên chúng ta nên tẩy chay.

### Stability (Độ ổn định - Chờ đợi thông minh)
*   **Là gì?** Tuyệt đối **không** dùng "Hard Wait" (chờ cứng định dạng như `time.sleep(5)`). Thay vào đó, dùng `locator.waitFor()` của Playwright để chờ đợi linh hoạt (Nút hiện lên sau 1s thì test chạy tiếp luôn). Hủy chặn (intercept) các dịch vụ phân tích (Analytics) mạng để trang tải nhanh hơn.
*   **Ý nghĩa & Tầm quan trọng:** Tối ưu hóa thời gian chạy. Tránh trường hợp mạng lag nhưng chờ cứng 5s bị quá thời gian làm test Fail oan, cũng tránh test nhàn rỗi lãng phí thời gian khi tài nguyên đã load xong sớm.

---

## 3. API Testing Standards (Tiêu chuẩn Kiểm thử API Pytest + Python)

### Structure (Cấu trúc thư mục)
*   **Là gì?** Quy định vị trí đặt file test API: Phải nằm gọn gàng trong thư mục `tests/api/`. Đồng thời, các "cấu hình và dữ liệu mồi dùng chung toàn cục" phải được đặt vào một file đặc biệt có tên là `conftest.py`.
*   **Giải thích "Cấu hình và dữ liệu mồi dùng chung toàn cục":**
    *   **Toàn cục (Global) nghĩa là gì?** Nghĩa là bạn viết code 1 lần ở file `conftest.py`, thì TẤT CẢ 500 file test nằm trong cùng thư mục đó đều tự động nhận được và dùng được đoạn code đó mà không cần gõ lệnh `import`.
    *   **Cấu hình chung là gì?** Ví dụ biến `BASE_URL = "https://api.edumaster.com/v1"`. Bạn để vào trong `conftest.py` thay vì khai báo ở từng file test lẻ loi.
    *   **Dữ liệu mồi dùng chung là gì?** Ví dụ hệ thống có 200 API cần quyền Admin mới gọi được. Nếu tính bình thường, mỗi file test bạn phải viết lại 1 hàm `gọi_API_đăng_nhập_để_lấy_Token_Admin()` dài dòng. Nhưng nếu bạn nhét hàm đó vào `conftest.py` và đặt cho nó cái tên (Fixture) là `admin_token`. Thì từ nay về sau, các file test API khác chỉ cần truyền đúng 1 chữ `admin_token` vào đối số của hàm, Pytest sẽ TỰ ĐỘNG chạy cái hàm mồi kia và bơm dữ liệu token sẵn sàng cho bạn xài. Dữ liệu mồi này giúp tiết kiệm hàng nghìn dòng code lặp lại.
*   **Ý nghĩa & Tầm quan trọng:** Sự ngăn nắp. Phân tách rõ ràng giữa Test Giao Diện (`tests/ui/`) và Test Backend (`tests/api/`). Việc để cấu hình chung vào `conftest.py` giúp Framework Pytest tự động nhận diện và nạp các thiết lập này trước khi chạy bất kỳ file test nào mà không cần bạn phải `import` thủ công ở từng file.

### Fixtures (Dữ liệu mồi dùng chung)
*   **Là gì?** Dùng `conftest.py` để định nghĩa những thứ dùng chung cho môi trường Test (ví dụ: `api_client`, `auth_token` như `admin_token`, `student_token`).
*   **Ý nghĩa & Tầm quan trọng:** Tuân thủ nguyên tắc DRY (Don't Repeat Yourself). Thay vì hàm test API nào cũng lặp lại gọi đăng nhập hệ thống để lấy Token, giờ đây bạn chỉ lôi fixture `admin_token` vào hàm, hệ thống tự cấp phiên làm việc đã đăng nhập sẵn.

### Validation (Xác minh chặt chẽ với Schema)
*   **Là gì?** Khi phản hồi API trả về, không chỉ kiểm tra đơn giản `Status Code == 200`, mà phải đẩy dữ liệu đó trượt qua thư viện Pydantic models hoặc cấu trúc JSON Schema để kiểm chứng xem đúng từng trường, kiểu trường hay không.
*   **Ý nghĩa & Tầm quan trọng:** Bắt ngay lỗi thay đổi cấu trúc dữ liệu. Ví dụ Backend bất chợt trả về `student.age` là chuỗi String `"18"` thay vì số Integer `18` 👉 Schema Regex sẽ bắt được lỗi định dạng cấu trúc này ngay lập tức.

### Performance (Hiệu suất chạy Test)
*   **Là gì?** Tiêu chuẩn hỗ trợ chạy test song song bằng plugin `pytest-xdist`.
*   **Ý nghĩa & Tầm quan trọng:** Nếu bạn có 500 API test cases, chạy nối đuôi nhau (tuần tự) có thể mất 15 phút. Khi dùng `pytest-xdist -n 4` (chạy song song 4 luồng), thời gian sẽ được rút xuống chỉ còn gần 4 phút. Tốc độ rất quan trọng trong môi trường CI/CD để toàn bộ đội Dev không phải chờ đợi "vã mồ hôi" mỗi khi đẩy code lên. (Lưu ý: Để chạy song song được không nổ vỡ Database, các test case phải tuân thủ tuyệt đối tính **Idempotency** đã nói ở trên).

---

## 4. Database & State Management (Quản trị trạng thái và Dữ liệu)

### Strategy (Chiến lược Chuẩn bị Dữ Liệu mồi)
*   **Là gì?**
    *   **Với test API:** Gói các thao tác Insert/Update vào database thành một chu trình Transaction (giao dịch ảo). Cuối test ra lệnh DB Rollback (Hoàn tác) để mọi thao tác biến mất, không đọng rác.
    *   **Với test UI:** Đừng thao tác trỏ chuột, điền form UI theo cách thủ công (quá chậm) để tạo dữ liệu nền. Hãy dùng API "cửa sau" đi tắt, tạo trực tiếp dữ liệu trước rồi mới gọi Playwright lên kiểm tra giao diện của luồng đó.
        *   *(Giải đáp thắc mắc: Vậy lỡ Form UI bị hỏng, báo lỗi hay không nhập được các trường thì sao?)* 
        *   **Trả lời:** Theo bộ quy tắc Automation, ta sẽ **KHÔNG bỏ qua Form UI**, nhưng ta chỉ viết **ĐÚNG 1 Test Case DUY NHẤT** để chuyên điền Form thủ công từ A-Z (để chứng minh cái Form đó hoạt động tốt). Còn lại 99 Test Case khác (ví dụ: Test Đổi Tên, Test Xóa, Test Xuất Excel) thì ta KHÔNG BẮT nó phải đi lại tử đầu là điền Form tạo mới nữa. Ở 99 Test case đó, ta gọi API cái rụp tạo xong data nền rồi tập trung chuyên môn vào việc Test nút Đổi Tên, Nút Xóa... Việc này giúp tiết kiệm 99 lần thời gian con Bot Playwright phải hì hục ngồi gõ chữ nhập Form một cách vô nghĩa.
*   **Ý nghĩa & Tầm quan trọng:** Giúp bộ test chạy với tốc độ tên lửa thay vì con rùa; không để lại dữ liệu "rác" trên databse sau khi chạy Automation Test. Tránh lặp lại việc Test cái Form 100 lần khi ta chỉ cần Test nó 1 lần là đủ để chứng minh nó đang chạy.

### Tooling (Dữ liệu ngẫu nhiên với Faker)
*   **Là gì?** Sử dụng thư viện `Faker` (ở cả TS và Python) để tạo các dữ liệu động, ngẫu nhiên (chẳng hạn sinh email giả, tên tuổi giả, SĐT giả).
*   **Ý nghĩa & Tầm quan trọng:** Ngăn chặn việc tạo dữ liệu trùng lặp dẫn tới Exception lúc Test mã số/email đặc biệt hay Identity (ID) bị đụng độ với hệ thống cũ.

---

## 5. CI/CD Integration (Tích hợp với hệ thống chạy tự động như GitHub Actions)

### Workflow (Luồng chạy tự động)
*   **Là gì?** Khi lập trình viên (Dev) đẩy code lên nhánh nhánh Git, hệ thống CI/CD (như GitHub Actions, GitLab CI) sẽ tự động kích hoạt máy chủ từ xa mồi code về và chạy nguyên bộ Test Automation khổng lồ của bạn.
*   **Vì sao Rule yêu cầu "Chia 2 luồng Workflow riêng":**
    *   **Luồng 1 (Lõi API - `ci-api.yml`):** Test API thô chạy với tốc độ ánh sáng (1 phút). Hệ thống sẽ thiết lập tự động chạy luồng này **MỖI KHI DEV COMMIT CODE LÊN**. Nếu API gãy, còi báo động réo ngay lặp tức bắt Dev sửa. 
    *   **Luồng 2 (Giao diện UI - `ci-playwright.yml`):** Test UI (mở nguyên cái Web Browser lên tải trang, bấm chuột) chạy rất chậm (15 phút - 30 phút). Nếu bắt Dev cứ gõ 1 dòng code xong phải ngồi chắp tay mướt mồ hôi đợi 30 phút test báo xanh mới được merge code thì họ sẽ trầm cảm. Do đó luồng UI này **chỉ được tự động chạy 1 lần vào buổi đêm** (Nightly Build) hoặc khi chuẩn bị Release lên Production (Nghiệm thu cuối cùng). Sự "Chia tách kịch bản" thông minh này giúp môi trường làm việc Dev/QA không bị tắc nghẽn.

### Artifacts (Trở lại hiện trường vụ án lúc lỗi Test)
*   **Là gì?** Khi chạy Test ở máy cá nhân (Local), nếu gặp lỗi, nó sẽ bung cửa sổ đỏ và bạn dễ dàng đọc logs ngay. Nhưng khi "Nhờ Server chạy ngầm", bạn **KHÔNG THỂ** thò đầu vào cái Server ảo trên mây đó để xem tận mắt điều gì đã xảy ra khiến Test Fail. *Artifacts* được sinh ra để nén những "bằng chứng tội phạm" này lại thành một file ZIP và đính kèm trên bảng điện tử của GitHub/GitLab.
*   **Ví dụ thực tế:**
    *   **Tình huống:** Kỹ sư QA viết kịch bản `Test chức năng Nộp Bài Tập`. Khi chạy trên máy trạm nội bộ (Local), kịch bản thực thi thành công (Pass). Tuy nhiên, khi mã nguồn được đẩy lên và hệ thống CI (GitHub Actions) tự động chạy lại kịch bản này, kết quả nhận được là Thất bại (Fail).
    *   **Khó khăn:** Kỹ sư QA không thể truy cập trực tiếp vào giao diện đồ họa của máy chủ ảo trên GitHub để xem nguyên nhân tại sao lúc đó nút "Nộp Bài" không bấm được.
    *   **Giải pháp với Artifacts:** Nhờ cấu hình xuất Artifacts, hệ thống CI đã tự động ghi hình và thu thập lại tệp **`playwright-report`**, một tấm **`screenshot` (ảnh chụp màn hình tại thời điểm phát sinh lỗi)**, và một đoạn **`video`**.
    *   **Kết quả:** Kỹ sư chỉ cần tải tệp Artifacts (dạng file ZIP) từ giao diện GitHub actions về máy tính cá nhân. Khi mở đoạn Video ghi hình kịch bản lỗi, kỹ sư phát hiện ra tại thời điểm đó, có một Banner quảng cáo bất ngờ xuất hiện che khuất nút "Nộp Bài Tập", dẫn đến việc engine Playwright không thể tương tác với phần tử. Từ đó, người Kỹ sư nhanh chóng tìm ra nguồn gốc lỗi (bug) để điều chỉnh script chờ Banner biến mất thay vì phải tốn hàng giờ đồng hồ tìm lỗi một cách mù quáng.

### Caching (Bộ nhớ đệm cho Thư viện)
*   **Là gì?** Quy tắc yêu cầu hệ thống CI/CD phải lưu lại (cache) các thư viện cài đặt bên thứ 3, cụ thể là thư mục `node_modules` (cho Playwright/TypeScript) và các gói `pip` (cho Pytest/Python).
*   **Ý nghĩa & Tầm quan trọng:**
    *   **Nếu KHÔNG có Caching:** Mỗi lần chạy một luồng CI/CD, máy chủ mây ảo phải lại từ đầu lên mạng kéo tải toàn bộ hàng trăm Megabytes thư viện (tốn trung bình 2-3 phút chỉ để cài đặt môi trường). Mất rất nhiều thời gian chết.
    *   **Nhờ CÓ Caching:** Máy chủ khởi động lên sẽ bốc ngay bản sao hệ thống thư viện đã lưu đè từ lần chạy trước đó (chỉ mất mười mấy giây). Việc này giúp ép sát tổng thời gian cả quá trình luồng CI xuống mức cực thấp (dưới 5 phút - `< 5 mins`), tiết kiệm tài nguyên mạng và tăng năng suất cho toàn bộ đội ngũ Lập Trình/QA khi đang hóng kết quả kiểm thử.

---

## 6. Documentation & Maintenance (Tài liệu & Vận hành)

*   **Readme:** Luôn phải duy trì `/docs/tests/automation_readme.md` ở trạng thái cập nhật nhất đi kèm ví dụ lệnh `npm run test` hay `pytest`.
*   **Flakiness (Đánh dấu Test bất ổn):** Bất cứ test nào thi thoảng (fail 2/10 lần trở lên) mới bị lỗi 👉 Bắt buộc đóng băng với `@pytest.mark.flaky` hoặc `test.fixme()`.
    *   **ĐÁNH DẤU XONG RỒI SAO NỮA? (Quy trình xử lý Test Chập chờn):**
        *   **Bước 1 (Cách ly lập tức):** Việc bạn gắn cờ `fixme()` sẽ tạm thời cách ly test này khỏi danh sách bị la mắng trên Server. Báo cáo tổng vẫn trả về XANH (PASSED) để Development Team tiếp tục đẩy code ra Production mà không bị dính án nén lại oan uổng do lỗi từ đoạn test tồi của bạn.
        *   **Bước 2 (Ghi nhận nợ Kỹ Thuật):** Đừng gắn thẻ xong quăng đó rồi quên. Bạn cần tạo ngay 1 thẻ Bug Jira Ticket tên là "Sửa Flaky Test ở Module XXX" và ném vào trong danh sách "Công việc tồn đọng (Backlog)" của Team QA.
        *   **Bước 3 (Điều tra nguyên nhân trên Local):** Lúc rảnh, kéo nó về máy cá nhân Debug thủ công để tóm xem lỗi do đâu. Thường do 3 loại: 1-Mạng bị lag nên chưa có `<data-testid>` mà bạn đã bấm; 2-Dữ liệu mồi Idempotency chưa sạch; 3-UI render không ổn định (Animation). Sửa lại cấu trúc `locator.waitFor()` thay vì dùng sleep.
        *   **Bước 4 (Trả tự do):** Sau khi sửa xong trên máy mình mà test lại 20 lần đều xanh mượt thì **xóa dòng lệnh đánh dấu** `@pytest.mark.flaky` hoặc `test.fixme()` đi. Tái hợp nó lại vào đội hình kịch bản Test chung!
*   **Ý nghĩa & Tầm quan trọng:** Nhằm giữ độ tin cậy tuyệt đối vào Report kết quả test của Automation trong mắt tập thể nhóm. Không được để những Test chập chờn gây báo động giả làm tốn thời gian cả đội QC/Dev rà soát lại kết quả không chắc chắn.

---

## 7. Mandatory File Headers (Tiêu đề Định Danh Bắt Buộc Đầu File)

*   **Là gì?** Phải comment cố định 3 dòng ở đầu file Code Test. Chú thích rõ nó thuộc Project nào, Module phòng ban nào (CRM, LMS, Finance), và thể loại (UI-E2E hay API).
    ```javascript
    // @project: EDUMASTER
    // @module: Finance
    // @type: UI-E2E
    ```
*   **Ý nghĩa & Tầm quan trọng:** Phục vụ cho Data Mining (đào dữ liệu) và quản lý chuyên nghiệp trong tương lai xa. Giúp QC Leader trong 1 giây có thể quét hệ thống để tạo báo cáo hay ra lệnh chạy: "Chỉ chạy toàn bộ UI test của phòng ban Finance, không chạy Module khác".

---

## 8. Test Data Strategy (Chiến lược dữ liệu Test)
*   **Tại sao cần:** Test chạy bị "flaky" (lúc pass lúc fail) thường là do dữ liệu bị trùng lặp, thiếu hoặc bị thay đổi bởi luồng test khác.
*   **Cách áp dụng vào Automation:**
    *   **Dynamic Data:** Sử dụng thư viện `Faker` (như đã quy định ở Rule 4) để tạo email/username ngẫu nhiên (ví dụ: `student_12345@test.com`).
    *   **Data Provisioning:** Viết các API script (Pytest) để tự động tạo (seed) dữ liệu chuẩn bị cho UI test (Playwright), thay vì phải click tay từng bước qua UI để vào được màn hình cần test.
    *   **Data Cleanup:** Dùng hook `teardown` hoặc khối `finally` để xóa data sau cú test, trả lại môi trường sạch sẽ.

## 9. Error Diagnostics (Chẩn đoán lỗi tự động)
*   **Tại sao cần:** Khi test chạy thất bại trên CI/CD, bạn không thể ngồi xem trực tiếp. Cần biết chính xác tại sao nó thất bại.
*   **Cách áp dụng vào Automation:**
    *   **Playwright (UI):** Tự động bật tính năng `trace: 'retain-on-failure'` trong `playwright.config.ts`. Nó sẽ ghi lại toàn bộ DOM, Network, Console Logs tại thời điểm lỗi. Tự động chụp screenshot và quay video lúc fail.
    *   **Pytest (API):** Custom lại hàm log lỗi, in ra toàn bộ `Request_URL`, `Request_Body`, `Response_Status` và `Response_Body` khi một Assertion thất bại.

## 10. Test Tagging & Execution Strategy (Chiến lược gắn thẻ & thực thi)
*   **Tại sao cần:** Dự án ngày càng lớn, không thể chạy tất cả (Full Regression) cho mỗi lần dev commit code nhỏ vì sẽ tốn rất nhiều thời gian.
*   **Cách áp dụng vào Automation:**
    *   Sử dụng tags: Tách test thành các nhóm như `@Smoke` (kiểm tra luồng chính), `@Regression`, `@EduMaster_CRM`.
    *   **Pytest:** Dùng marker (`@pytest.mark.smoke`).
    *   **Playwright:** Dùng feature tag (`test('login', { tag: '@smoke' }, () => {...})`).
    *   Trên CI/CD pipeline: Chạy `@Smoke` khi Dev tạo Pull Request, và chạy `@Regression` vào ban đêm.

## 11. Security Testing (Kiểm thử bảo mật tự động)
*   **Tại sao cần:** Tìm ra các lỗ hổng cơ bản một cách tự động trước khi hệ thống bị tấn công.
*   **Cách áp dụng vào Automation:**
    *   **Pytest API:** Thêm các test case cố tình truyền token giả, thiếu token, hoặc chứa SQL Injection vào payload để đảm bảo API trả về lỗi `401 Unauthorized` hoặc `403 Forbidden` hợp lý.
    *   Tích hợp công cụ rà quét dependency (ví dụ npm audit / pip-audit) chạy trong pipeline để phát hiện thư viện chứa mã độc/lỗ hổng.

## 12. Performance Guardrails (Rào chắn kiểm soát hiệu năng)
*   **Tại sao cần:** Đảm bảo hệ thống không bị chậm đi sau những lần cập nhật code mới.
*   **Cách áp dụng vào Automation:**
    *   **API (Pytest):** Đặt ngưỡng Assert thời gian phản hồi (ví dụ: `assert response.elapsed.total_seconds() < 1.0` - chậm quá 1 giây là fail).
    *   **UI (Playwright):** Đo đạc thời gian render của các element (Largest Contentful Paint), đảm bảo bảng dữ liệu lớn load không quá 3 giây.

## 13. Accessibility Testing (Kiểm thử khả năng tiếp cận - a11y)
*   **Tại sao cần:** Đảm bảo ứng dụng web tuân thủ luật pháp và hỗ trợ tốt cho người khuyết tật (đọc màn hình qua screen readers, tương tác phím tab, độ tương phản màu).
*   **Cách áp dụng vào Automation:**
    *   Với Playwright: Tích hợp thư viện `@axe-core/playwright`. Mỗi khi load xong 1 trang quan trọng, gọi `checkA11y()` để quét toàn bộ trang xem có nút bấm nào bị thiếu nhãn (`aria-label`) hay lỗi tương phản.

## 14. Visual Regression (Kiểm thử hồi quy giao diện)
*   **Tại sao cần:** Phát hiện những thay đổi CSS không mong muốn (ví dụ nút bấm bị lệch, xộc xệch, mờ đi...) mà các Assert lấy text thông thường không thể nhận ra.
*   **Cách áp dụng vào Automation:**
    *   Playwright: Sử dụng hàm `expect(page).toHaveScreenshot()`. Hệ thống sẽ chụp ảnh web hiện tại và so sánh "từng pixel" với ảnh gốc đã lưu. Nếu lệch, test sẽ fail và chỉ ra điểm khác biệt.

## 15. Contract Testing (Kiểm thử hợp đồng API)
*   **Tại sao cần:** Backend và Frontend đổi code độc lập. Cần đảm bảo khi cấu trúc dữ liệu Backend trả về thay đổi, Frontend không bị lỗi ngầm.
*   **Cách áp dụng vào Automation:**
    *   Sử dụng **Pydantic** trong `Pytest` khai báo schema chuẩn để validate response JSON.
    *   Nâng cao hơn: Dùng framework **Pact** để ràng buộc hợp đồng giao tiếp rõ ràng hơn giữa 2 bên.

## 16. Test Observability (Tính năng quan sát kết quả Test)
*   **Tại sao cần:** Nắm bắt tổng quan kết quả tự động trong nháy mắt, dễ dàng phân tích nguyên nhân lỗi, số lượng test case vượt qua/thất bại dành cho cả QA, Dev và Quản lý.
*   **Cách áp dụng vào Automation:**
    *   Triển khai **Allure Report** cho cả Playwright và Pytest để hiển thị biểu đồ Pass/Fail, Flaky test, Lịch sử chạy.
    *   Thiết lập gửi thông báo/cảnh báo trực tiếp qua **Slack / Teams / Zalo** bằng Webhook khi có lỗi trên CI/CD, kèm link chi tiết vào Report.

## 17. Version Stability (Đảm bảo tính ổn định của Version)
*   **Tại sao cần:** Môi trường test cần sự đồng nhất tuyệt đối. Cập nhật trình duyệt tự động hoặc nâng phiên bản thư viện có thể làm vỡ cấu trúc test.
*   **Cách áp dụng vào Automation:**
    *   Fix cứng phiên bản thư viện trong các file `package-lock.json`, `poetry.lock` hoặc `requirements.txt`.
    *   Sử dụng **Docker image cố định** (như `mcr.microsoft.com/playwright:v1.40.0-jammy`) trên CI/CD để đảm bảo trình duyệt Chrome/Firefox được dùng để test không tự động cập nhật phiên bản mới.

