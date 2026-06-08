# Tích hợp Vector Search (RAG) cho AI Ask, Quiz và Flashcards

Hiện tại, chức năng AI Ask và AI Quiz đang lấy các đoạn văn bản (chunks) từ tài liệu một cách tuần tự (naive extraction) hoặc so khớp từ khoá cơ bản (keyword matching). Vì chúng ta đã có sẵn Vector Embeddings (dùng pgvector/Jina) được tạo ra lúc upload tài liệu, chúng ta nên tận dụng nó để tìm kiếm ngữ nghĩa (Semantic Search), giúp AI trả lời chính xác hơn dựa trên câu hỏi của người dùng.

## Proposed Changes

### 1. Cập nhật Repository
#### [MODIFY] [DocumentChunkRepository.java](file:///d:/SWP391/backend/src/main/java/com/example/keeper/systems/ai_ask/repository/DocumentChunkRepository.java)
- Thêm các native query cho phép tìm kiếm chunks gần nhất (sử dụng toán tử `<->` của pgvector) nhưng có kết hợp `WHERE document_id = ?` để chỉ tìm trong phạm vi tài liệu hoặc project mà người dùng đang thao tác.
```java
@Query(value = "SELECT * FROM document_chunks WHERE document_id = :documentId ORDER BY embedding <-> :queryEmbedding LIMIT :limit", nativeQuery = true)
List<DocumentChunk> findSimilarChunksByDocumentId(...);

@Query(value = "SELECT * FROM document_chunks WHERE document_id IN :documentIds ORDER BY embedding <-> cast(:queryEmbedding as vector) LIMIT :limit", nativeQuery = true)
List<DocumentChunk> findSimilarChunksByDocumentIds(...);
```

### 2. Cập nhật AI Ask
#### [MODIFY] [AiAskServiceImpl.java](file:///d:/SWP391/backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java)
- Inject `EmbeddingService`.
- Khi người dùng đặt câu hỏi, sử dụng `EmbeddingService.embed(request.getMessage())` để tạo vector cho câu hỏi.
- Dùng vector này query lấy top 10-15 chunks liên quan nhất từ Database.
- Đưa các chunks này vào Prompt cho Groq AI để trả lời. (Loại bỏ hàm `selectRelevantChunks` cũ bằng keyword matching).

### 3. Cập nhật AI Quiz
#### [MODIFY] [QuizGeneratorServiceImpl.java](file:///d:/SWP391/backend/src/main/java/com/example/keeper/systems/ai_quiz/service/impl/QuizGeneratorServiceImpl.java)
- Inject `EmbeddingService`.
- Khi người dùng muốn tạo Quiz (với một chủ đề/topic cụ thể), tạo vector cho `request.getTopic()`.
- Tìm các chunks liên quan nhất đến topic đó và gửi cho AI thay vì lấy 20.000 ký tự đầu tiên của tài liệu.

### 4. Cập nhật AI Flashcards
#### [MODIFY] [AiFlashcardService.java](file:///d:/SWP391/backend/src/main/java/com/example/keeper/systems/ai_flashcard/service/AiFlashcardService.java)
- Inject `EmbeddingService`.
- Thay vì lấy toàn bộ 30.000 ký tự đầu của tài liệu, ta sẽ tạo một câu truy vấn mặc định như: *"key concepts, terms, and important definitions"* và lấy vector của câu này.
- Dùng vector tìm ra các chunks chứa nhiều định nghĩa/thuật ngữ nhất trong tài liệu để đưa cho AI tạo Flashcards.

## User Review Required

> [!IMPORTANT]  
> Bạn có đồng ý với việc dùng query mặc định *"key concepts, terms, and important definitions"* để tìm chunks cho **Flashcard** không? Vì giao diện Flashcard hiện tại không có chỗ để người dùng nhập "chủ đề" giống như Quiz.
> 
> Vui lòng duyệt plan này, sau đó mình sẽ tiến hành refactor phía Backend!
