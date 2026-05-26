import React, { useState } from 'react';
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

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8080/api/ai/flashcards/generate', 
                { content: inputText },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Kiểm tra kỹ dữ liệu trước khi set state
            const data = response.data.data || response.data; 
            if (Array.isArray(data) && data.length > 0) {
                setFlashcards(data);
                setCurrentIndex(0);
                setIsFlipped(false);
            } else {
                alert("Không tạo được flashcard nào, hãy thử lại!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi xảy ra, kiểm tra console!");
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm điều hướng an toàn
    const changeCard = (direction) => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(prev => {
                const next = prev + direction;
                if (next < 0) return flashcards.length - 1;
                if (next >= flashcards.length) return 0;
                return next;
            });
        }, 300);
    };

    return (
        <div className="ai-flashcard-container">
            <h2 className="title">✨ AI Flashcard Generator</h2>

            <div className="input-section">
                <textarea
                    placeholder="Dán nội dung bài học..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="content-input"
                />
                <button onClick={handleGenerateCards} disabled={isLoading} className="generate-btn">
                    {isLoading ? 'Đang tạo...' : 'Tạo Flashcards'}
                </button>
            </div>

            {flashcards.length > 0 && (
                <div className="flashcard-viewer">
                    <p>Thẻ {currentIndex + 1} / {flashcards.length}</p>
                    
                    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                        <div className="flashcard-inner">
                            <div className="flashcard-front">
                                <h3>{flashcards[currentIndex]?.term}</h3>
                                <small>Click để lật</small>
                            </div>
                            <div className="flashcard-back">
                                <p>{flashcards[currentIndex]?.definition}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-controls">
                        <button onClick={() => changeCard(-1)}>⬅</button>
                        <button onClick={() => changeCard(1)}>➡</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIFlashcard;