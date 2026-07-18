# 12A1 — Chúng ta của năm ấy

Một website kỷ niệm tĩnh dành cho tập thể 12A1. Phiên bản hiện tại dùng HTML, CSS và JavaScript thuần, không cần build hay backend.

## Các trang

- `index.html` — landing page cinematic, lời nhắn, bộ đếm thời gian và trình phát nhạc.
- `timeline.html` — cây ký ức canvas, timeline kể chuyện và bức thư gửi tuổi mười tám.
- `gallery.html` — album 199 ảnh, tải theo từng lô, masonry responsive và lightbox hỗ trợ bàn phím.

## Chỉnh sửa nhanh

- Đổi nhạc trong thẻ `<audio>` của từng trang.
- Đổi ngày bộ đếm ở thuộc tính `data-since`.
- Đổi nội dung câu chuyện trực tiếp trong HTML.
- Thay ảnh `p1.jpg` đến `p199.jpg` trong thư mục `img/` để cập nhật album.
- Màu sắc, typography và breakpoint nằm trong `css/style.css`, phần timeline ở `css/default.css`, phần gallery ở `css/gallery.css`.

## Chạy thử

Mở `index.html` trực tiếp trong trình duyệt hoặc phục vụ thư mục này bằng một static server. Trình duyệt có thể chặn autoplay; hãy bấm nút bắt đầu hoặc biểu tượng đĩa nhạc để phát.

Các file Jscex/jQuery cũ vẫn được giữ trong repository để bảo toàn lịch sử source, nhưng không còn được tải bởi ba trang sau khi nâng cấp.
