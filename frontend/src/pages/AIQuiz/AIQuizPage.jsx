import React, { useState } from 'react';
import AIFlashcard from '../AICreateFlashcard/AIFlashcard'; // Import flashcard component

const AIQuizPage = () => {
  const [activeView, setActiveView] = useState('menu');

  return (
    <div style={{ padding: '20px' }}>
      
      {/* MÀN HÌNH MENU CHÍNH */}
      {activeView === 'menu' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>AI Quiz & Flashcard Maker</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>Chọn công cụ bạn muốn sử dụng:</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button 
              onClick={() => setActiveView('quiz')}
              style={{ padding: '15px 30px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px' }}
            >
              📝 Tạo Bài Quiz (Coming Soon)
            </button>

            <button 
              onClick={() => setActiveView('flashcard')}
              style={{ padding: '15px 30px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#f26b3a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
            >
              🗂️ AI Create Flashcard
            </button>
          </div>
        </div>
      )}

      {/* MÀN HÌNH TẠO FLASHCARD */}
      {activeView === 'flashcard' && (
        <div>
          <button 
            onClick={() => setActiveView('menu')}
            style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white' }}
          >
            ⬅ Quay lại Menu
          </button>
          <AIFlashcard />
        </div>
      )}

      {/* MÀN HÌNH TẠO QUIZ (Giữ chỗ) */}
      {activeView === 'quiz' && (
        <div>
          <button 
            onClick={() => setActiveView('menu')}
            style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white' }}
          >
            ⬅ Quay lại Menu
          </button>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h3 style={{ fontSize: '20px', color: '#555' }}>Tính năng tạo Quiz trắc nghiệm đang được phát triển...</h3>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIQuizPage;