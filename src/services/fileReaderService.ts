/**
 * fileReaderService.ts
 * Doc noi dung file bat ky va tra ve text de AI xu ly.
 * Ho tro: .txt, .md, .pdf, .docx, anh (jpg/png/webp/gif)
 */

import { getStoredApiKey } from './aiExamService';

export type SupportedFileType = 'text' | 'pdf' | 'docx' | 'image';

export function detectFileType(file: File): SupportedFileType {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/.test(name)) return 'image';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  return 'text';
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => reject(new Error('Khong doc duoc file text.'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function readPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ').replace(/\s+/g, ' ').trim();
    texts.push(pageText);
  }
  return texts.join('\n\n');
}

async function readDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

async function readImageWithOcr(file: File, onProgress?: (msg: string) => void): Promise<string> {
  onProgress?.('📷 Đang OCR ảnh đề thi bằng Gemini Vision...');
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error('Cần có Gemini API Key để đọc ảnh. Vui lòng cấu hình API Key trong hệ thống.');
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              data: base64,
            },
          },
          {
            text: 'Đây là ảnh chụp một đề thi trắc nghiệm. Hãy nhận dạng và ghi lại TOÀN BỘ nội dung văn bản trong ảnh, giữ nguyên cấu trúc câu hỏi và các đáp án A, B, C, D. Không thêm bất kỳ giải thích nào, chỉ ghi lại text như đã in trong đề.',
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
  };

  const { callGeminiApiWithFallback } = await import('./aiExamService');
  const result = await callGeminiApiWithFallback(apiKey, 'gemini-3.5-flash-lite', payload, onProgress);
  if (!result.text) throw new Error('Gemini không nhận diện được nội dung trong ảnh.');
  return result.text;
}

export async function readFileAsText(file: File, onProgress?: (msg: string) => void): Promise<string> {
  const type = detectFileType(file);
  switch (type) {
    case 'text':
      onProgress?.('Doc file text...');
      return readAsText(file);
    case 'pdf':
      onProgress?.('Trich xuat text tu PDF...');
      try {
        const pdfText = await readPdf(file);
        if (pdfText.trim().length < 50) { onProgress?.('PDF khong co text, thu OCR...'); return readImageWithOcr(file, onProgress); }
        return pdfText;
      } catch { onProgress?.('Khong doc duoc PDF thuong, thu OCR...'); return readImageWithOcr(file, onProgress); }
    case 'docx':
      onProgress?.('Trich xuat text tu Word...');
      return readDocx(file);
    case 'image':
      return readImageWithOcr(file, onProgress);
    default:
      return readAsText(file);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(file: File): string {
  const type = detectFileType(file);
  switch (type) {
    case 'pdf': return '📕';
    case 'docx': return '📝';
    case 'image': return '🖼️';
    default: return '📄';
  }
}
