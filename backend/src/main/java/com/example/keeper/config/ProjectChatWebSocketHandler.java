package com.example.keeper.config;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.JwtService;
import com.example.keeper.systems.project.entity.ProjectChatMessage;
import com.example.keeper.systems.project.entity.ProjectChatReaction;
import com.example.keeper.systems.project.repository.ProjectChatMessageRepository;
import com.example.keeper.systems.project.repository.ProjectChatReactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@RequiredArgsConstructor
public class ProjectChatWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ProjectChatMessageRepository chatMessageRepository;
    private final ProjectChatReactionRepository chatReactionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

    // projectId -> set of sessions
    private final Map<UUID, Set<WebSocketSession>> projectSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        User user = getUserFromSession(session);
        if (user == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Unauthorized or Invalid Token"));
            return;
        }

        UUID projectId = getProjectId(session);
        projectSessions.computeIfAbsent(projectId, k -> new CopyOnWriteArraySet<>()).add(session);
        
        session.getAttributes().put("user", user);
        session.getAttributes().put("projectId", projectId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        User user = (User) session.getAttributes().get("user");
        UUID projectId = (UUID) session.getAttributes().get("projectId");
        if (user == null || projectId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String payload = message.getPayload();
        Map<String, Object> msgMap;
        try {
            msgMap = objectMapper.readValue(payload, Map.class);
        } catch (Exception e) {
            return;
        }

        String type = (String) msgMap.get("type");
        if (type == null) return;

        if ("COMMENT".equalsIgnoreCase(type)) {
            String content = (String) msgMap.get("content");
            if (content == null || content.trim().isEmpty()) {
                return;
            }
            String parentIdStr = (String) msgMap.get("parentId");
            UUID parentId = null;
            if (parentIdStr != null && !parentIdStr.trim().isEmpty()) {
                try {
                    parentId = UUID.fromString(parentIdStr);
                } catch (Exception e) {
                    // ignore invalid parentId
                }
            }

            ProjectChatMessage chatMessage = new ProjectChatMessage();
            chatMessage.setProjectId(projectId);
            chatMessage.setSender(user);
            chatMessage.setContent(content);
            chatMessage.setParentId(parentId);
            chatMessage.setCreatedAt(java.time.LocalDateTime.now());
            ProjectChatMessage savedMsg = chatMessageRepository.save(chatMessage);

            // Broadcast new comment
            Map<String, Object> broadcastMap = new HashMap<>();
            broadcastMap.put("event", "NEW_COMMENT");
            broadcastMap.put("data", savedMsg);
            
            String broadcastPayload = objectMapper.writeValueAsString(broadcastMap);
            broadcast(projectId, broadcastPayload);

        } else if ("REACTION".equalsIgnoreCase(type)) {
            String messageIdStr = (String) msgMap.get("messageId");
            String reactionType = (String) msgMap.get("reactionType");
            if (messageIdStr == null || reactionType == null) return;

            UUID messageId = UUID.fromString(messageIdStr);
            
            // Toggle reaction
            Optional<ProjectChatReaction> existingOpt = chatReactionRepository.findByMessageIdAndUserId(messageId, user.getId());
            if (existingOpt.isPresent()) {
                ProjectChatReaction existing = existingOpt.get();
                if (existing.getReactionType().equalsIgnoreCase(reactionType)) {
                    // Delete reaction (toggle off)
                    chatReactionRepository.delete(existing);
                } else {
                    // Change reaction type
                    existing.setReactionType(reactionType);
                    chatReactionRepository.save(existing);
                }
            } else {
                // Save new reaction
                ProjectChatReaction newReaction = new ProjectChatReaction();
                newReaction.setMessageId(messageId);
                newReaction.setUserId(user.getId());
                newReaction.setUsername(user.getUsername());
                newReaction.setFullName(user.getUsername() != null ? user.getUsername() : user.getEmail());
                newReaction.setReactionType(reactionType);
                chatReactionRepository.save(newReaction);
            }

            // Fetch the updated message with reactions to broadcast
            Optional<ProjectChatMessage> updatedMsgOpt = chatMessageRepository.findById(messageId);
            if (updatedMsgOpt.isPresent()) {
                ProjectChatMessage updatedMsg = updatedMsgOpt.get();
                
                Map<String, Object> broadcastMap = new HashMap<>();
                broadcastMap.put("event", "REACTION_UPDATE");
                broadcastMap.put("data", updatedMsg);

                String broadcastPayload = objectMapper.writeValueAsString(broadcastMap);
                broadcast(projectId, broadcastPayload);
            }
        }
    }

    private void broadcast(UUID projectId, String payload) {
        TextMessage broadcastMessage = new TextMessage(payload);
        Set<WebSocketSession> sessions = projectSessions.get(projectId);
        if (sessions != null) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(broadcastMessage);
                    } catch (IOException e) {
                        // ignore and handle during connection closed
                    }
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UUID projectId = (UUID) session.getAttributes().get("projectId");
        if (projectId != null) {
            Set<WebSocketSession> sessions = projectSessions.get(projectId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    projectSessions.remove(projectId);
                }
            }
        }
    }

    private UUID getProjectId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        String path = uri.getPath();
        String[] parts = path.split("/");
        String uuidStr = parts[parts.length - 1];
        return UUID.fromString(uuidStr);
    }

    private String getToken(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        String query = uri.getQuery();
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length > 1 && "token".equalsIgnoreCase(pair[0])) {
                return pair[1];
            }
        }
        return null;
    }

    private User getUserFromSession(WebSocketSession session) {
        String token = getToken(session);
        if (token == null) return null;
        try {
            String email = jwtService.extractUsername(token);
            if (email != null) {
                return userRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }
}
