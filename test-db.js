const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_b1faTB8iUwPq@ep-lingering-water-adx3plvz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  
  await client.connect();
  
  const docs = await client.query("SELECT COUNT(*) FROM documents");
  console.log("Documents count:", docs.rows[0].count);
  
  const chunks = await client.query("SELECT COUNT(*) FROM document_chunks");
  console.log("Document chunks count:", chunks.rows[0].count);
  
  const pgVectorStatus = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
  console.log("pgvector extension installed:", pgVectorStatus.rows.length > 0);

  if (chunks.rows[0].count > 0) {
    const chunkSample = await client.query("SELECT id, document_id, substring(content, 1, 50) as content, embedding FROM document_chunks LIMIT 1");
    console.log("Chunk sample:", chunkSample.rows[0]);
  }

  await client.end();
}

test().catch(console.error);
