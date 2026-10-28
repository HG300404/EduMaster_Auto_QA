import math
from PIL import Image, ImageDraw, ImageFont

# Canvas configuration
W, H = 1000, 780
img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)

# Font loading
try:
    font_normal = ImageFont.truetype("arial.ttf", 13)
    font_bold = ImageFont.truetype("arialbd.ttf", 13)
    font_header = ImageFont.truetype("arialbd.ttf", 18)
    font_small = ImageFont.truetype("arial.ttf", 10)
except IOError:
    font_normal = font_bold = font_header = font_small = ImageFont.load_default()

# ----------------- HELPERS -----------------

def get_ellipse_intersection(cx1, cy1, cx2, cy2, a, b):
    """
    Finds the intersection point of a line segment from (cx1, cy1) to (cx2, cy2)
    with the ellipse centered at (cx2, cy2) with semi-axes a (horizontal) and b (vertical).
    """
    dx = cx1 - cx2
    dy = cy1 - cy2
    if dx == 0 and dy == 0:
        return cx2, cy2
    t = 1.0 / math.sqrt((dx / a)**2 + (dy / b)**2)
    xi = cx2 + t * dx
    yi = cy2 + t * dy
    return xi, yi

def draw_actor(x, cy, label):
    # Head
    d.ellipse([(x - 10, cy - 25), (x + 10, cy - 5)], fill="white", outline="black", width=2)
    # Spine
    d.line([(x, cy - 5), (x, cy + 25)], fill="black", width=2)
    # Arms
    d.line([(x - 20, cy + 5), (x + 20, cy + 5)], fill="black", width=2)
    # Legs
    d.line([(x, cy + 25), (x - 12, cy + 50)], fill="black", width=2)
    d.line([(x, cy + 25), (x + 12, cy + 50)], fill="black", width=2)
    # Label below legs
    d.text((x, cy + 68), label, fill="black", font=font_bold, anchor="mm")

def draw_association(x_actor, y_actor, cx_oval, cy_oval, a, b):
    # Get intersection on target oval boundary
    xt, yt = get_ellipse_intersection(x_actor, y_actor, cx_oval, cy_oval, a, b)
    d.line([(x_actor, y_actor), (xt, yt)], fill="black", width=2)

def draw_dashed_line(x1, y1, x2, y2, fill="black", width=2, dash_length=6, gap_length=4):
    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)
    if dist == 0:
        return
    ux = dx / dist
    uy = dy / dist
    
    curr_dist = 0
    draw_state = True
    while curr_dist < dist:
        step = dash_length if draw_state else gap_length
        next_dist = min(curr_dist + step, dist)
        if draw_state:
            d.line([(x1 + ux * curr_dist, y1 + uy * curr_dist),
                    (x1 + ux * next_dist, y1 + uy * next_dist)],
                   fill=fill, width=width)
        curr_dist = next_dist
        draw_state = not draw_state

def draw_open_arrowhead(x1, y1, x2, y2, fill="black", width=2):
    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)
    if dist == 0:
        return
    ux = dx / dist
    uy = dy / dist
    
    # Backwards and perpendicular vectors
    bx, by = -ux, -uy
    px, py = -uy, ux
    
    # Arrow size
    L = 10
    W = 6
    
    x_side1 = x2 + L * bx + W * px
    y_side1 = y2 + L * by + W * py
    x_side2 = x2 + L * bx - W * px
    y_side2 = y2 + L * by - W * py
    
    d.line([(x_side1, y_side1), (x2, y2)], fill=fill, width=width)
    d.line([(x_side2, y_side2), (x2, y2)], fill=fill, width=width)

