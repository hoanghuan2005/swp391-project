const fs = require('fs');
const path = require('path');

async function run() {
  // 1. Download sample.pdf
  const pdfUrl = 'https://res.cloudinary.com/demo/image/upload/sample.pdf';
  console.log('Downloading sample PDF...');
  const pdfRes = await fetch(pdfUrl);
  if (!pdfRes.ok) {
    throw new Error('Failed to download sample PDF');
  }
  const buffer = await pdfRes.arrayBuffer();
  const pdfBuffer = Buffer.from(buffer);
  
  // 2. Login
  console.log('Logging in...');
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hoanghuan@example.com', password: 'hoanghuan123' })
  });
  const { accessToken } = await loginRes.json();
  
  // 3. Upload document
  console.log('Uploading document...');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  // Build raw multipart form-data body
  const filename = 'sample_uploaded.pdf';
  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`,
    pdfBuffer,
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nSample Uploaded PDF\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="visibility"\r\n\r\nPRIVATE\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="courseCode"\r\n\r\nSWP391\r\n`,
    `--${boundary}--\r\n`
  ];
  
  // Concatenate parts
  let bodyLength = 0;
  for (const part of parts) {
    bodyLength += typeof part === 'string' ? Buffer.byteLength(part) : part.length;
  }
  
  const bodyBuffer = Buffer.alloc(bodyLength);
  let offset = 0;
  for (const part of parts) {
    if (typeof part === 'string') {
      bodyBuffer.write(part, offset);
      offset += Buffer.byteLength(part);
    } else {
      part.copy(bodyBuffer, offset);
      offset += part.length;
    }
  }

  const uploadRes = await fetch('http://localhost:8080/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: bodyBuffer
  });
  
  console.log('Upload status:', uploadRes.status);
  const uploadData = await uploadRes.json();
  console.log('Upload response:', uploadData);
  
  const docId = uploadData.id;
  if (!docId) {
    console.error('No docId returned');
    return;
  }

  // 4. Poll status
  console.log('Polling document status...');
  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusRes = await fetch(`http://localhost:8080/api/documents/${docId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const statusData = await statusRes.json();
    console.log(`Poll #${i+1} status:`, statusData.aiParseStatus);
    if (statusData.aiParseStatus === 'READY' || statusData.aiParseStatus === 'FAILED') {
      break;
    }
  }

  // 5. Check if document has chunks
  console.log('Checking chunks for document:', docId);
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
}

run().catch(console.error);
