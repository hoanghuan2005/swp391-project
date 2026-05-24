package com.example.keeper.systems.ai_flashcard.dto;

public class FlashcardGenerateRequest {

    // Biến để hứng nội dung text từ React gửi lên
    private String content;

    // Hàm Getter (Controller sẽ gọi hàm này)
    public String getContent() {
        return content;
    }

    // Hàm Setter (Spring Boot tự động gọi để gán dữ liệu)
    public void setContent(String content) {
        this.content = content;
    }
}