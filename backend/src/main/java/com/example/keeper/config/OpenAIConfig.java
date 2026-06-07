package com.example.keeper.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAIConfig {

    @Bean
    public String openAiApiKey() {
        return System.getenv("OPENAI_API_KEY");
    }
}