def draw_include(cx1, cy1, cx2, cy2, a1, b1, a2, b2):
    # Intersection points on ellipse boundaries
    xs, ys = get_ellipse_intersection(cx2, cy2, cx1, cy1, a1, b1)
    xt, yt = get_ellipse_intersection(cx1, cy1, cx2, cy2, a2, b2)
    
    # Draw dashed include line
    draw_dashed_line(xs, ys, xt, yt, fill="black", width=2, dash_length=6, gap_length=4)
    # Draw arrowhead pointing to target
    draw_open_arrowhead(xs, ys, xt, yt, fill="black", width=2)
    
    # Midpoint and label placement
    mx = (xs + xt) / 2
    my = (ys + yt) / 2
    dx = xt - xs
    dy = yt - ys
    dist = math.hypot(dx, dy)
    if dist > 0:
        ux, uy = dx / dist, dy / dist
        px, py = -uy, ux
        offset = 12
        d.text((mx + px * offset, my + py * offset), "<<include>>", fill="black", font=font_small, anchor="mm")

def draw_usecase(cx, cy, label, w=280, h=56):
    x1, y1 = cx - w//2, cy - h//2
    x2, y2 = cx + w//2, cy + h//2
    d.ellipse([x1, y1, x2, y2], fill="white", outline="black", width=2)
    lines = label.split('\n')
    lh = 16
    start_y = cy - (len(lines) * lh) // 2 + 8
    for i, line in enumerate(lines):
        d.text((cx, start_y + i * lh), line, fill="black", font=font_bold, anchor="mm")

# ----------------- DRAWING EXECUTION -----------------

# 1. System Boundary Box
d.rectangle([280, 50, 960, 740], outline="black", width=2)
d.text((620, 80), "Hệ thống EduMaster Auto QA", fill="black", font=font_header, anchor="mm")

# 2. Generalization Line (Admin inherits from User)
# Admin at cy=190, User at cy=505.
# Line goes from (100, 258) to (100, 463)
d.line([(100, 258), (100, 463)], fill="black", width=2)
d.polygon([(100, 475), (94, 463), (106, 463)], fill="white", outline="black", width=2)

# Coordinates for Usecases
left_usecases = [
    {"label": "Quản lý người dùng", "cy": 140, "actor": "admin"},
    {"label": "Xem lịch sử hệ thống", "cy": 240, "actor": "admin"},
    {"label": "Xem danh sách bộ test", "cy": 340, "actor": "user"},
    {"label": "Kích hoạt test thủ công", "cy": 440, "actor": "user"},
    {"label": "Theo dõi Log real-time", "cy": 540, "actor": "user"},
    {"label": "Xem kết quả & Thống kê", "cy": 640, "actor": "user"}
]
cx_left = 460
w_left, h_left = 280, 56

cx_right = 800
cy_right = 395
label_right = "Xác thực người dùng\n(Đăng nhập)"
w_right, h_right = 260, 56

# 3. Association Lines from Actors to Use Cases
# Admin connects to cy=140, 240
# User connects to cy=340, 440, 540, 640
for uc in left_usecases:
    if uc["actor"] == "admin":
        draw_association(120, 195, cx_left, uc["cy"], w_left/2, h_left/2)
    else:
        draw_association(120, 505, cx_left, uc["cy"], w_left/2, h_left/2)

# 4. Include relationships pointing from left ovals to the right authentication oval
for uc in left_usecases:
    draw_include(cx_left, uc["cy"], cx_right, cy_right, w_left/2, h_left/2, w_right/2, h_right/2)

# 5. Actors (Stick Figures)
draw_actor(100, 190, "Quản trị viên")
draw_actor(100, 505, "Người dùng")

# 6. Draw Usecase Ovals on top (so line endpoints are neatly hidden inside)
for uc in left_usecases:
    draw_usecase(cx_left, uc["cy"], uc["label"], w_left, h_left)

draw_usecase(cx_right, cy_right, label_right, w_right, h_right)

# 7. Save Image
out_path = r"C:\Users\MaiHuong\.gemini\antigravity-ide\brain\d240788d-00e8-4968-ae67-21d72464e456\usecase_diagram.png"
img.save(out_path)
print("Successfully generated usecase_diagram.png at:", out_path)
