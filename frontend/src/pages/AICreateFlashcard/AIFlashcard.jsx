import React, { useState } from 'react';
import './AIFlashcard.css';

const AIFlashcard = () => {
  const [inputText, setInputText] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerateCards = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setFlashcards([]); 
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data
      const apiResponse = [
        { id: 1, term: 'Supply Chain Management', definition: 'Quản trị chuỗi cung ứng: Quản lý luồng hàng hóa và dịch vụ từ điểm xuất phát đến điểm tiêu thụ.' },
        { id: 2, term: 'SCOR Model', definition: 'Mô hình tham chiếu hoạt động chuỗi cung ứng, bao gồm: Plan, Source, Make, Deliver, Return, Enable.' },
        { id: 3, term: 'Brand Identity', definition: 'Bộ nhận diện thương hiệu: Cách một doanh nghiệp muốn khách hàng nhìn nhận về mình.' }
      ];
      
      setFlashcards(apiResponse);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error("Lỗi khi tạo flashcard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150); 
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  return (
    <div className="ai-flashcard-container">
      <h2 className="title">AI Flashcard Generator</h2>
      
      <div className="input-section">
        <textarea
          placeholder="Dán nội dung bài học, thuật ngữ hoặc ý chính vào đây. AI sẽ tự động trích xuất và tạo Flashcard cho bạn..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          className="content-input"
        />
        <button 
          onClick={handleGenerateCards} 
          disabled={isLoading || !inputText}
          className="generate-btn"
        >
          {isLoading ? 'AI Đang tạo thẻ...' : '✨ Tạo Flashcards'}
        </button>
      </div>

      {flashcards.length > 0 && (
        <div className="flashcard-viewer">
          <div className="card-progress">
            Thẻ {currentIndex + 1} / {flashcards.length}
          </div>
          
          <div 
            className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <h3>{flashcards[currentIndex].term}</h3>
                <span className="hint-text">Click để lật</span>
              </div>
              <div className="flashcard-back">
                <p>{flashcards[currentIndex].definition}</p>
              </div>
            </div>
          </div>

          <div className="card-controls">
            <button onClick={prevCard} className="control-btn">⬅ Trước</button>
            <button onClick={nextCard} className="control-btn">Sau ➡</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFlashcard;