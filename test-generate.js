// Using built-in fetch

async function run() {
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hoanghuan@example.com', password: 'hoanghuan123' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }
  
  const { accessToken } = await loginRes.json();
  console.log('Login successful. Token acquired.');

  // Let's get our documents
  const docsRes = await fetch('http://localhost:8080/api/ai_flashcard/my-documents', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const { data: docs } = await docsRes.json();
  console.log('My documents:', docs);

  if (docs && docs.length > 0) {
    const docId = docs[0].id;
    console.log('Using document ID:', docId);

    // Try generating flashcard
    console.log('Generating flashcards from document...');
    const flashRes = await fetch('http://localhost:8080/api/ai_flashcard/generate-from-document', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: docId })
    });
    console.log('Flashcard status:', flashRes.status);
    console.log('Flashcard response:', await flashRes.text());

    // Try generating quiz
    console.log('Generating quiz from document...');
    const quizRes = await fetch('http://localhost:8080/api/quizzes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "Test Quiz",
        documentId: docId,
        projectId: null,
        questionCount: 5,
        difficulty: "Medium",
        topic: "test"
      })
    });
    console.log('Quiz status:', quizRes.status);
    console.log('Quiz response:', await quizRes.text());
  } else {
    console.log('No documents found to test with.');
  }
}

run().catch(console.error);
