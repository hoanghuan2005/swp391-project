import React, { useState } from 'react';
import axiosClient from '../../../api/axiosClient';
import { Loader2, Sparkles, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

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
            const response = await axiosClient.post('/api/ai/flashcards/generate', 
                { content: inputText }
            );

            const data = response.data.data || response.data; 
            if (Array.isArray(data) && data.length > 0) {
                setFlashcards(data);
                setCurrentIndex(0);
                setIsFlipped(false);
            } else {
                alert("Không tạo được flashcard nào!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi xảy ra, kiểm tra console!");
        } finally {
            setIsLoading(false);
        }
    };

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
        <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <Sparkles className="text-orange-500" /> AI Flashcard Generator
                </h2>
                <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                    placeholder="Dán nội dung bài học vào đây..."
                    rows={5}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                    onClick={handleGenerateCards} 
                    disabled={isLoading}
                    className="mt-4 w-full bg-[#f26522] text-white py-3 rounded-xl font-medium hover:bg-[#d95316] transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? <><Loader2 className="animate-spin" /> Đang tạo...</> : 'Tạo Flashcards'}
                </button>
            </div>

            {/* Viewer Section */}
            {flashcards.length > 0 && (
                <div className="flex flex-col items-center gap-6">
                    <p className="text-sm font-medium text-slate-500">Thẻ {currentIndex + 1} / {flashcards.length}</p>
                    
                    {/* Card Flip Component */}
                    <div className="w-full h-64 cursor-pointer group perspective" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                            <div className="absolute w-full h-full backface-hidden bg-white p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-bold text-slate-800">{flashcards[currentIndex]?.term}</h3>
                                <p className="text-xs text-slate-400 mt-4 italic">Click để lật thẻ</p>
                            </div>
                            <div className="absolute w-full h-full backface-hidden bg-orange-50 p-8 rounded-2xl border border-orange-100 shadow-md flex items-center justify-center text-center rotate-y-180">
                                <p className="text-lg text-slate-700">{flashcards[currentIndex]?.definition}</p>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        <button onClick={() => changeCard(-1)} className="p-3 bg-white rounded-full shadow border hover:bg-slate-50"><ChevronLeft /></button>
                        <button onClick={() => changeCard(1)} className="p-3 bg-white rounded-full shadow border hover:bg-slate-50"><ChevronRight /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIFlashcard;