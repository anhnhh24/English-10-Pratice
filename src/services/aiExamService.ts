import { Question, Exam, TopicId, SubTopicId, DifficultyLevel, SubjectId } from '../types';

export interface ExamGenerationConfig {
  subject?: SubjectId; // 'english' | 'math'
  title?: string;
  targetProvince?: string;
  difficulty: 'standard' | 'advanced' | 'challenge';
  totalQuestions: number;
  timeLimitMinutes: number;
  focusTopics?: TopicId[];
  customPrompt?: string;
  modelName?: string;
}

export interface GeneratedExamResult {
  exam: Exam;
  questions: Question[];
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Ưu tiên - Siêu nhanh & Chuẩn xác)' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Thế hệ mới nhất)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Tốc độ cao)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Hạn mức cao 500 RPD)' },
  { id: 'gemma-4-26b-it', name: 'Gemma 4 26B (Model dự phòng)' },
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B (Model dự phòng)' },
];

export const getStoredApiKey = (): string => {
  const envKey = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
    ''
  ).trim();
  const localKey = (
    localStorage.getItem('edu10_gemini_api_key') ||
    localStorage.getItem('gemini_api_key') ||
    ''
  ).trim();
  return localKey || envKey;
};

export const isApiKeyFromEnv = (): boolean => {
  const envKey = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
    ''
  ).trim();
  return Boolean(envKey);
};

export const setStoredApiKey = (key: string): void => {
  localStorage.setItem('edu10_gemini_api_key', key.trim());
};

export const clearStoredApiKey = (): void => {
  localStorage.removeItem('edu10_gemini_api_key');
};

export function formatGeminiError(status: number, rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  if (msg.includes('leaked') || (status === 403 && (msg.includes('api key') || msg.includes('reported')))) {
    return '⚠️ Mã API Key này đã bị Google vô hiệu hóa do bị lộ trên mạng/GitHub. Vui lòng tạo 1 API Key mới miễn phí tại https://aistudio.google.com/app/apikey và dán vào ô bên dưới.';
  }
  if (status === 400 || msg.includes('api_key_invalid') || msg.includes('invalid api key')) {
    return '⚠️ Mã Gemini API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại mã key.';
  }
  if (status === 429 || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate limit')) {
    return '⚠️ Đang bị giới hạn số lượt gọi miễn phí tạm thời (Rate Limit). Hệ thống đang tự động kích hoạt model dự phòng hoặc vui lòng đợi 15-30 giây.';
  }
  return `Lỗi từ Gemini API (${status}): ${rawMessage}`;
}

/**
 * Gọi API thông minh với cơ chế:
 * 1. Retry tự động tối đa 2 lần cho mỗi model với Exponential Backoff (1.5s -> 3s) khi bị 429/503/mạng lag.
 * 2. Tự động chuyển (Failover) sang model tiếp theo trong danh sách nếu model hiện tại lỗi.
 */
export async function callGeminiApiWithFallback(
  apiKey: string,
  preferredModel: string,
  requestPayload: any,
  onProgress?: (msg: string) => void
): Promise<{ text: string; modelUsed: string }> {
  const modelsToTry = [
    preferredModel || 'gemini-3.5-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemma-4-26b-it',
    'gemma-4-31b-it',
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let lastError: any = null;
  const maxRetriesPerModel = 2;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];

    for (let retry = 0; retry <= maxRetriesPerModel; retry++) {
      if (mIdx > 0 && retry === 0) {
        onProgress?.(`⚡ Model ${modelsToTry[mIdx - 1]} không phản hồi, tự động chuyển sang ${currentModel}...`);
      } else if (retry > 0) {
        const delaySec = retry * 1.5;
        onProgress?.(`🔄 Model ${currentModel} bận (Lần ${retry}/${maxRetriesPerModel}), đang thử lại sau ${delaySec}s...`);
        await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout per request

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText && rawText.trim()) {
            return { text: rawText, modelUsed: currentModel };
          }
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;
        lastError = new Error(formatGeminiError(response.status, errorMsg));

        // Nếu API Key sai hoặc bị leak thì dừng ngay không cần thử lại
        if (response.status === 400 || (response.status === 403 && (errorMsg.includes('API key') || errorMsg.includes('leaked')))) {
          throw lastError;
        }

        // Nếu lỗi 404 (model không hỗ trợ endpoint này), break ngay để chuyển model khác không cần retry
        if (response.status === 404) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          lastError = new Error(`Request tới model ${currentModel} bị quá thời gian chờ (Timeout).`);
        }
        if (err.message && err.message.includes('vô hiệu hóa')) {
          throw err;
        }
      }
    }
  }

  throw lastError || new Error('Không thể kết nối đến máy chủ AI sau khi đã thử tất cả model dự phòng. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.');
}

