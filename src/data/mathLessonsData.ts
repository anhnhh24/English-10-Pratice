import { Lesson } from '../types';

export const MATH_LESSONS_DATA: Lesson[] = [
  // ─── 1. CĂN THỨC BẬC HAI & RÚT GỌN ───
  {
    id: 'math_lesson_01',
    subject: 'math',
    topicId: 'math_can_thuc',
    subTopicId: 'can_thuc_rut_gon',
    title: '1. Biến Đổi Căn Thức Bậc Hai & Rút Gọn Biểu Thức Chứa Căn',
    subTitle: 'Quy tắc tìm ĐKXĐ, phân tích mẫu thành nhân tử và phương pháp giải 4 dạng câu hỏi phụ',
    summary: 'Bài 1 trong cấu trúc đề thi tuyển sinh vào 10 (chiếm 2.0 điểm). Làm cẩn thận từng bước để đạt trọn vẹn 2 điểm mở màn, tạo tâm lý tự tin cho cả bài thi.',
    formulas: [
      {
        name: 'Điều kiện xác định (ĐKXĐ) của căn thức và phân thức',
        formula: '1) √A có nghĩa ⇔ A ≥ 0\n2) 1 / A có nghĩa ⇔ A ≠ 0\n3) 1 / √A có nghĩa ⇔ A > 0\n4) B / (√A - c) có nghĩa ⇔ A ≥ 0 và A ≠ c²',
        example: 'Tìm ĐKXĐ của P = (√x + 1)/(√x - 3) + 2/(x - 9): { x ≥ 0, √x - 3 ≠ 0, x - 9 ≠ 0 } ⇔ { x ≥ 0, x ≠ 9 }.',
        note: 'Bắt buộc phải tìm ĐKXĐ trước khi rút gọn và luôn kết hợp tất cả các mẫu thức thành phần!',
      },
      {
        name: 'Các hằng đẳng thức căn thức cốt lõi',
        formula: '• √(A²) = |A| = A (nếu A ≥ 0) hoặc -A (nếu A < 0)\n• x - a = (√x - √a)(√x + √a)  (với x ≥ 0, a ≥ 0)\n• x√x + a√a = (√x + √a)(x - √ax + a)\n• x√x - a√a = (√x - √a)(x + √ax + a)\n• Trục căn thức ở mẫu: 1 / (√a ± √b) = (√a ∓ √b) / (a - b)',
        example: '√(4 - 2√3) = √((√3 - 1)²) = |√3 - 1| = √3 - 1 (vì √3 > 1).\n(x - 4) / (√x - 2) = (√x - 2)(√x + 2) / (√x - 2) = √x + 2.',
      },
    ],
    rules: [
      {
        title: 'Phương pháp giải 4 dạng câu hỏi phụ rút gọn hay thi nhất',
        detail:
          '• Dạng 1: Tính giá trị của biểu thức khi x = x₀ (Nhớ kiểm tra x₀ có thỏa mãn ĐKXĐ không trước khi thay!).\n• Dạng 2: Tìm x để P = k (hoặc P > k, P < k) ⇒ Giải PT/BPT chứa căn. Lưu ý: Khi giải P > 0, KHÔNG ĐƯỢC nhân chéo bỏ mẫu nếu mẫu chưa chắc chắn dương.\n• Dạng 3: Tìm x nguyên để P nhận giá trị nguyên ⇒ Tách P = (phần nguyên) + (hằng số / mẫu), cho mẫu ∈ Ước của hằng số.\n• Dạng 4: Tìm Max/Min của P ⇒ Dùng bất đẳng thức Cauchy hoặc biến đổi thành dạng bình phương cộng hằng số.',
        examples: [
          'Dạng tìm x nguyên: P = (√x + 5)/(√x + 2) = 1 + 3/(√x + 2). Để P nguyên thì (√x + 2) ∈ Ư(3) = {1, 3, -1, -3}. Vì √x + 2 ≥ 2 nên √x + 2 = 3 ⇒ √x = 1 ⇒ x = 1 (thỏa mãn).',
        ],
      },
    ],
    examTips: [
      '⚡ Mẹo Casio kiểm tra rút gọn: Nhập (Biểu thức ban đầu) - (Biểu thức sau rút gọn), bấm CALC x = 25 (hoặc giá trị thỏa ĐKXĐ). Kết quả ra đúng 0 nghĩa là rút gọn chính xác 100%!',
      '⚠️ Cảnh báo bẫy: Tuyệt đối không quên đối chiếu ĐKXĐ khi giải ra x ở các câu hỏi phụ.',
    ],
    keySignals: ['rút gọn biểu thức', 'tìm x để P', 'tìm x nguyên', 'điều kiện xác định', '√(A²) = |A|'],
  },

  // ─── 2. PHƯƠNG TRÌNH BẬC HAI & HỆ THỨC VI-ÉT ───
  {
    id: 'math_lesson_02',
    subject: 'math',
    topicId: 'math_pt_bac_hai_viet',
    subTopicId: 'viet_tong_tich',
    title: '2. Phương Trình Bậc Hai, Định Lý Vi-ét & Các Dạng Biểu Thức Đối Xứng',
    subTitle: 'Hệ thức Vi-ét thuận, đảo, biểu thức đối xứng/bất đối xứng và bài toán tìm tham số m',
    summary: 'Chuyên đề chiếm trọn 1.5 - 2.0 điểm trong đề thi vào 10 toàn quốc. Nắm vững quy trình 4 bước giải bài toán Vi-ét.',
    formulas: [
      {
        name: 'Hệ thức Vi-ét cho phương trình ax² + bx + c = 0 (a ≠ 0)',
        formula: 'Tổng 2 nghiệm: S = x₁ + x₂ = -b / a\nTích 2 nghiệm: P = x₁ · x₂ = c / a',
        example: 'Phương trình x² - 5x + 6 = 0 có a=1, b=-5, c=6 ⇒ S = 5, P = 6 ⇒ x₁=2, x₂=3.',
        note: 'Bắt buộc phải xét điều kiện a ≠ 0 và Δ ≥ 0 (hoặc Δ\' ≥ 0) để phương trình có 2 nghiệm trước khi dùng Vi-ét!',
      },
      {
        name: '5 Biểu thức đối xứng kinh điển thường gặp trong đề thi',
        formula: '1) x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = S² - 2P\n2) (x₁ - x₂)² = (x₁ + x₂)² - 4x₁x₂ = S² - 4P ⇒ |x₁ - x₂| = √(S² - 4P)\n3) x₁³ + x₂³ = (x₁ + x₂)(x₁² - x₁x₂ + x₂²) = S(S² - 3P)\n4) 1/x₁ + 1/x₂ = (x₁ + x₂) / (x₁x₂) = S / P\n5) x₁/x₂ + x₂/x₁ = (x₁² + x₂²) / (x₁x₂) = (S² - 2P) / P',
        example: 'Cho pt x² - 4x + 1 = 0. Tính A = x₁² + x₂² ⇒ S = 4, P = 1 ⇒ A = 4² - 2(1) = 14.',
      },
      {
        name: 'Dấu của hai nghiệm phương trình bậc hai',
        formula: '• 2 nghiệm trái dấu: a·c < 0 (không cần xét Δ)\n• 2 nghiệm cùng dấu: Δ ≥ 0 và P > 0\n• 2 nghiệm cùng dương: Δ ≥ 0, P > 0 và S > 0\n• 2 nghiệm cùng âm: Δ ≥ 0, P > 0 và S < 0',
        example: 'Tìm m để pt x² - 2x + m - 1 = 0 có 2 nghiệm dương: { Δ\' = 1 - (m-1) ≥ 0, P = m-1 > 0, S = 2 > 0 } ⇒ 1 < m ≤ 2.',
      },
    ],
    rules: [
      {
        title: 'Quy trình 4 bước chuẩn giải bài toán tham số Vi-ét',
        detail:
          'Bước 1: Tìm điều kiện để pt có 2 nghiệm (a ≠ 0 và Δ ≥ 0 hoặc Δ > 0 khi đề yêu cầu 2 nghiệm phân biệt).\nBước 2: Viết hệ thức Vi-ét theo tham số m: S = x₁ + x₂, P = x₁·x₂.\nBước 3: Biến đổi hệ thức bài toán về dạng chứa S và P, thay m vào và giải phương trình tìm m.\nBước 4: Đối chiếu giá trị m vừa tìm được với điều kiện ở Bước 1 và kết luận.',
        examples: [
          'Cho x² - 2(m-1)x + m - 3 = 0. Tìm m để x₁² + x₂² = 10. B1: Δ\' = m² - 3m + 4 > 0 (luôn có 2 nghiệm). B2: S = 2m-2, P = m-3. B3: S² - 2P = (2m-2)² - 2(m-3) = 10 ⇒ 4m² - 10m = 0 ⇒ m = 0 hoặc m = 2.5. B4: Cả 2 giá trị đều thỏa mãn.',
        ],
      },
    ],
    examTips: [
      '⚠️ Bẫy số 1: Quên điều kiện a ≠ 0 khi hệ số a chứa m (ví dụ: (m-1)x² + ... = 0).',
      '⚠️ Bẫy số 2: Tìm ra m nhưng quên đối chiếu với điều kiện Δ ≥ 0, dẫn đến thừa nghiệm và bị trừ 0.5 điểm.',
      '⚡ Mẹo Casio: Bấm Menu 9 - 2 - 2 (trên 580VNX) gán m = 100 vào pt để kiểm tra tính đúng đắn của nghiệm!',
    ],
    keySignals: ['x1^2 + x2^2', 'x1 - x2', 'hai nghiệm phân biệt', 'hệ thức Vi-ét', 'tìm m để phương trình'],
  },

  // ─── 3. HỆ PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN ───
  {
    id: 'math_lesson_03',
    subject: 'math',
    topicId: 'math_he_phuong_trinh',
    subTopicId: 'he_pt_dat_an_phu',
    title: '3. Hệ Phương Trình Bậc Nhất Hai Ẩn & Phương Pháp Đặt Ẩn Phụ',
    subTitle: 'Phương pháp cộng đại số, phương pháp thế, hệ chứa phân thức/căn thức và tham số m',
    summary: 'Bài toán nằm ở phần đầu Bài 2 (1.0 điểm). Làm cẩn thận để đạt điểm tối đa một cách nhanh chóng.',
    formulas: [
      {
        name: 'Hệ phương trình bậc nhất hai ẩn tổng quát: { ax + by = c ; a\'x + b\'y = c\' }',
        formula: '• Có nghiệm duy nhất ⇔ a/a\' ≠ b/b\'\n• Vô nghiệm ⇔ a/a\' = b/b\' ≠ c/c\'\n• Vô số nghiệm ⇔ a/a\' = b/b\' = c/c\'',
        example: 'Giải hệ: { 2x + y = 5 ; x - 3y = -1 } ⇒ Nhân pt(2) với 2 rồi trừ vế với vế ⇒ 7y = 7 ⇒ y = 1, x = 2.',
      },
      {
        name: 'Phương pháp Đặt ẩn phụ cho hệ phương trình phức tạp (RẤT HAY THI)',
        formula: '• Hệ chứa phân thức: Đặt u = 1/(x - a), v = 1/(y - b) với ĐKXĐ x ≠ a, y ≠ b\n• Hệ chứa căn thức: Đặt u = √(x - a) (u ≥ 0), v = √(y - b) (v ≥ 0)\n• Hệ chứa giá trị tuyệt đối: Đặt u = |x - a|, v = |y - b|',
        example: 'Hệ { 2/(x-1) + 1/(y+2) = 4 ; 1/(x-1) - 3/(y+2) = -5 } ⇒ Đặt u = 1/(x-1), v = 1/(y+2) ⇒ { 2u + v = 4 ; u - 3v = -5 } ⇒ u = 1, v = 2 ⇒ x = 2, y = -1.5.',
        note: 'Bắt buộc phải đặt ĐIỀU KIỆN XÁC ĐỊNH của ẩn x, y và điều kiện của ẩn phụ (nếu có căn thức thì u, v ≥ 0).',
      },
    ],
    rules: [
      {
        title: 'Quy trình giải hệ phương trình bằng phương pháp đặt ẩn phụ',
        detail:
          'Bước 1: Tìm ĐKXĐ của hệ phương trình ban đầu.\nBước 2: Chọn biểu thức lặp lại để đặt ẩn phụ u, v (nêu rõ điều kiện của u, v).\nBước 3: Thay vào giải hệ phương trình bậc nhất cơ bản theo u, v.\nBước 4: Thay u, v ngược lại để tìm x, y, đối chiếu với ĐKXĐ và kết luận nghiệm (x; y).',
        examples: ['Luôn viết kết luận nghiệm dưới dạng cặp số (x; y).'],
      },
    ],
    examTips: [
      '⚡ Mẹo Casio: Bấm Menu 9 - 1 - 2 (trên 580VNX) để kiểm tra nghiệm (x; y) của hệ phương trình trong 5 giây!',
      '⚠️ Cảnh báo bẫy: Quên đối chiếu nghiệm (x; y) với ĐKXĐ ở bước cuối cùng.',
    ],
    keySignals: ['hệ phương trình', 'đặt ẩn phụ', '1/(x-1)', 'nghiệm duy nhất', 'tìm m để hệ có nghiệm'],
  },

  // ─── 4. HÀM SỐ & TƯƠNG GIAO PARABOL ───
  {
    id: 'math_lesson_04',
    subject: 'math',
    topicId: 'math_ham_so_do_thi',
    subTopicId: 'tuong_giao_parabol_duong_thang',
    title: '4. Hàm Số Bậc Nhất & Tương Giao Parabol (P) Với Đường Thẳng (d)',
    subTitle: 'Phương trình hoành độ giao điểm, tiếp xúc, cắt nhau tại 2 điểm và kết hợp định lý Vi-ét',
    summary: 'Chuyên đề kinh điển trong đề thi vào 10 (chiếm 1.0 - 1.5 điểm). Liên kết chặt chẽ giữa đồ thị hình học và đại số phương trình bậc hai.',
    formulas: [
      {
        name: 'Vị trí tương đối của Parabol (P): y = ax² (a ≠ 0) và Đường thẳng (d): y = mx + n',
        formula: 'Xét phương trình hoành độ giao điểm: ax² = mx + n  ⇔  ax² - mx - n = 0 (*)\n• (d) cắt (P) tại 2 điểm phân biệt ⇔ Phương trình (*) có Δ > 0\n• (d) tiếp xúc với (P) ⇔ Phương trình (*) có Δ = 0 (khi đó x = -b/2a là hoành độ tiếp điểm)\n• (d) không cắt (P) ⇔ Phương trình (*) có Δ < 0',
        example: 'Cho (P): y = x² và (d): y = 2x + 3. Phương trình hoành độ giao điểm: x² - 2x - 3 = 0 có a - b + c = 0 ⇒ x₁ = -1, x₂ = 3 ⇒ Giao điểm A(-1; 1) và B(3; 9).',
      },
      {
        name: 'Tìm tọa độ giao điểm và tính khoảng cách, diện tích tam giác',
        formula: '• Tọa độ điểm A(x₁; y₁) với y₁ = ax₁² (hoặc y₁ = mx₁ + n)\n• Độ dài đoạn thẳng AB: AB = √((x₂ - x₁)² + (y₂ - y₁)²)\n• Diện tích tam giác OAB (với O là gốc tọa độ): S_OAB = 1/2 · |x₁y₂ - x₂y₁|',
        example: 'A(-1; 1) và B(3; 9) ⇒ S_OAB = 1/2 · |(-1)(9) - (3)(1)| = 1/2 · |-12| = 6 (đvdt).',
      },
    ],
    rules: [
      {
        title: 'Quy trình giải bài toán tương giao chứa tham số m',
        detail:
          'Bước 1: Lập phương trình hoành độ giao điểm của (P) và (d).\nBước 2: Tính Δ và tìm điều kiện để (d) cắt (P) tại 2 điểm phân biệt (Δ > 0).\nBước 3: Viết hệ thức Vi-ét cho 2 hoành độ x₁, x₂ theo tham số m.\nBước 4: Biến đổi hệ thức đề bài (chứa x₁, x₂ hoặc y₁, y₂ - nhớ thay y = ax² hoặc y = mx+n) về dạng S, P để giải tìm m.',
        examples: ['Cho (P): y = x² và (d): y = mx + 2. Tìm m để (d) cắt (P) tại 2 điểm thỏa mãn x₁² + x₂² = 5.'],
      },
    ],
    examTips: [
      '⚡ Mẹo: Nếu đề cho hệ thức chứa y₁ và y₂ (ví dụ y₁ + y₂ = 10), hãy thay y₁ = mx₁ + n và y₂ = mx₂ + n để đưa về biểu thức bậc nhất theo x₁, x₂ rồi áp dụng Vi-ét cực nhanh!',
    ],
    keySignals: ['parabol', 'phương trình hoành độ giao điểm', 'tiếp xúc', 'cắt nhau tại 2 điểm phân biệt', 'tọa độ giao điểm'],
  },

  // ─── 5. GIẢI BÀI TOÁN BẰNG CÁCH LẬP PT / HỆ PT ───
  {
    id: 'math_lesson_05',
    subject: 'math',
    topicId: 'math_giai_toan_lap_pt',
    subTopicId: 'toan_chuyen_dong',
    title: '5. Giải Bài Toán Bằng Cách Lập Phương Trình / Hệ Phương Trình',
    subTitle: 'Phương pháp lập bảng phân tích dữ liệu: Toán chuyển động, năng suất, làm chung làm riêng và tài chính',
    summary: 'Dạng bài chiếm 1.5 - 2.0 điểm kiểm tra kỹ năng đọc hiểu và tư duy thực tế. Bí quyết đạt trọn điểm là lập bảng 3 cột phân tích trước khi viết lời giải.',
    formulas: [
      {
        name: 'Dạng 1: Toán chuyển động (Đại lượng: Quãng đường S, Vận tốc v, Thời gian t)',
        formula: '• S = v · t  ⇔  v = S / t  ⇔  t = S / v\n• Chuyển động đường thủy (dòng nước):\n   v_xuôi = v_thực + v_nước\n   v_ngược = v_thực - v_nước\n• Đổi đơn vị thời gian: 15 phút = 1/4 h; 20 phút = 1/3 h; 30 phút = 1/2 h; 45 phút = 3/4 h; 1h15p = 5/4 h',
        example: 'Quãng đường 120km, xe đi vận tốc v thì t = 120/v. Nếu tăng vận tốc 10km/h thì t\' = 120/(v+10). Phương trình: 120/v - 120/(v+10) = 1/2 (nếu đến sớm 30 phút).',
      },
      {
        name: 'Dạng 2: Toán năng suất - Làm chung làm riêng (Quy ước toàn bộ công việc là 1)',
        formula: '• Khối lượng công việc = Năng suất 1 ngày/giờ · Thời gian hoàn thành\n• Đội 1 làm 1 mình xong trong x ngày ⇒ 1 ngày làm được 1/x (công việc)\n• Đội 2 làm 1 mình xong trong y ngày ⇒ 1 ngày làm được 1/y (công việc)\n• 2 đội cùng làm: Trong 1 ngày làm được (1/x + 1/y) công việc',
        example: 'Hai vòi nước cùng chảy trong 4 giờ đầy bể ⇒ 1/x + 1/y = 1/4.',
        note: 'Điều kiện ẩn: x > thời gian làm chung, y > thời gian làm chung.',
      },
      {
        name: 'Dạng 3: Toán hình học & Phần trăm tài chính',
        formula: '• Hình chữ nhật: Chu vi P = 2(dài + rộng), Diện tích S = dài · rộng\n• Giá sau giảm k%: Giá mới = Giá gốc · (1 - k/100)\n• Giá sau tăng k%: Giá mới = Giá gốc · (1 + k/100)',
        example: 'Món hàng 500.000đ giảm 20% ⇒ Giá bán = 500.000 · (1 - 0.2) = 400.000đ.',
      },
    ],
    rules: [
      {
        title: 'Quy trình 3 bước chuẩn trình bày bài toán lập PT / Hệ PT',
        detail:
          'Bước 1: Chọn ẩn số, ghi rõ ĐƠN VỊ và ĐIỀU KIỆN thích hợp cho ẩn (ví dụ: x > 0, x ∈ N*).\nBước 2: Biểu diễn các đại lượng chưa biết theo ẩn và các đại lượng đã biết, lập phương trình hoặc hệ phương trình.\nBước 3: Giải PT / Hệ PT, đối chiếu nghiệm với điều kiện ở Bước 1 và viết câu KẾT LUẬN trả lời bài toán.',
        examples: ['Gọi vận tốc của xe máy là x (km/h, x > 0)...'],
      },
    ],
    examTips: [
      '⚡ Luôn vẽ bảng phân tích 3 đại lượng ra nháp trước khi viết bài.',
      '⚠️ Cảnh báo bẫy: Quên đổi đơn vị thời gian từ phút sang giờ hoặc quên ghi đơn vị và câu kết luận.',
    ],
    keySignals: ['quãng đường', 'vận tốc', 'năng suất', 'hai vòi nước', 'hai đội công nhân', 'chuyển động xuôi dòng'],
  },

  // ─── 6. HỆ THỨC LƯỢNG TRONG TAM GIÁC VUÔNG ───
  {
    id: 'math_lesson_06',
    subject: 'math',
    topicId: 'math_he_thuc_luong',
    subTopicId: 'he_thuc_luong_tam_giac_vuong',
    title: '6. Hệ Thức Lượng Trong Tam Giác Vuông & Tỉ Số Lượng Giác',
    subTitle: '5 hệ thức lượng vàng, công thức sin, cos, tan, cot và các bài toán thực tế đo bóng cây/cột cờ',
    summary: 'Chuyên đề hình học mở đầu chiếm 1.0 - 1.5 điểm, là nền tảng giải quyết các bài toán đo đạc thực tế trong đề tuyển sinh.',
    formulas: [
      {
        name: '5 Hệ thức lượng trong tam giác ABC vuông tại A, đường cao AH',
        formula: 'Đặt BC = a (cạnh huyền), AB = c, AC = b (cạnh góc vuông), AH = h, BH = c\', CH = b\'\n1) Định lý Pytago: a² = b² + c²\n2) b² = a · b\'  và  c² = a · c\' (Bình phương cạnh góc vuông = cạnh huyền · hình chiếu)\n3) h² = b\' · c\' (Bình phương đường cao = tích 2 hình chiếu)\n4) a · h = b · c (Cạnh huyền · đường cao = tích 2 cạnh góc vuông)\n5) 1/h² = 1/b² + 1/c²',
        example: 'Tam giác ABC vuông tại A có AB=6, AC=8 ⇒ BC = √(6²+8²) = 10 ⇒ AH = (6·8)/10 = 4.8cm; BH = 6²/10 = 3.6cm.',
      },
      {
        name: 'Tỉ số lượng giác của góc nhọn (Sin, Cos, Tan, Cot)',
        formula: '👉 Câu thần chú ghi nhớ: "Sin Đi Học - Cứ Khóc Hoài - Thôi Đừng Khóc - Có Kẹo Đây"\n• Sin α = Đối / Huyền\n• Cos α = Kề / Huyền\n• Tan α = Đối / Kề\n• Cot α = Kề / Đối\n• Công thức lượng giác phụ nhau: sin(90° - α) = cos α; tan(90° - α) = cot α\n• Công thức cơ bản: sin²α + cos²α = 1; tan α · cot α = 1; 1 + tan²α = 1/cos²α',
        example: 'Tam giác vuông có góc α = 30° ⇒ sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3.',
      },
    ],
    rules: [
      {
        title: 'Ứng dụng giải bài toán thực tế (Đo chiều cao, khoảng cách)',
        detail:
          '• Chiều cao vật thể (cột cờ, tòa nhà, ngọn hải đăng): h = bóng dài · tan(góc nâng Mặt Trời)\n• Góc nâng (góc trông lên): tan α = h / d',
        examples: ['Một cây có bóng trên mặt đất dài 8m, góc tia nắng Mặt Trời với mặt đất là 40° ⇒ Chiều cao cây: h = 8 · tan 40° ≈ 6.71m.'],
      },
    ],
    examTips: [
      '⚡ Mẹo Casio: Chuyển máy tính về chế độ độ (Shift Menu 2 - 1 trên 580VNX) trước khi bấm sin, cos, tan để tránh sai kết quả do đang ở chế độ Radian!',
    ],
    keySignals: ['tam giác vuông', 'đường cao AH', 'sin', 'cos', 'tan', 'bóng cây', 'góc nâng', 'hệ thức lượng'],
  },

  // ─── 7. ĐƯỜNG TRÒN & TỨ GIÁC NỘI TIẾP ───
  {
    id: 'math_lesson_07',
    subject: 'math',
    topicId: 'math_duong_tron_tu_giac',
    subTopicId: 'tu_giac_noi_tiep_4_dau_hieu',
    title: '7. Đường Tròn, Tiếp Tuyến & 4 Dấu Hiệu Vàng Tứ Giác Nội Tiếp',
    subTitle: 'Phương pháp nhận diện nhanh và cách trình bày chuẩn đạt trọn vẹn điểm câu Hình học',
    summary: 'Bài hình học chiếm 3.0 - 3.5 điểm trong đề thi vào 10. Ý đầu tiên luôn là chứng minh tứ giác nội tiếp (1.0 điểm) - chiếc chìa khóa để giải quyết toàn bộ các câu sau.',
    formulas: [
      {
        name: 'Dấu hiệu 1: Tổng hai góc đối nhau bằng 180° (Hay gặp nhất - 60% đề thi)',
        formula: 'Tứ giác ABCD có: ∠A + ∠C = 180° (hoặc ∠B + ∠D = 180°)\n⇒ Tứ giác ABCD nội tiếp đường tròn.',
        example: 'Hai tiếp tuyến AB, AC với đường tròn (O) ⇒ ∠ABO = 90°, ∠ACO = 90° ⇒ ∠ABO + ∠ACO = 180° ⇒ ABOC nội tiếp đường tròn đường kính AO.',
      },
      {
        name: 'Dấu hiệu 2: Hai đỉnh kề cùng nhìn cạnh đối diện dưới 2 góc bằng nhau',
        formula: 'Tứ giác ABCD có 2 đỉnh kề A và B cùng nhìn đoạn CD dưới góc bằng nhau: ∠DAC = ∠DBC\n⇒ Tứ giác ABCD nội tiếp đường tròn.',
        example: 'Trong tam giác ABC có 2 đường cao BD và CE cắt nhau tại H ⇒ Tứ giác BCDE có ∠BEC = ∠BDC = 90° (cùng nhìn BC) ⇒ BCDE nội tiếp.',
      },
      {
        name: 'Dấu hiệu 3: Góc ngoài tại một đỉnh bằng góc trong tại đỉnh đối diện',
        formula: 'Tứ giác ABCD có góc ngoài tại đỉnh D bằng góc trong tại đỉnh B: ∠ADx = ∠ABC\n⇒ Tứ giác ABCD nội tiếp đường tròn.',
        example: 'Rất hữu ích khi chứng minh các điểm thẳng hàng hoặc hai đường thẳng song song ở câu c, d.',
      },
      {
        name: 'Dấu hiệu 4: Bốn đỉnh cùng cách đều một điểm',
        formula: 'Nếu OA = OB = OC = OD = R ⇒ Tứ giác ABCD nội tiếp đường tròn (O; R).',
        example: 'Tứ giác có 2 góc vuông cùng nhìn một cạnh: ∠BAC = ∠BDC = 90° ⇒ 4 điểm A, B, C, D cùng thuộc đường tròn đường kính BC.',
      },
    ],
    rules: [
      {
        title: 'Các hệ thức góc quan trọng trong đường tròn',
        detail:
          '1. Góc nội tiếp và góc tạo bởi tia tiếp tuyến và dây cung cùng chắn một cung thì BẰNG NHAU: ∠ACB = ∠BAx = 1/2 sđ cung AB.\n2. Góc nội tiếp chắn nửa đường tròn luôn BẰNG 90° (Điểm C thuộc đường tròn đường kính AB ⇒ ∠ACB = 90°).\n3. Góc ở tâm gấp đôi góc nội tiếp cùng chắn một cung: ∠AOB = 2 · ∠ACB.',
        examples: ['Góc tạo bởi tiếp tuyến xy tại A và dây AB bằng góc nội tiếp ∠ACB cùng chắn cung AB.'],
      },
    ],
    examTips: [
      '⚡ Bí kíp vẽ hình: Luôn vẽ đường tròn trước rồi mới vẽ tam giác nội tiếp/ngoại tiếp để hình vẽ chuẩn xác, không bị lệch giao điểm.',
      '⚡ Khi làm câu b và c của bài hình, luôn tận dụng kết quả tứ giác nội tiếp ở câu a để suy ra các cặp góc bằng nhau.',
    ],
    keySignals: ['tứ giác nội tiếp', 'chứng minh 4 điểm cùng thuộc đường tròn', 'tiếp tuyến', 'đường kính', 'góc nội tiếp'],
  },

  // ─── 8. HÌNH HỌC KHÔNG GIAN & BÀI TOÁN THỰC TẾ ───
  {
    id: 'math_lesson_08',
    subject: 'math',
    topicId: 'math_hinh_khong_gian_thuc_te',
    subTopicId: 'hinh_tru_non_cau',
    title: '8. Hình Học Không Gian (Trụ - Nón - Cầu) & Các Bài Toán Thực Tế',
    subTitle: 'Công thức diện tích xung quanh, diện tích toàn phần, thể tích và bài toán ứng dụng',
    summary: 'Chuyên đề chiếm 1.0 - 1.5 điểm trong đề thi vào 10 toàn quốc.',
    formulas: [
      {
        name: 'Hình Trụ (Bán kính đáy r, Chiều cao h)',
        formula: '• Diện tích xung quanh: S_xq = 2π·r·h\n• Diện tích toàn phần: S_tp = 2π·r·h + 2π·r²\n• Thể tích: V = π·r²·h',
        example: 'Một lon sữa hình trụ có r = 4cm, h = 10cm ⇒ V = π · 4² · 10 = 160π ≈ 502.65 cm³.',
        note: 'Đổi đơn vị thể tích: 1 lít = 1 dm³ = 1000 cm³ = 1000 ml; 1 m³ = 1000 lít.',
      },
      {
        name: 'Hình Nón (Bán kính đáy r, Chiều cao h, Đường sinh l = √(r² + h²))',
        formula: '• Diện tích xung quanh: S_xq = π·r·l\n• Diện tích toàn phần: S_tp = π·r·l + π·r²\n• Thể tích: V = 1/3 · π·r²·h',
        example: 'Chiếc nón lá có r = 20cm, h = 15cm ⇒ Đường sinh l = √(20² + 15²) = 25cm ⇒ S_xq = π · 20 · 25 = 500π cm².',
        note: 'Mối liên hệ Pytago giữa đường sinh, chiều cao và bán kính: l² = h² + r².',
      },
      {
        name: 'Hình Cầu (Bán kính R, Đường kính d = 2R)',
        formula: '• Diện tích mặt cầu: S = 4π·R² = π·d²\n• Thể tích hình cầu: V = 4/3 · π·R³',
        example: 'Quả bóng đá có bán kính R = 11cm ⇒ V = 4/3 · π · 11³ ≈ 5575.28 cm³.',
      },
    ],
    rules: [
      {
        title: 'Quy tắc làm tròn chữ số thập phân trong bài toán thực tế',
        detail: 'Đọc kỹ yêu cầu đề bài: "Lấy π ≈ 3.14" hay "Làm tròn đến chữ số thập phân thứ nhất / thứ hai / làm tròn đến hàng đơn vị".',
        examples: ['Ví dụ: V = 502.6548... ⇒ Làm tròn đến chữ số thập phân thứ hai là 502.65.'],
      },
    ],
    examTips: [
      '⚠️ Cẩn thận bẫy đề bài cho ĐƯỜNG KÍNH d hay BÁN KÍNH r (bán kính r = d / 2).',
      '⚡ Thể tích phần chứa nước khi nước chỉ chiếm k% chiều cao: V_nước = k% · V_trụ.',
    ],
    keySignals: ['hình trụ', 'hình nón', 'hình cầu', 'thể tích', 'diện tích xung quanh', 'đường sinh', 'lon nước'],
  },

  // ─── 9. BẤT ĐẲNG THỨC CAUCHY & CỰC TRỊ (CÂU 10 ĐIỂM) ───
  {
    id: 'math_lesson_09',
    subject: 'math',
    topicId: 'math_bat_dang_thuc_cuc_tri',
    subTopicId: 'bdt_cauchy_am_gm',
    title: '9. Bất Đẳng Thức Cauchy & Kỹ Thuật Chọn Điểm Rơi (Câu Phân Loại Điểm 10)',
    subTitle: 'Bí kíp chinh phục câu cuối phân loại điểm 9.5 - 10 trong đề tuyển sinh THPT Chuyên & Top 1',
    summary: 'Sử dụng nhuần nhuyễn BĐT Cauchy (AM-GM), Bunhiacopxki và Cauchy-Schwarz dạng phân thức (BĐT Schwarz).',
    formulas: [
      {
        name: 'Bất đẳng thức Cauchy (AM-GM) cho 2 và 3 số không âm',
        formula: '• Với a, b ≥ 0:  (a + b) / 2 ≥ √(ab)  ⇔  a + b ≥ 2√(ab)\n   Dấu "=" xảy ra ⇔ a = b\n• Với a, b, c ≥ 0:  (a + b + c) / 3 ≥ ³√(abc)  ⇔  a + b + c ≥ 3 ³√(abc)\n   Dấu "=" xảy ra ⇔ a = b = c',
        example: 'Cho x > 0. Tìm GTNN của P = x + 9/x. Áp dụng Cauchy cho 2 số dương: P = x + 9/x ≥ 2√(x · 9/x) = 6. Min P = 6 khi x = 9/x ⇔ x = 3.',
        note: 'Các hệ quả hay dùng: (a + b)² ≥ 4ab;  a² + b² ≥ 2ab;  a² + b² ≥ (a + b)² / 2;  ab ≤ (a + b)² / 4.',
      },
      {
        name: 'Bất đẳng thức Cauchy-Schwarz dạng phân thức (BĐT Schwarz / Engel)',
        formula: 'Với x, y > 0 và a, b bất kỳ:\na² / x + b² / y ≥ (a + b)² / (x + y)\nDấu "=" xảy ra ⇔ a / x = b / y\n\nMở rộng cho 3 phân thức:\na² / x + b² / y + c² / z ≥ (a + b + c)² / (x + y + z)',
        example: 'Với a, b > 0 thỏa mãn a + b = 1. Tìm GTNN của P = 1/a + 1/b. Áp dụng Schwarz: P = 1²/a + 1²/b ≥ (1 + 1)² / (a + b) = 4/1 = 4. Min P = 4 khi a = b = 1/2.',
      },
    ],
    rules: [
      {
        title: 'Kỹ thuật chọn điểm rơi và thêm bớt hạng tử',
        detail:
          'Nguyên tắc: Dự đoán điểm rơi (giá trị của biến khi biểu thức đạt Min/Max, thường là các biến bằng nhau do tính đối xứng), sau đó tách ghép các hạng tử sao cho tại điểm rơi đó, các đại lượng áp dụng Cauchy bằng nhau.',
        examples: [
          'Cho x ≥ 3. Tìm GTNN của P = x + 1/x. Điểm rơi tại x = 3 ⇒ 1/x = 1/3. Cần ghép 1/x với x/9 (vì khi x=3 thì x/9 = 1/3 = 1/x). Tách: P = (x/9 + 1/x) + 8x/9 ≥ 2√(x/9 · 1/x) + 8(3)/9 = 2/3 + 8/3 = 10/3. Min = 10/3 khi x = 3.',
        ],
      },
    ],
    examTips: [
      '⚠️ Tuyệt đối không áp dụng Cauchy khi chưa chứng minh các số là số không âm (≥ 0).',
      '⚠️ Luôn chỉ ra điều kiện xảy ra dấu đẳng thức (Dấu "=" xảy ra khi...).',
    ],
    keySignals: ['bất đẳng thức', 'giá trị nhỏ nhất', 'giá trị lớn nhất', 'Cauchy', 'AM-GM', 'Schwarz', 'câu 10 điểm'],
  },
];
