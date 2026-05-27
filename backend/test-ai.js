require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Groq = require('groq-sdk'); // Đã chuyển sang dùng Groq

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Khớp đúng với địa chỉ Frontend của ông
  credentials: true // Cho phép truyền dữ liệu bảo mật qua lại
}));

app.use(express.json());

// Cấu hình Multer lưu file vào bộ nhớ tạm (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn file 10MB
});

// Khởi tạo Groq AI từ biến môi trường
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Hàm bổ trợ: Trích xuất chữ (text) từ file
 */
async function extractTextFromFile(file) {
  const mimeType = file.mimetype;

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  } 
  
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return data.value;
  } 
  
  if (mimeType === 'text/plain') {
    return file.buffer.toString('utf-8');
  }

  throw new Error('Định dạng file không được hỗ trợ. Chỉ nhận PDF, DOCX, TXT.');
}

/**
 * Hàm bổ trợ: Gửi text qua GROQ AI và bắt ép trả về JSON cấu trúc Flashcard
 */
async function generateFlashcardsWithAI(text) {
  const prompt = `
    Bạn là một trợ lý giáo dục AI chuyên nghiệp. Hãy đọc kỹ đoạn văn bản tài liệu học tập sau đây và tạo ra danh sách các thẻ flashcard (tối đa 15 thẻ).
    Mỗi thẻ flashcard phải bao gồm một câu hỏi ngắn gọn, trọng tâm ở mặt trước (question) và câu trả lời chính xác, cô đọng ở mặt sau (answer).

    YÊU CẦU BẮT BUỘC: Trả về ĐÚNG MỘT MẢNG JSON THUẦN TÚY. Không giải thích, không dùng markdown code block (\`\`\`json).
    Cấu trúc bắt buộc:
    [
      { "question": "Câu hỏi 1...", "answer": "Câu trả lời ngắn gọn 1..." },
      { "question": "Câu hỏi 2...", "answer": "Câu trả lời ngắn gọn 2..." }
    ]

    Nội dung tài liệu:
    ${text}
  `;

  // Gọi API của Groq (Dùng model llama3 cực nhanh và thông minh)
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama3-8b-8192", // Ông có thể đổi thành "llama3-70b-8192" nếu muốn nó thông minh hơn nữa
    temperature: 0.3,
  });

  let responseText = chatCompletion.choices[0]?.message?.content || "";
  
  // Dọn rác markdown nếu AI lỡ tay sinh ra
  responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  // Parse chuỗi chữ trả về từ AI thành JSON
  return JSON.parse(responseText);
}

/**
 * API Endpoint: Nhận file, đọc file và gọi AI tạo flashcard
 */
app.post('/api/flashcards/generate-from-file', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng upload một file tài liệu (PDF, DOCX, TXT).' });
    }

    // Bước 1: Đọc chữ từ file
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(req.file);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ error: 'Tài liệu quá ngắn hoặc không có chữ để AI đọc.' });
    }

    // Bước 2: Truyền text vào AI để bóc tách flashcard
    const flashcards = await generateFlashcardsWithAI(extractedText);

    // Bước 3: Trả dữ liệu về
    return res.json({
      success: true,
      fileName: req.file.originalname,
      total: flashcards.length,
      data: flashcards
    });

  } catch (error) {
    console.error('Lỗi xử lý hệ thống:', error);
    return res.status(500).json({ 
      error: 'Có lỗi xảy ra khi AI phân tích tài liệu. Hãy thử lại file khác!' 
    });
  }
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Groq đang chạy mượt mà tại port: ${PORT}`);
});