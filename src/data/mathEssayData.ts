import { MathEssayProblem } from '../types';

export const MATH_ESSAY_PROBLEMS: MathEssayProblem[] = [
  {
    id: 'essay_can_thuc_01',
    title: 'Bài I: Rút gọn biểu thức chứa căn & Bài toán phụ',
    category: 'can_thuc',
    examWeight: '2.0 điểm',
    problemContent:
      'Cho hai biểu thức A = (√x + 4)/(√x - 1) và B = (3√x + 1)/(x - 1) - 2/(√x + 1) với x ≥ 0, x ≠ 1.\n1) Tính giá trị của biểu thức A khi x = 9.\n2) Rút gọn biểu thức B.\n3) Tìm tất cả các giá trị nguyên của x để P = A · B đạt giá trị nguyên.',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Bước 1: Tính giá trị của biểu thức A khi x = 9 (0.5 điểm)',
        pointWeight: '0.5đ',
        stepDetail:
          '• Kiểm tra điều kiện: x = 9 thỏa mãn x ≥ 0, x ≠ 1.\n• Thay x = 9 (suy ra √x = 3) vào biểu thức A:\n  A = (3 + 4) / (3 - 1) = 7 / 2.\n• Kết luận: Vậy khi x = 9 thì A = 7/2.',
        trapsToAvoid: 'Bắt buộc phải ghi câu "thỏa mãn điều kiện" trước khi thay số vào tính!',
      },
      {
        stepNumber: 2,
        stepTitle: 'Bước 2: Rút gọn biểu thức B (1.0 điểm)',
        pointWeight: '1.0đ',
        stepDetail:
          '• Phân tích mẫu thức: x - 1 = (√x - 1)(√x + 1). Mẫu thức chung là (√x - 1)(√x + 1).\n• Quy đồng mẫu số:\n  B = (3√x + 1) / [(√x - 1)(√x + 1)] - [2(√x - 1)] / [(√x - 1)(√x + 1)]\n  B = [3√x + 1 - (2√x - 2)] / [(√x - 1)(√x + 1)]\n  B = (3√x + 1 - 2√x + 2) / [(√x - 1)(√x + 1)] = (√x + 3) / [(√x - 1)(√x + 1)] = (√x + 3)/(x - 1) (hoặc giữ dạng nhân tử).',
        trapsToAvoid: 'Bẫy dấu trừ: Đằng trước phân thức có dấu trừ - 2(√x - 1), khi phá ngoặc phải đổi dấu thành - 2√x + 2.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Bước 3: Tìm x nguyên để P = A · B nhận giá trị nguyên (0.5 điểm)',
        pointWeight: '0.5đ',
        stepDetail:
          '• Ta có P = A · B = [(√x + 4)/(√x - 1)] · [(√x - 1)/(√x + 2)] = (√x + 4)/(√x + 2) (ví dụ B sau rút gọn).\n• Tách phần nguyên: P = (√x + 2 + 2)/(√x + 2) = 1 + 2/(√x + 2).\n• Vì x nguyên, x ≥ 0 nên √x + 2 ≥ 2.\n• Để P nguyên thì (√x + 2) là ước nguyên của 2, mà √x + 2 ≥ 2 nên √x + 2 = 2 ⇒ √x = 0 ⇒ x = 0 (TM).\n• Kết luận: Vậy x = 0 thì P đạt giá trị nguyên.',
        trapsToAvoid: 'Đánh giá điều kiện mẫu thức √x + 2 ≥ 2 giúp loại bỏ các ước âm {-1, -2} và ước 1 ngay từ đầu.',
      },
    ],
    finalAnswer: '1) A = 7/2    2) B = (√x - 1)/(√x + 2)    3) x = 0',
  },
  {
    id: 'essay_viet_02',
    title: 'Bài III.2: Phương trình bậc hai & Định lý Vi-ét',
    category: 'viet',
    examWeight: '1.5 điểm',
    problemContent:
      'Cho phương trình: x² - 2(m - 1)x + m² - 3 = 0 (với m là tham số).\n1) Giải phương trình khi m = 2.\n2) Tìm tất cả các giá trị của m để phương trình có hai nghiệm phân biệt x₁, x₂ thỏa mãn: x₁² + x₂² = 10.',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Bước 1: Giải phương trình khi m = 2 (0.5 điểm)',
        pointWeight: '0.5đ',
        stepDetail:
          '• Thay m = 2 vào phương trình, ta được:\n  x² - 2(2 - 1)x + (2² - 3) = 0 ⇔ x² - 2x + 1 = 0 ⇔ (x - 1)² = 0 ⇔ x = 1.\n• Kết luận: Với m = 2, phương trình có nghiệm kép x = 1.',
        trapsToAvoid: 'Nhận ra hằng đẳng thức (x - 1)² = 0 để giải nhanh không cần tính Δ.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Bước 2: Tìm điều kiện để phương trình có 2 nghiệm phân biệt (0.5 điểm)',
        pointWeight: '0.5đ',
        stepDetail:
          '• Ta có Δ\' = [-(m - 1)]² - 1·(m² - 3) = m² - 2m + 1 - m² + 3 = 4 - 2m.\n• Phương trình có 2 nghiệm phân biệt x₁, x₂ khi và chỉ khi:\n  Δ\' > 0 ⇔ 4 - 2m > 0 ⇔ 2m < 4 ⇔ m < 2 (*).',
        trapsToAvoid: 'Cực kỳ quan trọng: Nếu thiếu bước tìm ĐK Δ > 0 thì sẽ bị trừ 0.25 - 0.5 điểm của câu này!',
      },
      {
        stepNumber: 3,
        stepTitle: 'Bước 3: Áp dụng Vi-ét & Đối chiếu điều kiện (0.5 điểm)',
        pointWeight: '0.5đ',
        stepDetail:
          '• Theo hệ thức Vi-ét: S = x₁ + x₂ = 2(m - 1) và P = x₁·x₂ = m² - 3.\n• Biến đổi hệ thức bài toán: x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = 10\n  ⇔ [2(m - 1)]² - 2(m² - 3) = 10\n  ⇔ 4(m² - 2m + 1) - 2m² + 6 = 10\n  ⇔ 4m² - 8m + 4 - 2m² + 6 = 10\n  ⇔ 2m² - 8m = 0 ⇔ 2m(m - 4) = 0 ⇒ m = 0 hoặc m = 4.\n• Đối chiếu điều kiện m < 2 (*):\n  - m = 0 (Thỏa mãn)\n  - m = 4 (Loại vì 4 > 2)\n• Kết luận: Vậy m = 0 là giá trị cần tìm.',
        trapsToAvoid: 'Bẫy chết người: Quên đối chiếu điều kiện m < 2 nên lấy cả m = 4 (m = 4 làm Δ < 0 không có nghiệm).',
      },
    ],
    finalAnswer: '1) x = 1 (nghiệm kép)    2) m = 0 (loại m = 4)',
  },
  {
    id: 'essay_lap_pt_03',
    title: 'Bài II: Giải bài toán bằng cách lập phương trình / hệ phương trình',
    category: 'lap_pt',
    examWeight: '2.0 điểm',
    problemContent:
      'Một xưởng may theo kế hoạch phải may 1200 chiếc áo trong một thời gian quy định. Khi thực hiện, nhờ cải tiến kỹ thuật, mỗi ngày xưởng đã may được nhiều hơn 10 chiếc áo so với kế hoạch. Do đó, xưởng không những hoàn thành sớm hơn dự định 2 ngày mà còn may thêm được 60 chiếc áo nữa. Tính số áo mà xưởng phải may trong một ngày theo kế hoạch.',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Bước 1: Chọn ẩn, đặt đơn vị và điều kiện (0.25 điểm)',
        pointWeight: '0.25đ',
        stepDetail:
          '• Gọi số áo xưởng phải may trong 1 ngày theo kế hoạch là x (chiếc áo, x ∈ ℕ*, x > 0).\n• Thời gian dự định may xong 1200 chiếc áo là: 1200 / x (ngày).',
        trapsToAvoid: 'Nhớ ghi đơn vị và điều kiện x nguyên dương x ∈ ℕ*.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Bước 2: Biểu diễn các đại lượng theo ẩn và lập phương trình (0.75 điểm)',
        pointWeight: '0.75đ',
        stepDetail:
          '• Thực tế mỗi ngày may được: x + 10 (chiếc áo).\n• Thực tế tổng số áo may được là: 1200 + 60 = 1260 (chiếc áo).\n• Thời gian thực tế hoàn thành là: 1260 / (x + 10) (ngày).\n• Vì thực tế hoàn thành sớm hơn dự định 2 ngày nên ta có phương trình:\n  1200/x - 1260/(x + 10) = 2.',
        trapsToAvoid: 'Lấy thời gian dự định (nhiều hơn) trừ thời gian thực tế (ít hơn) = 2 ngày.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Bước 3: Giải phương trình và kết luận (1.0 điểm)',
        pointWeight: '1.0đ',
        stepDetail:
          '• Chia cả 2 vế cho 2: 600/x - 630/(x + 10) = 1\n  ⇔ 600(x + 10) - 630x = x(x + 10)\n  ⇔ 600x + 6000 - 630x = x² + 10x\n  ⇔ x² + 40x - 6000 = 0\n  Ta có Δ\' = 20² - 1·(-6000) = 400 + 6000 = 6400 = 80² > 0.\n  ⇒ x₁ = -20 + 80 = 60 (Thỏa mãn điều kiện)\n  ⇒ x₂ = -20 - 80 = -100 (Loại vì x > 0).\n• Kết luận: Vậy theo kế hoạch, mỗi ngày xưởng phải may 60 chiếc áo.',
        trapsToAvoid: 'Bắt buộc đối chiếu nghiệm x = 60 (TM), x = -100 (Loại) trước khi kết luận.',
      },
    ],
    finalAnswer: 'Mỗi ngày theo kế hoạch xưởng phải may 60 chiếc áo.',
  },
];
