import React, { useState } from 'react';
import './AIFlashcard.css';
import axios from 'axios';

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
            // Lấy token từ localStorage (kiểm tra lại xem project của bạn lưu token dưới tên gì nhé, thường là 'token' hoặc 'accessToken')
            const token = localStorage.getItem('token');

            // Gọi API bằng axios thay cho fetch
            const response = await axios.post('http://localhost:8080/api/ai/flashcards/generate', 
                { content: inputText },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    }
                }
            );

            // Axios tự động parse JSON và ném dữ liệu vào response.data
            const apiResponse = response.data;

            // Map data từ API vào State để hiển thị thẻ
            setFlashcards(apiResponse);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error("Lỗi khi tạo flashcard:", error);
            // Log thêm chi tiết lỗi từ backend (nếu có) để dễ debug
            if (error.response) {
                console.error("Chi tiết lỗi từ Backend:", error.response.data);
            }
            alert("Có lỗi xảy ra khi kết nối tới AI. Vui lòng thử lại!");
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