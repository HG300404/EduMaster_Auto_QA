# Các Quy Tắc Chuẩn (Rules) Dành Cho Frontend (React + HeroUI)

Nhằm đảm bảo giao diện quản lý test hoạt động mượt mà, đồng nhất thiết kế và không gặp rủi ro runtime crash, mọi đoạn code Frontend cần tuân thủ các quy định dưới đây:

## 1. Ngôn Ngữ & Cấu Trúc Component
*   **TypeScript (Bắt buộc):** Do Backend và hệ thống Test đang dùng định dạng type rõ ràng, Frontend bắt buộc sử dụng **TypeScript** (`.ts`, `.tsx`) để khai báo kiểu dữ liệu cho Props, State, và API Responses. Tránh tối đa sử dụng `any`.
*   **Functional Components:** Chỉ sử dụng Functional Component kết hợp với Hooks. Không dùng Class Component.
*   **Early Return:** Ưu tiên pattern "Early Return" để code gọn gàng, tránh việc lồng (nest) nhiều khối `if/else`.
*   **Component Nhỏ & Tái sử dụng:** Bất kỳ phần giao diện nào xuất hiện ở 2 nơi trở lên, phải tách ra thành Component riêng biệt (ví dụ: `StatusBadge`, `ActionButtons`).

## 2. Giao Diện & Styling (HeroUI + Tailwind)
*   **Ưu tiên HeroUI:** Luôn sử dụng các UI Component có sẵn của HeroUI (Button, Table, Modal, Card...) trước. Chỉ custom khi HeroUI không hỗ trợ.
*   **Tailwind Utility Classes:** Định dạng giao diện hoàn toàn bằng Tailwind CSS. **Không viết thêm các file `.css` hay `.scss` tùy chỉnh** trừ khi đó là các animation/keyframe rất phức tạp hoặc CSS variables cục bộ.
*   **Màu sắc thiết kế:** Sử dụng hệ thống màu thiết lập sẵn trong `tailwind.config.ts`. Không dùng mã HEX trực tiếp trong component (`className="text-[#ff0000]"` -> Sai; Nên cấu hình biến màu trong tailwind).

## 3. State Management & Data Fetching
*   **Tách biệt State:**
    *   *Local State* (UI state đóng/mở modal, form input): Dùng `useState` hoặc `useReducer`.
    *   *Global State* (User info, theme, global filter): Dùng **Zustand**. Không lạm dụng Redux vì gây phức tạp không cần thiết.
    *   *Server State* (Fetching danh sách Test, Logs): Bắt buộc dùng **React Query** (hoặc SWR). Điều này giúp tự động xử lý trạng thái `loading`, `error`, và `caching` cực kỳ an toàn, chống giật/lag giao diện.
*   **Tránh Prop Drilling:** Không truyền dữ liệu (props) qua quá 3 tầng Component. Thay vào đó dùng Zustand hoặc Context API.

## 4. Quản Lý Gọi API
*   **Axios Interceptor:** Mọi request gọi API đến Backend phải thông qua một instance cấu hình sẵn của `Axios`. Phải có Interceptor để xử lý chung các mã lỗi toàn cục (Ví dụ: tự động báo Toast Error khi API trả về lỗi 500, hay redirect về Login nếu lỗi 401).
*   **Debounce/Throttle:** Với các thao tác liên tục (như Search box lọc Test Case), bắt buộc phải dùng `useDebounce` để tránh việc call API liên tiếp quá nhiều lần, làm treo Frontend và quá tải Backend.

## 5. Xử Lý Lỗi Frontend (Error Handling & Fallbacks)
*   **Error Boundaries:** Các khu vực lớn trên layout (Dashboard, Test Runner view, Report view) phải được bao bọc bởi `ErrorBoundary` để nếu một component con bị lỗi (crash), giao diện chỉ sập phần đó và hiển thị "Something went wrong" chứ không làm trắng toàn bộ trang web.
*   **Safe Optional Chaining:** Luôn dùng `?.` và `??` khi truy xuất dữ liệu từ API do cấu trúc JSON có thể thay đổi (ví dụ: `testRun.result?.errorMsg ?? 'Không có lỗi'`).

## 6. Hiệu Năng & Tối Ưu
*   **React Strict Mode:** Luôn bật React Strict Mode trong môi trường Dev để phát hiện sớm các bugs liên quan đến lifecycle hoặc side-effects (như gọi `useEffect` 2 lần).
*   **Memoization:** Với các bảng dữ liệu báo cáo rất dài hoặc biểu đồ phức tạp, cần sử dụng `useMemo` và `React.memo` hợp lý để tránh re-render không cần thiết mỗi khi gõ phím.
*   **Quản lý bộ nhớ:** Khi Component unmount, bắt buộc dọn dẹp (cleanup) các event listener, interval, hoặc Websocket listener trong `useEffect` để ngăn memory leaks.
