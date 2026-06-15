const fs = require('fs');

async function check() {
  const url = 'https://res.cloudinary.com/df3kda9fc/raw/upload/v1781453552/documents/sample_uploaded-a46a9fc2-93a7-4a57-84a0-25cba5a0f9ad.pdf';
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  console.log('File size:', buffer.byteLength);
  
  // Check PDF signature: first 4 bytes must be %PDF
  const arr = new Uint8Array(buffer);
  const signature = String.fromCharCode(arr[0], arr[1], arr[2], arr[3]);
  console.log('PDF Signature:', signature);
}

check().catch(console.error);
