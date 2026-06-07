package com.example.keeper.systems.ai_ask.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JinaEmbeddingClient {

    private final OkHttpClient client = new OkHttpClient();

    @Value("${jina.api.key}")
    private String apiKey;

    private static final String URL =
            "https://api.jina.ai/v1/embeddings";

    public float[] embed(String text) throws IOException {

        String escapedText =
                text.replace("\\", "\\\\")
                        .replace("\"", "\\\"");

        String json = """
        {
          "model":"jina-embeddings-v5-text-small",
          "task":"retrieval.query",
          "normalized":true,
          "input":[
            "%s"
          ]
        }
        """.formatted(escapedText);

        System.out.println("===== JINA REQUEST =====");
        System.out.println(json);

        Request request = new Request.Builder()
                .url(URL)
                .addHeader(
                        "Authorization",
                        "Bearer " + apiKey
                )
                .addHeader(
                        "Content-Type",
                        "application/json"
                )
                .post(
                        RequestBody.create(
                                json,
                                MediaType.get("application/json")
                        )
                )
                .build();

        try (Response response =
                     client.newCall(request).execute()) {

            String body =
                    response.body().string();

            System.out.println("===== JINA STATUS =====");
            System.out.println(response.code());

            System.out.println("===== JINA RESPONSE =====");
            System.out.println(body);

            if (!response.isSuccessful()) {
                throw new RuntimeException(
                        "Jina Error: " + body
                );
            }

            ObjectMapper mapper =
                    new ObjectMapper();

            JsonNode root =
                    mapper.readTree(body);

            JsonNode embeddingNode =
                    root.path("data")
                            .get(0)
                            .path("embedding");

            float[] vector =
                    new float[embeddingNode.size()];

            for (int i = 0; i < embeddingNode.size(); i++) {
                vector[i] =
                        embeddingNode.get(i)
                                .floatValue();
            }

            System.out.println(
                    "Embedding dimension = "
                            + vector.length
            );

            return vector;
        }
    }
}