export async function validateApiKey(apiKey: string, model: string = 'gemini-3.6-flash'): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key để kiểm tra' };
  }

  try {
    const result = await callGeminiApiWithFallback(
      apiKey,
      model,
      {
        contents: [{ parts: [{ text: 'Hello, reply with "OK".' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }
    );
    return { success: true, message: `API Key hoạt động hoàn hảo! (Model: ${result.modelUsed})` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Lỗi mạng hoặc kết nối' };
  }
}

export const testGeminiApiKey = validateApiKey;

/**
 * Phục hồi và phân tích JSON đề thi ngay cả khi chuỗi JSON bị ngắt quãng hoặc thiếu đóng ngoặc do giới hạn token
 */
export function tryParseOrRepairExamJson(rawText: string): any {
  if (!rawText || !rawText.trim()) return null;

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tiếp tục xử lý phục hồi
  }

  // 2. Thử đóng ngoặc tự động cho JSON bị cắt cụt
  try {
    let repaired = cleaned;
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }

    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }

    const quickParsed = JSON.parse(repaired);
    if (quickParsed && Array.isArray(quickParsed.questions) && quickParsed.questions.length > 0) {
      return quickParsed;
    }
  } catch {
    // Tiếp tục phương pháp trích xuất từng câu hỏi
  }

  // 3. Trích xuất từng câu hỏi hoàn chỉnh bằng thuật toán quét ngoặc (Balanced Brace Scan)
  try {
    const questionsMatch = cleaned.match(/"questions"\s*:\s*\[/);
    if (!questionsMatch) {
      throw new Error('Không tìm thấy mảng câu hỏi');
    }

    const titleMatch = cleaned.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const codeMatch = cleaned.match(/"code"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const descMatch = cleaned.match(/"description"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const targetProvMatch = cleaned.match(/"targetProvince"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const diffMatch = cleaned.match(/"difficulty"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const timeMatch = cleaned.match(/"timeLimitMinutes"\s*:\s*(\d+)/);

    const questionsStartIndex = cleaned.indexOf('[', questionsMatch.index);
    const questionsSubstring = cleaned.slice(questionsStartIndex + 1);

    const questions: any[] = [];
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let startObjIndex = -1;

    for (let i = 0; i < questionsSubstring.length; i++) {
      const char = questionsSubstring[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          if (depth === 0) startObjIndex = i;
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && startObjIndex !== -1) {
            const objStr = questionsSubstring.substring(startObjIndex, i + 1);
            try {
              const qObj = JSON.parse(objStr);
              if (qObj && (qObj.content || qObj.options)) {
                questions.push(qObj);
              }
            } catch {
              // Bỏ qua nếu câu đó bị lỗi cú pháp riêng
            }
            startObjIndex = -1;
          }
        }
      }
    }

    if (questions.length > 0) {
      return {
        title: titleMatch ? titleMatch[1] : undefined,
        code: codeMatch ? codeMatch[1] : undefined,
        description: descMatch ? descMatch[1] : undefined,
        targetProvince: targetProvMatch ? targetProvMatch[1] : undefined,
        difficulty: diffMatch ? diffMatch[1] : undefined,
        timeLimitMinutes: timeMatch ? parseInt(timeMatch[1], 10) : undefined,
        questions,
      };
    }
  } catch {
    // Không thể trích xuất
  }

  throw new Error('Dữ liệu AI trả về không thể phân tích cú pháp. Vui lòng thử lại.');
}

/**
 * Tạo đề thi Tiếng Anh hoặc Toán vào lớp 10 bằng Gemini API
 */
export async function generateExamWithAI(
  apiKey: string,
  config: ExamGenerationConfig,
  onProgressUpdate?: (step: string) => void
): Promise<GeneratedExamResult> {
  const effectiveKey = apiKey.trim() || getStoredApiKey();
  if (!effectiveKey) {
    throw new Error('Chưa cung cấp Gemini API Key. Vui lòng nhập API Key để tiếp tục.');
  }

  const subject = config.subject || 'english';
  const model = config.modelName || 'gemini-3.6-flash';

  onProgressUpdate?.(
    subject === 'math'
      ? 'Đang phân tích ma trận đề thi môn Toán & xây dựng câu hỏi chuẩn form vào 10...'
      : 'Đang phân tích ma trận đề thi Tiếng Anh & xây dựng câu hỏi chuẩn form vào 10...'
  );

  let systemInstruction = '';
  let userPrompt = '';

  if (subject === 'math') {
    systemInstruction = `Bạn là một chuyên gia khảo thí và giáo viên luyện thi môn Toán vào lớp 10 THPT hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là biên soạn một đề thi trắc nghiệm Toán học tuyển sinh vào lớp 10 bám sát tuyệt đối chương trình GDPT hiện hành và ma trận đề thi của các Sở Giáo dục và Đào tạo (Hà Nội, TP.HCM, Đà Nẵng,...).

YÊU CẦU DỮ LIỆU ĐẦU RA (JSON FORMAT):
Bạn PHẢI trả về duy nhất một chuỗi JSON hợp lệ không bọc thêm bất kỳ văn bản giải thích nào ngoài JSON.
Cấu trúc JSON bắt buộc:
{
  "title": "Tên đề thi (ví dụ: Đề Thi Thử Toán Vào 10 - Bứt Phá Vi-ét & Hình Học Đường Tròn)",
  "code": "Mã đề (ví dụ: TOAN10-AI-${Math.floor(100 + Math.random() * 900)})",
  "description": "Mô tả ngắn gọn về ma trận và độ khó của đề",
  "targetProvince": "Chuẩn Sở GD&ĐT / Mục tiêu điểm",
  "difficulty": "${config.difficulty}",
  "timeLimitMinutes": ${config.timeLimitMinutes},
  "questions": [
    {
      "topicId": "math_can_thuc | math_he_phuong_trinh | math_ham_so_do_thi | math_pt_bac_hai_viet | math_giai_toan_lap_pt | math_he_thuc_luong | math_duong_tron_tu_giac | math_hinh_khong_gian_thuc_te | math_bat_dang_thuc_cuc_tri",
      "subTopicId": "can_thuc_rut_gon | can_thuc_dkxd | can_thuc_bai_toan_phu | he_pt_the_cong | he_pt_chua_tham_so | ham_so_bac_nhat_song_song | ham_so_parabol_cat_thang | pt_bac_hai_delta | viet_tong_tich | viet_he_thuc_doi_xung | toan_chuyen_dong | toan_nang_suat_cong_viec | toan_thuc_te_phan_tram | he_thuc_luong_tam_giac_vuong | ti_so_luong_giac_thuc_te | tiep_tuyen_duong_tron | goc_noi_tiep | tu_giac_noi_tiep_4_dau_hieu | hinh_tru_non_cau | toan_thuc_te_hinh_hoc | bdt_cauchy_am_gm | bdt_bunhiacopxki_cuc_tri",
      "difficulty": "easy | medium | hard | expert",
      "content": "Nội dung câu hỏi Toán học bằng tiếng Việt (viết công thức rõ ràng, ví dụ: √(x + 1), x² - 5x + 6 = 0, Δ ≥ 0)",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": 0, // Số nguyên từ 0 đến 3 tương ứng với A, B, C, D
      "explanation": "Lời giải từng bước ngắn gọn, rõ ràng (Bước 1: ĐKXĐ, Bước 2: Biến đổi, Bước 3: Kết luận)",
      "grammarRule": "Định lý / Công thức toán áp dụng (ví dụ: Định lý Vi-ét, BĐT Cauchy, Dấu hiệu tứ giác nội tiếp)",
      "commonMistakeTip": "Cảnh báo bẫy hay sai (ví dụ: Quên đối chiếu ĐKXĐ x ≥ 0, quên xét a ≠ 0, sai dấu khi chuyển vế)",
      "translation": "Tóm tắt phương pháp giải ngắn gọn"
    }
  ]
}

LƯU Ý CỰC KỲ QUAN TRỌNG:
1. Đảm bảo đúng chính xác ${config.totalQuestions} câu hỏi trong mảng 'questions'.
2. Các đáp án trong 'options' phải bắt đầu bằng 'A. ', 'B. ', 'C. ', 'D. '.
3. 'correctOption' phải là số index (0 cho A, 1 cho B, 2 cho C, 3 cho D).
4. Sử dụng ký hiệu toán học phổ thông dễ đọc: √ (căn), ² ³ (mũ), π (pi), Δ (delta), ≥ ≤ (lớn/nhỏ hơn hoặc bằng), ∠ (góc), ° (độ).`;

    userPrompt = `Hãy tạo một đề thi Toán vào lớp 10 với các thông số sau:
- Tên đề (gợi ý): ${config.title || 'Đề Thi Thử Môn Toán Vào 10 - Tạo bởi AI'}
- Độ khó: ${config.difficulty === 'challenge' ? 'Nâng cao / Chuyên Toán (Mục tiêu 9-10đ)' : config.difficulty === 'advanced' ? 'Khá - Giỏi (Mục tiêu 8-8.5đ)' : 'Cơ bản - Chuẩn đề chung (Mục tiêu 7-8đ)'}
- Số lượng câu hỏi: ${config.totalQuestions} câu
- Thời gian làm bài: ${config.timeLimitMinutes} phút
${config.focusTopics && config.focusTopics.length > 0 ? `- Các chủ đề trọng tâm: ${config.focusTopics.join(', ')}` : ''}
${config.targetProvince ? `- Định dạng / Tỉnh thành hướng tới: ${config.targetProvince}` : ''}
${config.customPrompt ? `- Yêu cầu đặc biệt bổ sung từ người dùng: "${config.customPrompt}"` : ''}

Hãy trả về DUY NHẤT mã JSON theo cấu trúc quy định.`;
  } else {
    // English prompt
    systemInstruction = `Bạn là một chuyên gia khảo thí và giáo viên luyện thi môn Tiếng Anh vào lớp 10 THPT hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là biên soạn một đề thi trắc nghiệm Tiếng Anh tuyển sinh vào lớp 10 bám sát tuyệt đối chương trình GDPT hiện hành và ma trận đề thi của các Sở Giáo dục và Đào tạo (Hà Nội, TP.HCM, Đà Nẵng,...).

YÊU CẦU DỮ LIỆU ĐẦU RA (JSON FORMAT):
Bạn PHẢI trả về duy nhất một chuỗi JSON hợp lệ không bọc thêm bất kỳ văn bản giải thích nào ngoài JSON.
Cấu trúc JSON bắt buộc:
{
  "title": "Tên đề thi (ví dụ: Đề Thi Thử Vào 10 - Bứt Phá Ngữ Pháp & Biến Đổi Câu)",
  "code": "Mã đề (ví dụ: TS10-AI-${Math.floor(100 + Math.random() * 900)})",
  "description": "Mô tả ngắn gọn về ma trận và độ khó của đề",
  "targetProvince": "Chuẩn Sở GD&ĐT / Mục tiêu điểm",
  "difficulty": "${config.difficulty}",
  "timeLimitMinutes": ${config.timeLimitMinutes},
  "questions": [
    {
      "topicId": "grammar | vocabulary | pronunciation | stress | reading | sentence_rewrite | cloze | error_identification",
      "subTopicId": "tenses | passive_voice | reported_speech | conditionals | relative_clauses | comparisons | wish_clauses | gerund_infinitive | tag_questions | modal_verbs | phrasal_verbs | prepositions | pronunciation_s_es | pronunciation_ed | pronunciation_vowels | stress_2_syllables | stress_3_syllables | vocab_environment | vocab_city_life | vocab_teen_stress | vocab_past_life | vocab_wonders | vocab_space | rewrite_conditionals | rewrite_passive | rewrite_reported | rewrite_connectors | rewrite_so_such | rewrite_too_enough | reading_comprehension | cloze_test | find_error",
      "difficulty": "easy | medium | hard | expert",
      "content": "Nội dung câu hỏi bằng tiếng Anh",
      "passage": "Đoạn văn đọc hiểu hoặc điền từ (nếu có, nếu không thì null)",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": 0, // Số nguyên từ 0 đến 3 tương ứng với A, B, C, D
      "explanation": "Giải thích ngắn gọn 1-2 câu vì sao chọn đáp án này",
      "grammarRule": "Công thức hoặc quy tắc cốt lõi áp dụng",
      "commonMistakeTip": "Mẹo tránh bẫy ngắn gọn",
      "translation": "Dịch câu hỏi và đáp án sang tiếng Việt ngắn gọn"
    }
  ]
}

LƯU Ý CỰC KỲ QUAN TRỌNG:
1. Đảm bảo đúng chính xác ${config.totalQuestions} câu hỏi trong mảng 'questions'.
2. Các đáp án trong 'options' phải bắt đầu bằng 'A. ', 'B. ', 'C. ', 'D. '.
3. 'correctOption' phải là số index (0 cho A, 1 cho B, 2 cho C, 3 cho D).
4. Giữ phần giải thích 'explanation', 'grammarRule', 'translation' súc tích, ngắn gọn (1-2 câu).`;

    userPrompt = `Hãy tạo một đề thi Tiếng Anh vào lớp 10 với các thông số sau:
- Tên đề (gợi ý): ${config.title || 'Đề Thi Thử Tiếng Anh Vào 10 - Tạo bởi AI'}
- Độ khó: ${config.difficulty === 'challenge' ? 'Nâng cao / Chuyên Anh (Mục tiêu 9-10đ)' : config.difficulty === 'advanced' ? 'Khá - Giỏi (Mục tiêu 8-8.5đ)' : 'Cơ bản - Chuẩn đề chung (Mục tiêu 7-8đ)'}
- Số lượng câu hỏi: ${config.totalQuestions} câu
- Thời gian làm bài: ${config.timeLimitMinutes} phút
${config.focusTopics && config.focusTopics.length > 0 ? `- Các chủ đề trọng tâm: ${config.focusTopics.join(', ')}` : ''}
${config.targetProvince ? `- Định dạng / Tỉnh thành hướng tới: ${config.targetProvince}` : ''}
${config.customPrompt ? `- Yêu cầu đặc biệt bổ sung từ người dùng: "${config.customPrompt}"` : ''}

Hãy trả về DUY NHẤT mã JSON theo cấu trúc quy định.`;
  }

  onProgressUpdate?.('Đang gửi yêu cầu đến Gemini AI và khởi tạo câu hỏi...');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveKey)}`;

  const requestBody: any = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: userPrompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 32768,
    },
  };

  const result = await callGeminiApiWithFallback(
    effectiveKey,
    model,
    requestBody,
    onProgressUpdate
  );

  onProgressUpdate?.('Đang xử lý và chuẩn hóa dữ liệu đề thi...');
  const rawText = result.text;
  const parsedData = tryParseOrRepairExamJson(rawText);

  if (!parsedData || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
    throw new Error('Dữ liệu đề thi AI trả về không đúng định dạng. Vui lòng thử lại.');
  }

  onProgressUpdate?.('Hoàn tất! Đang định dạng câu hỏi và liên kết vào hệ thống...');

  const examTimestamp = Date.now();
  const examId = `exam_ai_${examTimestamp}`;

  const defaultTopic: TopicId = subject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar';
  const defaultSubTopic: SubTopicId = subject === 'math' ? 'viet_tong_tich' : 'tenses';

  const formattedQuestions: Question[] = parsedData.questions.map((q: any, idx: number) => {
    const qId = `q_ai_${examTimestamp}_${idx + 1}`;

    let opts = Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A. ', 'B. ', 'C. ', 'D. '];
    opts = opts.map((opt: string, i: number) => {
      const prefix = ['A. ', 'B. ', 'C. ', 'D. '][i];
      if (!opt.startsWith('A.') && !opt.startsWith('B.') && !opt.startsWith('C.') && !opt.startsWith('D.') &&
        !opt.startsWith('A. ') && !opt.startsWith('B. ') && !opt.startsWith('C. ') && !opt.startsWith('D. ')) {
        return `${prefix}${opt}`;
      }
      return opt;
    });

    const validCorrect = typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
      ? q.correctOption
      : 0;

    return {
      id: qId,
      subject,
      topicId: (q.topicId as TopicId) || defaultTopic,
      subTopicId: (q.subTopicId as SubTopicId) || defaultSubTopic,
      difficulty: (q.difficulty as DifficultyLevel) || 'medium',
      content: q.content || `Câu ${idx + 1}`,
      passage: q.passage || undefined,
      options: opts,
      correctOption: validCorrect,
      explanation: q.explanation || 'Xem đáp án và tự đối chiếu phương pháp giải.',
      grammarRule: q.grammarRule || undefined,
      commonMistakeTip: q.commonMistakeTip || undefined,
      translation: q.translation || undefined,
    };
  });

  const generatedExam: Exam = {
    id: examId,
    subject,
    code: parsedData.code || `${subject === 'math' ? 'TOAN10' : 'TS10'}-AI-${Math.floor(100 + Math.random() * 900)}`,
    title:
      parsedData.title ||
      config.title ||
      (subject === 'math'
        ? 'Đề Thi Thử Môn Toán Tuyển Sinh Lớp 10 (Tạo bởi AI)'
        : 'Đề Thi Thử Tiếng Anh Tuyển Sinh Lớp 10 (Tạo bởi AI)'),
    description: parsedData.description || `Đề thi ${formattedQuestions.length} câu môn ${subject === 'math' ? 'Toán' : 'Tiếng Anh'} được thiết kế tự động bởi Gemini AI.`,
    targetProvince: parsedData.targetProvince || config.targetProvince || 'Chuẩn Sở GD&ĐT',
    timeLimitMinutes: parsedData.timeLimitMinutes || config.timeLimitMinutes || 45,
    totalQuestions: formattedQuestions.length,
    difficulty: (parsedData.difficulty as any) || config.difficulty || 'standard',
    questionIds: formattedQuestions.map((q) => q.id),
    isOfficialFormat: false,
    createdAt: new Date().toISOString().split('T')[0],
  };

  return {
    exam: generatedExam,
    questions: formattedQuestions,
  };
}

export interface ExamEvaluationReport {
  overallAssessment: string;
  gradePrediction: string;
  strengths: string[];
  weaknesses: {
    topicName: string;
    issue: string;
    solution: string;
  }[];
  actionPlan: string[];
  timeManagementComment: string;
  examTacticsTip: string;
}

/**
 * Đánh giá kết quả bài thi tức thì bằng thuật toán phân tích ma trận kiến thức
 */
export function getLocalExamEvaluation(
  score: number,
  totalQuestions: number,
  timeSpentSeconds: number,
  timeLimitMinutes: number,
  topicBreakdown: Record<string, { total: number; correct: number; wrong: number; name: string }>,
  targetScore: number = 8.5,
  subject: SubjectId = 'english'
): ExamEvaluationReport {
  const timeSpentMinutes = Math.round(timeSpentSeconds / 60);

  const strengths: string[] = [];
  const weaknesses: { topicName: string; issue: string; solution: string }[] = [];

  Object.values(topicBreakdown).forEach((tb) => {
    if (tb.total > 0) {
      const acc = (tb.correct / tb.total) * 100;
      if (acc >= 75) {
        strengths.push(`${tb.name} (Đúng ${tb.correct}/${tb.total} câu - ${Math.round(acc)}%)`);
      } else {
        weaknesses.push({
          topicName: tb.name,
          issue: `Tỷ lệ làm đúng chỉ đạt ${Math.round(acc)}% (${tb.wrong} câu sai trong phần này).`,
          solution: `Xem lại lý thuyết và công thức cốt lõi về ${tb.name}, làm thêm bài tập chuyên đề tương tự.`,
        });
      }
    }
  });

  if (strengths.length === 0) {
    strengths.push('Tinh thần nỗ lực hoàn thành trọn vẹn bài thi đúng thời gian quy định.');
  }

  let overall = '';
  let gradePrediction = '';
  if (score >= 9.0) {
    overall = `Xuất sắc! Bạn đã đạt ${score} điểm môn ${subject === 'math' ? 'Toán' : 'Tiếng Anh'}, hoàn toàn làm chủ kiến thức và đạt phong độ sẵn sàng thi vào các trường THPT Chuyên hoặc Top 1.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 9.0 - 9.75 (Tỷ lệ đỗ NV1: >95%)`;
  } else if (score >= 8.0) {
    overall = `Rất tốt! Điểm số ${score} cho thấy nền tảng môn ${subject === 'math' ? 'Toán' : 'Tiếng Anh'} của bạn rất vững vàng, đang tiệm cận mức điểm thi vào các trường THPT chất lượng cao.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 8.0 - 8.75 (Tỷ lệ đỗ NV1: ~88%)`;
  } else if (score >= 6.5) {
    overall = `Khá ổn! Bạn đạt ${score} điểm. Bạn đã nắm chắc các câu cơ bản nhưng còn vấp phải một số bẫy câu phân loại và bài toán nâng cao.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 6.5 - 7.5 (Cần bứt phá thêm để chắc suất NV1)`;
  } else {
    overall = `Bạn đạt ${score} điểm. Cần tập trung ôn luyện lại các chuyên đề nền tảng trước khi giải thêm đề tổng hợp.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 5.5 - 6.5 (Cần kế hoạch ôn luyện tập trung)`;
  }

  let timeComment = '';
  if (timeSpentMinutes <= timeLimitMinutes * 0.6) {
    timeComment = `Bạn làm bài rất nhanh (${timeSpentMinutes}/${timeLimitMinutes} phút). Hãy chú ý đọc kỹ từng câu và rà soát lại các câu bẫy trước khi nộp để tránh mất điểm đáng tiếc.`;
  } else if (timeSpentMinutes >= timeLimitMinutes * 0.95) {
    timeComment = `Bạn dùng gần hết thời gian (${timeSpentMinutes}/${timeLimitMinutes} phút). Nên rèn thêm phản xạ làm nhanh các câu nhận biết để dành nhiều thời gian cho các câu phân loại.`;
  } else {
    timeComment = `Tốc độ phân bổ thời gian hợp lý (${timeSpentMinutes}/${timeLimitMinutes} phút).`;
  }

  const actionPlan = [
    'Mở Sổ câu sai để đọc kỹ phần giải thích chi tiết và ghi nhớ công thức của các câu vừa làm sai.',
    weaknesses.length > 0
      ? `Tập trung luyện chuyên đề "${weaknesses[0].topicName}" để vá lỗ hổng kiến thức ngay trong tuần này.`
      : 'Tiếp tục luyện thêm 1 đề thi thử mới để duy trì cảm giác phòng thi.',
    subject === 'math'
      ? 'Luôn kiểm tra điều kiện xác định và đối chiếu nghiệm trước khi kết luận.'
      : 'Áp dụng quy tắc loại trừ đáp án sai rõ ràng trước khi chọn đáp án cuối cùng.',
  ];

  return {
    overallAssessment: overall,
    gradePrediction,
    strengths,
    weaknesses,
    actionPlan,
    timeManagementComment: timeComment,
    examTacticsTip:
      subject === 'math'
        ? 'Chiến thuật làm bài thi môn Toán: Làm phần Căn thức & Hệ PT trước (15 phút) -> Hàm số & Vi-ét (20 phút) -> Hình học ý a, b & Toán thực tế (35 phút) -> Soát lại bài và thử câu 10 điểm BĐT.'
        : 'Chiến thuật phòng thi: Làm phần Ngữ âm & Trọng âm trước (5 phút) -> Câu ngắn từ vựng/ngữ pháp (15 phút) -> Bài đọc & Viết lại câu (25 phút) -> 10 phút cuối soát lại toàn bộ phiếu trả lời.',
  };
}

/**
 * Đánh giá chuyên sâu và cá nhân hóa bằng Gemini AI
 */
export async function generateExamEvaluationWithAI(
  apiKey: string,
  examTitle: string,
  score: number,
  totalQuestions: number,
  timeSpentSeconds: number,
  topicBreakdown: Record<string, { total: number; correct: number; wrong: number; name: string }>,
  wrongQuestionsList: { content: string; userChoice: string; correctChoice: string; topic: string; explanation: string }[],
  targetScore: number = 8.5,
  modelName: string = 'gemini-3.6-flash',
  subject: SubjectId = 'english'
): Promise<ExamEvaluationReport> {
  const effectiveKey = apiKey.trim() || getStoredApiKey();
  if (!effectiveKey) {
    throw new Error('Chưa cung cấp Gemini API Key.');
  }

  const prompt = `Bạn là một chuyên gia khảo thí và cố vấn học tập luyện thi môn ${subject === 'math' ? 'Toán' : 'Tiếng Anh'} vào lớp 10 THPT.
Hãy phân tích kết quả bài làm sau của một học sinh và đưa ra báo cáo đánh giá năng lực chi tiết, chỉ ra chính xác các lỗ hổng kiến thức và lộ trình khắc phục điểm yếu.

THÔNG TIN BÀI THI:
- Đề thi: ${examTitle}
- Môn: ${subject === 'math' ? 'Toán học' : 'Tiếng Anh'}
- Điểm số đạt được: ${score}/10 (Số câu đúng: ${totalQuestions - wrongQuestionsList.length}/${totalQuestions})
- Thời gian làm bài: ${Math.round(timeSpentSeconds / 60)} phút
- Mục tiêu điểm của học sinh: ${targetScore}/10

THỐNG KÊ KẾT QUẢ THEO TỪNG CHUYÊN ĐỀ:
${Object.entries(topicBreakdown)
      .map(([_, v]) => `- ${v.name}: Đúng ${v.correct}/${v.total} câu (${Math.round((v.correct / (v.total || 1)) * 100)}%)`)
      .join('\n')}

DANH SÁCH CÁC CÂU LÀM SAI VÀ LÝ DO:
${wrongQuestionsList
      .slice(0, 10)
      .map(
        (q, i) =>
          `${i + 1}. [Chủ đề: ${q.topic}] Câu: "${q.content}" | Học sinh chọn sai: "${q.userChoice}" | Đáp án đúng: "${q.correctChoice}" | Lời giải: "${q.explanation}"`
      )
      .join('\n')}

YÊU CẦU ĐẦU RA (JSON FORMAT):
Bạn PHẢI trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc thêm văn bản giải thích:
{
  "overallAssessment": "Nhận xét tổng quan toàn diện về năng lực, mức độ nắm vững kiến thức so với mục tiêu ${targetScore}đ",
  "gradePrediction": "Dự đoán dải điểm thi vào lớp 10 thực tế và khả năng đỗ NV1",
  "strengths": [
    "Điểm mạnh 1 (các dạng câu hoặc kỹ năng học sinh xử lý tốt)",
    "Điểm mạnh 2"
  ],
  "weaknesses": [
    {
      "topicName": "Tên phần kiến thức bị hổng",
      "issue": "Mô tả cụ thể lỗi sai hay mắc phải và bẫy bị lừa",
      "solution": "Cách khắc phục và mẹo ghi nhớ ngắn gọn"
    }
  ],
  "actionPlan": [
    "Bước 1 trong lộ trình cải thiện điểm số tuần này",
    "Bước 2",
    "Bước 3"
  ],
  "timeManagementComment": "Nhận xét về tốc độ làm bài và phân bổ thời gian",
  "examTacticsTip": "Mẹo chiến thuật làm bài thi thực tế để không bị mất điểm oan"
}`;

  const result = await callGeminiApiWithFallback(
    effectiveKey,
    modelName,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    }
  );

  const rawText = result.text;
  if (!rawText) {
    throw new Error('Không nhận được phản hồi đánh giá từ AI.');
  }

  let parsed: ExamEvaluationReport;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  }

  return parsed;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACT QUESTIONS FROM UPLOADED FILE TEXT (Admin Upload Feature)
// ═══════════════════════════════════════════════════════════════

export interface ExtractedExamResult {
  exam: Exam;
  questions: Question[];
  rawQuestionCount: number;
}

/**
 * 1. Tiền xử lý văn bản đề thi (chỉ làm sạch khoảng trắng cơ bản, không cắt xén cấu trúc)
 */
export function cleanAndNormalizeExamText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * 2. Trích xuất Đề Thi 100% bằng Gemini AI thuần túy (Không dùng bất kỳ regex cắt câu nào)
 */
export async function extractQuestionsFromText(
  apiKey: string,
  rawText: string,
  subject: SubjectId,
  examTitle: string,
  onProgress?: (msg: string) => void,
  modelName: string = 'gemini-3.6-flash'
): Promise<ExtractedExamResult> {
  const effectiveKey = (apiKey || '').trim() || getStoredApiKey();
  if (!effectiveKey) {
    throw new Error('Chưa có Gemini API Key. Vui lòng kiểm tra cấu hình API Key trong hệ thống.');
  }

  if (!rawText || rawText.trim().length < 30) {
    throw new Error('Nội dung file quá ngắn hoặc trống. Vui lòng kiểm tra lại file.');
  }

  onProgress?.('🤖 Đang gửi toàn bộ tài liệu đề thi tới Gemini AI để phân tích và số hóa...');

  const cleanedText = cleanAndNormalizeExamText(rawText);
  const topicIds = subject === 'math'
    ? 'math_can_thuc | math_he_phuong_trinh | math_ham_so_do_thi | math_pt_bac_hai_viet | math_giai_toan_lap_pt | math_he_thuc_luong | math_duong_tron_tu_giac | math_hinh_khong_gian_thuc_te | math_bat_dang_thuc_cuc_tri'
    : 'pronunciation | stress | grammar | vocabulary | reading | cloze | sentence_rewrite | error_identification';

  const prompt = `Bạn là chuyên gia khảo thí và số hóa đề thi tuyển sinh vào lớp 10 THPT môn ${subject === 'math' ? 'Toán' : 'Tiếng Anh'}.

NHIỆM VỤ:
Đọc hiểu toàn bộ văn bản đề thi dưới đây, bóc tách ĐẦY ĐỦ 100% TẤT CẢ các câu hỏi trắc nghiệm thành định dạng JSON chuẩn.

VĂN BẢN ĐỀ THI GỐC:
---
${cleanedText}
---

YÊU CẦU BẮT BUỘC:
1. TRÍCH XUẤT ĐẦY ĐỦ 100% TẤT CẢ CÂU HỎI: Không được bỏ sót, không được cắt bớt hay tóm tắt. Nếu đề có 40 câu hỏi, phải trả về đủ 40 câu trong mảng "questions".
2. BÀI ĐỌC (PASSAGE):
   - Nếu là dạng bài Đọc hiểu (Reading) hoặc Điền từ (Cloze Test), hãy đưa nội dung đoạn văn bài đọc vào trường "passage" của các câu hỏi thuộc bài đọc đó.
   - Đối với câu đơn lẻ (phát âm, trọng âm, ngữ pháp...): để "passage" là null hoặc chuỗi rỗng.
3. PHƯƠNG ÁN LỰA CHỌN:
   - Mỗi câu hỏi BẮT BUỘC có đủ 4 phương án trong mảng "options" theo định dạng: ["A. ...", "B. ...", "C. ...", "D. ..."].
4. ĐỐI CHIẾU ĐÁP ÁN:
   - Tra cứu bảng đáp án ở cuối văn bản để gán chính xác "correctOption" (0=A, 1=B, 2=C, 3=D).
5. SƯ PHẠM:
   - Phân loại "topicId" phù hợp từ: ${topicIds}.
   - Tạo "explanation" ngắn gọn 1-2 câu giải thích vì sao đáp án đúng, "grammarRule" (công thức/quy tắc), và "commonMistakeTip" (bẫy đề).

ĐỊNH DẠNG JSON TRẢ VỀ (DUY NHẤT 1 CHUỖI JSON HỢP LỆ):
{
  "questions": [
    {
      "topicId": "Chọn phù hợp từ danh sách chuyên đề",
      "subTopicId": "general",
      "difficulty": "easy | medium | hard",
      "passage": "Nội dung bài đọc nếu có (hoặc để trống)",
      "content": "Nội dung câu hỏi đầy đủ",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": 0,
      "explanation": "Lời giải chi tiết sư phạm",
      "grammarRule": "Quy tắc ngữ pháp / Công thức cốt lõi",
      "commonMistakeTip": "Bẫy đề thi cần lưu ý"
    }
  ]
}`;

  onProgress?.('🧠 Gemini AI đang đọc hiểu từng câu hỏi, bài đọc và bảng đáp án...');

  const result = await callGeminiApiWithFallback(
    effectiveKey,
    modelName,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    },
    onProgress
  );

  const rawJson = result.text;
  if (!rawJson) {
    throw new Error('Gemini AI không trả về dữ liệu. Vui lòng thử lại.');
  }

  const parsed = tryParseOrRepairExamJson(rawJson);
  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Không thể phân tích dữ liệu JSON trả về từ Gemini AI. Vui lòng thử lại.');
  }

  onProgress?.(`✨ Gemini AI đã bóc tách thành công ${parsed.questions.length} câu hỏi. Đang lưu đề thi...`);

  // Chuẩn hóa và tạo ID
  const examId = `admin_upload_${Date.now()}`;
  const questionIds: string[] = [];

  const questions: Question[] = parsed.questions.map((q: any, idx: number) => {
    const qId = `q_upload_${Date.now()}_${idx + 1}`;
    questionIds.push(qId);
    const qNum = idx + 1;

    let opts = Array.isArray(q.options) && q.options.length >= 4 ? q.options : ['A. ', 'B. ', 'C. ', 'D. '];
    opts = opts.slice(0, 4).map((opt: string, optIdx: number) => {
      const prefix = ['A. ', 'B. ', 'C. ', 'D. '][optIdx];
      const cleanOpt = (opt || '').trim();
      if (/^[A-D]\.\s*/i.test(cleanOpt)) return cleanOpt;
      return `${prefix}${cleanOpt}`;
    });

    const correctOpt =
      typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
        ? q.correctOption
        : 0;

    return {
      id: qId,
      subject,
      topicId: q.topicId || (subject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar'),
      subTopicId: q.subTopicId || 'general',
      difficulty: q.difficulty || (qNum > 30 ? 'hard' : qNum > 15 ? 'medium' : 'easy'),
      passage: q.passage && q.passage.trim() ? q.passage.trim() : undefined,
      content: q.content || `Câu hỏi số ${qNum}`,
      options: opts,
      correctOption: correctOpt,
      explanation: q.explanation || `Đáp án đúng là ${['A', 'B', 'C', 'D'][correctOpt]}.`,
      grammarRule: q.grammarRule || '',
      commonMistakeTip: q.commonMistakeTip || '',
    };
  });

  const exam: Exam = {
    id: examId,
    subject,
    title: examTitle || `Đề Thi Upload - ${new Date().toLocaleDateString('vi-VN')}`,
    code: `UPLOAD-${subject.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    description: `Đề thi gồm đầy đủ ${questions.length} câu hỏi được phân tích và trích xuất hoàn chỉnh bởi Gemini AI.`,
    timeLimitMinutes: questions.length <= 20 ? 45 : questions.length <= 40 ? 60 : 90,
    totalQuestions: questions.length,
    difficulty: 'standard',
    questionIds,
    isOfficialFormat: false,
    createdAt: new Date().toISOString().split('T')[0],
    creatorUserId: 'user_admin_1',
  };

  return { exam, questions, rawQuestionCount: questions.length };
}

// ═════════════════════════════════════════════════════════════
// 6. AI STEP-BY-STEP EXPLAINER (Hỏi AI Gia Sư Từng Câu)
// ═════════════════════════════════════════════════════════════

export interface AiQuestionExplanation {
  approachMethod: string;
  stepByStepSolution: string[];
  trapAnalysis: string;
  coreRuleOrFormula: string;
  encouragement: string;
}

/**
 * Ask AI Tutor to explain a question step-by-step for a Grade 9 student
 */
export async function explainQuestionWithAI(
  apiKey: string,
  question: Question,
  userSelectedOption?: number,
  onProgress?: (msg: string) => void,
  modelName: string = 'gemini-3.6-flash'
): Promise<AiQuestionExplanation> {
  const effectiveKey = (apiKey || '').trim() || getStoredApiKey();
  if (!effectiveKey) throw new Error('Chưa có Gemini API Key.');

  const isMath = question.subject === 'math';
  const optLabels = ['A', 'B', 'C', 'D'];
  const correctLabel = optLabels[question.correctOption] || 'A';
  const userLabel =
    userSelectedOption !== undefined && userSelectedOption >= 0 ? optLabels[userSelectedOption] : null;

  const prompt = `Bạn là một Thầy/Cô giáo luyện thi vào Lớp 10 (Toán & Tiếng Anh) cực kỳ tận tâm, dễ hiểu, vui tính và truyền cảm hứng.
Hãy giảng giải câu hỏi sau đây một cách chi tiết, từng bước (Step-by-Step) cho một học sinh lớp 9:

MÔN HỌC: ${isMath ? 'Toán 9 vào 10' : 'Tiếng Anh 9 vào 10'}
CHUYÊN ĐỀ: ${question.topicId}
${question.passage ? `ĐOẠN VĂN/BỐI CẢNH:\n"${question.passage}"\n` : ''}
CÂU HỎI:
${question.content}

CÁC PHƯƠNG ÁN LỰA CHỌN:
${question.options.map((opt, i) => `${optLabels[i]}. ${opt}`).join('\n')}

ĐÁP ÁN ĐÚNG: ${correctLabel}. ${question.options[question.correctOption]}
${userLabel ? `HỌC SINH ĐÃ CHỌN: ${userLabel}. ${question.options[userSelectedOption!]}` : 'HỌC SINH CHƯA LÀM HOẶC LÀM SAI'}
GHI CHÚ ĐỊNH LÝ CÓ SẴN: ${question.grammarRule || ''}
LƯU Ý BẪY CÓ SẴN: ${question.commonMistakeTip || ''}

YÊU CẦU ĐẦU RA JSON:
Hãy trả về DUY NHẤT một chuỗi JSON thuần túy (không kèm markdown \`\`\`json) theo đúng cấu trúc sau:
{
  "approachMethod": "Tên dạng bài và hướng tư duy ban đầu (1-2 câu ngắn gọn, dễ nhớ)",
  "stepByStepSolution": [
    "Bước 1: ...",
    "Bước 2: ...",
    "Bước 3: ..."
  ],
  "trapAnalysis": "Phân tích vì sao học sinh hay bị lừa ở các phương án khác, chỉ rõ bẫy đề thi ở đâu",
  "coreRuleOrFormula": "Công thức / Mẹo vàng cốt lõi cần thuộc lòng",
  "encouragement": "Lời động viên ngắn gọn, truyền động lực cho học sinh"
}`;

  const result = await callGeminiApiWithFallback(
    effectiveKey,
    modelName,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    },
    onProgress
  );

  try {
    const text = result.text.trim();
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    return {
      approachMethod: `Dạng bài: ${question.topicId.replace('math_', '').replace(/_/g, ' ')}`,
      stepByStepSolution: [
        `Đáp án đúng là ${correctLabel}: ${question.options[question.correctOption]}`,
        question.explanation || 'Phân tích kỹ đề bài và áp dụng quy tắc cơ bản.',
      ],
      trapAnalysis: question.commonMistakeTip || 'Học sinh dễ nhầm lẫn do đọc không kỹ đề hoặc áp dụng sai công thức.',
      coreRuleOrFormula: question.grammarRule || 'Nắm vững kiến thức trọng tâm trong sách giáo khoa.',
      encouragement: 'Đừng nản lòng! Làm lại câu này vào ngày mai em nhé!',
    };
  }
}

