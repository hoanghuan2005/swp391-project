package com.example.keeper.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final ProjectChatWebSocketHandler projectChatWebSocketHandler;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler, ProjectChatWebSocketHandler projectChatWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.projectChatWebSocketHandler = projectChatWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/chat-ws/{courseId}")
                .setAllowedOrigins("*");
        registry.addHandler(projectChatWebSocketHandler, "/project-chat-ws/{projectId}")
                .setAllowedOrigins("*");
    }
}
