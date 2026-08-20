import { Lesson } from '../types';

export const MATH_LESSONS_DATA: Lesson[] = [
  {
    id: 'math_lesson_01',
    subject: 'math',
    topicId: 'math_pt_bac_hai_viet',
    subTopicId: 'viet_tong_tich',
    title: 'Định Lý Vi-ét & Các Dạng Bài Tập Kinh Điển Thi Vào 10',
    subTitle: 'Hệ thức Vi-ét thuận, đảo và các dạng biểu thức đối xứng/bất đối xứng',
    summary:
      'Chuyên đề chiếm trọn 1.5 - 2.0 điểm trong đề thi vào 10. Nắm vững điều kiện phương trình có 2 nghiệm (Δ ≥ 0 hoặc Δ > 0), tính tổng S và tích P theo tham số m và biến đổi biểu thức.',
    formulas: [
      {
        name: 'Hệ thức Vi-ét cho phương trình ax² + bx + c = 0 (a ≠ 0)',
        formula: 'S = x₁ + x₂ = -b / a\nP = x₁ · x₂ = c / a',
        example: 'Với pt x² - 5x + 6 = 0 có a=1, b=-5, c=6 ⇒ S = 5, P = 6 ⇒ x₁=2, x₂=3.',
        note: 'Bắt buộc phải xét Δ = b² - 4ac ≥ 0 (hoặc Δ\' = b\'² - ac ≥ 0) để phương trình có 2 nghiệm trước khi áp dụng Vi-ét!',
      },
      {
        name: 'Các biểu thức đối xứng thường gặp trong đề thi',
        formula: '1) x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = S² - 2P\n2) (x₁ - x₂)² = (x₁ + x₂)² - 4x₁x₂ = S² - 4P ⇒ |x₁ - x₂| = √(S² - 4P)\n3) x₁³ + x₂³ = (x₁ + x₂)(x₁² - x₁x₂ + x₂²) = S(S² - 3P)\n4) 1/x₁ + 1/x₂ = (x₁ + x₂) / (x₁x₂) = S / P\n5) x₁/x₂ + x₂/x₁ = (x₁² + x₂²) / (x₁x₂) = (S² - 2P) / P',
        example: 'Cho pt x² - 4x + 1 = 0. Tính A = x₁² + x₂² ⇒ S = 4, P = 1 ⇒ A = 4² - 2(1) = 14.',
        note: 'Đối với biểu thức chứa mẫu số, cần có thêm điều kiện P ≠ 0 (tức x₁, x₂ ≠ 0).',
      },
      {
        name: 'Dấu của các nghiệm phương trình bậc hai',
        formula: '• 2 nghiệm trái dấu: P < 0 (hoặc a.c < 0, không cần xét Δ)\n• 2 nghiệm cùng dấu: Δ ≥ 0 và P > 0\n• 2 nghiệm cùng dương: Δ ≥ 0, P > 0 và S > 0\n• 2 nghiệm cùng âm: Δ ≥ 0, P > 0 và S < 0',
        example: 'Tìm m để pt x² - 2x + m - 1 = 0 có 2 nghiệm dương: { Δ\' = 1 - (m-1) ≥ 0, P = m-1 > 0, S = 2 > 0 } ⇒ 1 < m ≤ 2.',
        note: 'Khi đề yêu cầu "2 nghiệm phân biệt", dùng dấu > (Δ > 0).',
      },
    ],
    rules: [
      {
        title: 'Quy trình 4 bước chuẩn giải bài toán tham số Vi-ét',
        detail:
          'Bước 1: Tìm điều kiện để pt có 2 nghiệm (a ≠ 0 và Δ ≥ 0 hoặc Δ > 0 tùy yêu cầu bài).\nBước 2: Viết hệ thức Vi-ét theo tham số m: S = x₁ + x₂, P = x₁·x₂.\nBước 3: Biến đổi hệ thức bài toán về dạng chứa S và P, thay m vào và giải phương trình tìm m.\nBước 4: Đối chiếu giá trị m vừa tìm được với điều kiện ở Bước 1 và kết luận.',
        examples: [
          'Ví dụ: Cho x² - 2(m-1)x + m - 3 = 0. Tìm m để x₁² + x₂² = 10. B1: Δ\' = (m-1)² - (m-3) = m² - 3m + 4 > 0 với mọi m. B2: S = 2m - 2, P = m - 3. B3: S² - 2P = (2m-2)² - 2(m-3) = 10 ⇒ 4m² - 10m = 0 ⇒ m = 0 hoặc m = 2.5. B4: Kết luận cả 2 nghiệm thỏa mãn.',
        ],
      },
    ],
    examTips: [
      'Bẫy hay gặp số 1: Quên kiểm tra điều kiện a ≠ 0 khi hệ số a chứa tham số m (ví dụ (m-1)x² + ... = 0).',
      'Bẫy hay gặp số 2: Tìm ra m nhưng quên đối chiếu với điều kiện Δ ≥ 0 ở đầu bài, dẫn đến kết luận thừa nghiệm và bị trừ 0.25 - 0.5đ.',
      'Mẹo Casio: Bấm Mode 5 - 3 (hoặc Menu 9 - 2 - 2 trên 580VNX), gán m = 100 vào pt để kiểm tra tính đúng đắn của nghiệm!',
    ],
    keySignals: ['x1^2 + x2^2', 'x1 - x2', 'hai nghiệm phân biệt', 'hệ thức Vi-ét', 'tìm m để phương trình'],
  },
  {
    id: 'math_lesson_02',
    subject: 'math',
    topicId: 'math_duong_tron_tu_giac',
    subTopicId: 'tu_giac_noi_tiep_4_dau_hieu',
    title: '4 Dấu Hiệu Vàng Chứng Minh Tứ Giác Nội Tiếp & Đường Tròn',
    subTitle: 'Phương pháp nhận diện nhanh và cách trình bày chuẩn đạt điểm tuyệt đối câu Hình',
    summary:
      'Bài hình học chiếm 3.0 - 3.5 điểm trong cấu trúc đề thi vào 10. Ý đầu tiên luôn là chứng minh tứ giác nội tiếp (1.0 điểm) - chiếc chìa khóa để mở toàn bộ các ý sau.',
    formulas: [
      {
        name: 'Dấu hiệu 1: Tổng hai góc đối nhau bằng 180°',
        formula: 'Tứ giác ABCD có: ∠A + ∠C = 180° (hoặc ∠B + ∠D = 180°)\n⇒ Tứ giác ABCD nội tiếp đường tròn.',
        example: 'Hai tiếp tuyến AB, AC với đường tròn (O) ⇒ ∠ABO = 90°, ∠ACO = 90° ⇒ ∠ABO + ∠ACO = 180° ⇒ ABOC nội tiếp đường tròn đường kính AO.',
        note: 'Dấu hiệu phổ biến nhất (chiếm 60% đề thi), đặc biệt với các góc vuông tạo bởi tiếp tuyến và đường cao.',
      },
      {
        name: 'Dấu hiệu 2: Hai đỉnh kề nhau cùng nhìn cạnh đối diện dưới 2 góc bằng nhau',
        formula: 'Tứ giác ABCD có 2 đỉnh kề A và B cùng nhìn đoạn CD:\n∠DAC = ∠DBC\n⇒ Tứ giác ABCD nội tiếp đường tròn.',
        example: 'Trong tam giác ABC có 2 đường cao BD và CE cắt nhau tại H. Tứ giác BCDE có ∠BEC = ∠BDC = 90° (cùng nhìn BC) ⇒ BCDE nội tiếp.',
        note: 'Dấu hiệu thường gặp khi có 2 đường cao cùng hạ xuống 2 cạnh tam giác.',
      },
      {
        name: 'Dấu hiệu 3: Góc ngoài tại một đỉnh bằng góc trong tại đỉnh đối diện',
        formula: 'Tứ giác ABCD có góc ngoài tại đỉnh D là ∠ADx:\n∠ADx = ∠ABC\n⇒ Tứ giác ABCD nội tiếp đường tròn.',
        example: 'Đường tròn ngoại tiếp tam giác, tia Ax cắt đường tròn...',
        note: 'Rất hữu ích khi chứng minh các điểm thẳng hàng hoặc hai đường thẳng song song ở câu c, d.',
      },
      {
        name: 'Dấu hiệu 4: Bốn đỉnh cùng cách đều một điểm',
        formula: 'Nếu OA = OB = OC = OD = R ⇒ Tứ giác ABCD nội tiếp đường tròn (O; R).',
        example: 'Tứ giác có 2 góc vuông cùng nhìn một cạnh: ∠BAC = ∠BDC = 90° ⇒ 4 điểm A, B, C, D cùng thuộc đường tròn đường kính BC tâm là trung điểm BC.',
        note: 'Nên ghi rõ tâm và đường kính của đường tròn để lập luận chặt chẽ.',
      },
    ],
    rules: [
      {
        title: 'Hệ thức góc trong đường tròn cần ghi nhớ',
        detail:
          '1. Góc nội tiếp và góc tạo bởi tia tiếp tuyến và dây cung cùng chắn một cung thì bằng nhau: ∠ACB = ∠BAx = 1/2 sđ cung AB.\n2. Góc nội tiếp chắn nửa đường tròn luôn bằng 90°: Điểm C thuộc (O; AB/2) ⇒ ∠ACB = 90°.\n3. Góc ở tâm gấp đôi góc nội tiếp cùng chắn một cung: ∠AOB = 2·∠ACB.',
        examples: ['Góc tạo bởi tiếp tuyến xy tại A và dây AB bằng góc nội tiếp ∠ACB cùng chắn cung AB.'],
      },
    ],
    examTips: [
      'Bí kíp vẽ hình: Vẽ đường tròn trước rồi mới vẽ tam giác ngoại tiếp/nội tiếp để hình chuẩn xác, không bị lệch giao điểm.',
      'Khi làm câu b và c của bài hình, luôn tận dụng kết quả tứ giác nội tiếp ở câu a để suy ra các cặp góc bằng nhau (chắn cung tương ứng).',
    ],
    keySignals: ['tứ giác nội tiếp', 'chứng minh 4 điểm cùng thuộc một đường tròn', 'tiếp tuyến', 'đường kính'],
  },
  {
    id: 'math_lesson_03',
    subject: 'math',
    topicId: 'math_can_thuc',
    subTopicId: 'can_thuc_rut_gon',
    title: 'Biến Đổi Căn Thức Bậc Hai & Rút Gọn Biểu Thức Chứa Căn',
    subTitle: 'Quy tắc tìm ĐKXĐ, phân tích mẫu thành nhân tử và xử lý câu hỏi phụ',
    summary:
      'Bài 1 trong cấu trúc đề thi tuyển sinh vào 10 (2.0 điểm). Làm cẩn thận từng bước để đạt trọn vẹn 2 điểm mở màn, tạo tâm lý tự tin cho cả bài thi.',
    formulas: [
      {
        name: 'Điều kiện xác định của căn thức và phân thức',
        formula: '1) √A có nghĩa ⇔ A ≥ 0\n2) 1 / A có nghĩa ⇔ A ≠ 0\n3) 1 / √A có nghĩa ⇔ A > 0',
        example: 'Tìm ĐKXĐ của P = (√x + 1) / (√x - 3): { x ≥ 0, √x - 3 ≠ 0 } ⇔ { x ≥ 0, x ≠ 9 }.',
        note: 'Luôn kết hợp tất cả các điều kiện của từng phân thức thành phần!',
      },
      {
        name: 'Hằng đẳng thức căn thức cốt lõi',
        formula: '• √(A²) = |A| = A (nếu A ≥ 0) hoặc -A (nếu A < 0)\n• x - a = (√x - √a)(√x + √a)  (với x ≥ 0, a ≥ 0)\n• x√x + a√a = (√x + √a)(x - √ax + a)\n• Trục căn: 1 / (√a ± √b) = (√a ∓ √b) / (a - b)',
        example: '√(4 - 2√3) = √((√3 - 1)²) = |√3 - 1| = √3 - 1 (vì √3 > 1).',
        note: 'Phân tích đa thức thành nhân tử ở mẫu trước khi quy đồng để tìm Mẫu thức chung gọn nhất.',
      },
    ],
    rules: [
      {
        title: 'Phương pháp giải 4 dạng câu hỏi phụ rút gọn hay thi nhất',
        detail:
          '• Dạng 1: Tính giá trị của biểu thức khi x = x₀ (Nhớ kiểm tra x₀ có thỏa mãn ĐKXĐ không trước khi thay!).\n• Dạng 2: Tìm x để P = k (hoặc P > k, P < k) ⇒ Giải phương trình/bất phương trình chứa căn, lưu ý không được tự ý quy đồng bỏ mẫu khi xét dấu.\n• Dạng 3: Tìm x nguyên để P nhận giá trị nguyên ⇒ Tách P = phần nguyên + (hằng số / mẫu), cho mẫu ∈ Ước của hằng số.\n• Dạng 4: Tìm giá trị lớn nhất / nhỏ nhất của P ⇒ Dùng bất đẳng thức Cauchy hoặc biến đổi thành bình phương cộng hằng số.',
        examples: [
          'Ví dụ P = (√x + 2)/(√x + 1) = 1 + 1/(√x + 1). Với x ≥ 0 ⇒ √x + 1 ≥ 1 ⇒ 0 < 1/(√x + 1) ≤ 1 ⇒ 1 < P ≤ 2. Max P = 2 khi x = 0.',
        ],
      },
    ],
    examTips: [
      'Mẹo Casio kiểm tra rút gọn: Nhập (Biểu thức ban đầu) - (Biểu thức sau khi rút gọn), bấm CALC x = 25 (hoặc giá trị thỏa mãn ĐKXĐ). Nếu kết quả ra 0 nghĩa là rút gọn hoàn toàn chính xác 100%!',
      'Khi giải BPT P > 0, tuyệt đối không nhân chéo bỏ mẫu nếu mẫu chưa chắc chắn dương.',
    ],
    keySignals: ['rút gọn biểu thức', 'tìm x để P', 'tìm x nguyên', 'điều kiện xác định'],
  },
  {
    id: 'math_lesson_04',
    subject: 'math',
    topicId: 'math_giai_toan_lap_pt',
    subTopicId: 'toan_chuyen_dong',
    title: 'Giải Bài Toán Bằng Cách Lập Phương Trình / Hệ Phương Trình',
    subTitle: 'Phương pháp lập bảng dữ liệu phân tích: Toán chuyển động, năng suất, công việc chung riêng',
    summary:
      'Dạng bài chiếm 1.5 - 2.0 điểm kiểm tra kỹ năng tư duy thực tế và đọc hiểu đề bài. Bí quyết thành công là lập bảng dữ liệu 3 cột trước khi viết phương trình.',
    formulas: [
      {
        name: 'Công thức toán chuyển động',
        formula: 'Quãng đường: S = v · t\nVận tốc: v = S / t\nThời gian: t = S / v\nChuyển động dòng nước:\n• v_xuôi = v_thực + v_nước\n• v_ngược = v_thực - v_nước',
        example: 'Quãng đường 120km, xe đi vận tốc v thì t = 120/v. Nếu tăng vận tốc 10km/h thì t\' = 120/(v+10). Phương trình: t - t\' = thời gian đến sớm.',
        note: 'Nhớ đổi đơn vị thời gian từ phút sang giờ: 15 phút = 1/4 giờ; 30 phút = 1/2 giờ; 45 phút = 3/4 giờ.',
      },
      {
        name: 'Công thức toán năng suất - làm chung làm riêng',
        formula: 'Khối lượng công việc = Năng suất 1 ngày · Số ngày hoàn thành\nQuy ước toàn bộ công việc hoàn thành là 1:\n• Đội 1 làm 1 mình xong trong x ngày ⇒ 1 ngày làm được 1/x (công việc)\n• Đội 2 làm 1 mình xong trong y ngày ⇒ 1 ngày làm được 1/y (công việc)\n• 2 đội cùng làm trong 1 ngày: 1/x + 1/y',
        example: 'Hai vòi nước cùng chảy trong 6 giờ đầy bể ⇒ 1/x + 1/y = 1/6.',
        note: 'Điều kiện ẩn: x > thời gian làm chung, y > thời gian làm chung.',
      },
    ],
    rules: [
      {
        title: 'Quy trình 3 bước giải bài toán lập PT / Hệ PT',
        detail:
          'Bước 1: Lập bảng phân tích và chọn ẩn số (đặt đơn vị và điều kiện hợp lý cho ẩn, ví dụ x > 0, x ∈ N*).\nBước 2: Biểu diễn các đại lượng chưa biết theo ẩn và các đại lượng đã biết, lập phương trình hoặc hệ phương trình.\nBước 3: Giải phương trình / hệ phương trình vừa lập, đối chiếu nghiệm với điều kiện và trả lời bài toán bằng lời.',
        examples: ['Ví dụ: Gọi vận tốc xe máy là x (km/h, x > 0). Vận tốc ô tô là x + 15 (km/h)...'],
      },
    ],
    examTips: [
      'Luôn viết rõ đơn vị (km, h, km/h, người, sản phẩm) và câu kết luận đầy đủ.',
      'Kiểm tra lại nghiệm bằng cách thay ngược giá trị vào đề bài xem thời gian đến sớm/trễ có đúng khớp không.',
    ],
    keySignals: ['toán chuyển động', 'năng suất', 'hai vòi nước', 'hai đội công nhân', 'quãng đường'],
  },
  {
    id: 'math_lesson_05',
    subject: 'math',
    topicId: 'math_hinh_khong_gian_thuc_te',
    subTopicId: 'hinh_tru_non_cau',
    title: 'Hình Học Không Gian & Các Bài Toán Thực Tế Điển Hình',
    subTitle: 'Công thức diện tích, thể tích hình Trụ, Nón, Cầu và bài toán tài chính',
    summary:
      'Chuyên đề chiếm 1.0 - 1.5 điểm thường nằm ở Bài 2b hoặc câu thực tế trong đề thi vào 10 toàn quốc.',
    formulas: [
      {
        name: 'Hình Trụ (Bán kính đáy r, Chiều cao h)',
        formula: '• Diện tích xung quanh: S_xq = 2π·r·h\n• Diện tích toàn phần: S_tp = 2π·r·h + 2π·r²\n• Thể tích: V = π·r²·h',
        example: 'Một lon sữa hình trụ có r = 4cm, h = 10cm ⇒ V = π · 4² · 10 = 160π ≈ 502.65 cm³.',
        note: '1 lít = 1 dm³ = 1000 cm³.',
      },
      {
        name: 'Hình Nón (Bán kính đáy r, Đường cao h, Đường sinh l = √(r² + h²))',
        formula: '• Diện tích xung quanh: S_xq = π·r·l\n• Diện tích toàn phần: S_tp = π·r·l + π·r²\n• Thể tích: V = 1/3 · π·r²·h',
        example: 'Chiếc nón lá có r = 20cm, h = 15cm ⇒ l = √(20² + 15²) = 25cm ⇒ S_xq = π·20·25 = 500π cm².',
        note: 'Mối liên hệ giữa đường sinh, chiều cao và bán kính: l² = h² + r² (Định lý Pytago).',
      },
      {
        name: 'Hình Cầu (Bán kính R, Đường kính d = 2R)',
        formula: '• Diện tích mặt cầu: S = 4π·R² = π·d²\n• Thể tích hình cầu: V = 4/3 · π·R³',
        example: 'Quả bóng đá có bán kính R = 11cm ⇒ V = 4/3 · π · 11³ ≈ 5575.28 cm³.',
        note: 'Cẩn thận đề bài cho đường kính d hay bán kính R!',
      },
    ],
    rules: [
      {
        title: 'Công thức bài toán tài chính & tỷ lệ phần trăm',
        detail:
          '• Giá sau khi giảm giá k%: Giá mới = Giá gốc · (1 - k/100)\n• Giá sau khi tăng giá / tính thuế VAT k%: Giá mới = Giá gốc · (1 + k/100)\n• Lãi suất đơn: Tiền cả vốn lẫn lãi = Vốn · (1 + n · r)',
        examples: ['Món hàng giá 500.000đ giảm giá 20% ⇒ Giá bán = 500.000 · (1 - 0.20) = 400.000đ.'],
      },
    ],
    examTips: [
      'Đề bài yêu cầu lấy π ≈ 3.14 hay giữ nguyên π? Hãy đọc kỹ hướng dẫn làm tròn chữ số thập phân (thường là làm tròn đến chữ số thập phân thứ nhất hoặc thứ hai).',
    ],
    keySignals: ['hình trụ', 'hình nón', 'hình cầu', 'thể tích', 'diện tích xung quanh', 'giảm giá', 'lãi suất'],
  },
  {
    id: 'math_lesson_06',
    subject: 'math',
    topicId: 'math_bat_dang_thuc_cuc_tri',
    subTopicId: 'bdt_cauchy_am_gm',
    title: 'Bất Đẳng Thức Cauchy & Kỹ Thuật Chọn Điểm Rơi (Câu 10 Điểm)',
    subTitle: 'Bí kíp chinh phục câu cuối phân loại điểm 9.5 - 10 trong đề thi vào 10',
    summary:
      'Chuyên đề dành cho học sinh mục tiêu điểm 9.5 - 10 vào các trường THPT Chuyên hoặc Top 1. Sử dụng nhuần nhuyễn BĐT Cauchy (AM-GM), Bunhiacopxki và Cauchy-Schwarz dạng phân thức (BĐT Schwarz).',
    formulas: [
      {
        name: 'Bất đẳng thức Cauchy (AM-GM) cho 2 và 3 số không âm',
        formula: 'Với a, b ≥ 0:  (a + b) / 2 ≥ √(a·b)  ⇔  a + b ≥ 2√(a·b)\nDấu "=" xảy ra ⇔ a = b\n\nVới a, b, c ≥ 0:  a + b + c ≥ 3 ³√(a·b·c)\nDấu "=" xảy ra ⇔ a = b = c',
        example: 'Cho x > 0. Tìm GTNN của P = x + 4/x. Áp dụng Cauchy cho 2 số dương: P = x + 4/x ≥ 2√(x · 4/x) = 4. Min P = 4 khi x = 4/x ⇔ x = 2.',
        note: 'Hệ quả: (a + b)² ≥ 4ab;  a² + b² ≥ 2ab;  a² + b² ≥ (a + b)² / 2.',
      },
      {
        name: 'Bất đẳng thức Cauchy-Schwarz dạng phân thức (BĐT Engel / Schwarz)',
        formula: 'Với x, y > 0 và a, b bất kỳ:\na² / x + b² / y ≥ (a + b)² / (x + y)\nDấu "=" xảy ra ⇔ a / x = b / y',
        example: 'Với a, b > 0 và a + b = 1. Tìm GTNN của 1/a + 1/b ≥ (1 + 1)² / (a + b) = 4/1 = 4. Min = 4 khi a = b = 1/2.',
        note: 'Cực kỳ mạnh để chứng minh các bất đẳng thức đối xứng có mẫu số!',
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
      'Tuyệt đối không áp dụng Cauchy khi chưa chứng minh các số là số không âm (≥ 0).',
      'Luôn chỉ ra điều kiện xảy ra dấu đẳng thức (Dấu "=" xảy ra khi...).',
    ],
    keySignals: ['bất đẳng thức', 'giá trị nhỏ nhất', 'giá trị lớn nhất', 'Cauchy', 'AM-GM', 'câu 10 điểm'],
  },
];
