package com.example.keeper.systems.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:noreply@mindocu.app}")
    private String senderEmail;

    @Value("${brevo.sender.name:MinDoCu App}")
    private String senderName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private void sendEmail(String to, String subject, String textContent) {
        String cleanKey = brevoApiKey != null ? brevoApiKey.trim() : "";
        if (cleanKey.isBlank()) {
            log.warn("Brevo API key not configured, skipping email to {}", to);
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", cleanKey);

            Map<String, Object> body = new HashMap<>();
            body.put("sender", Map.of("name", senderName, "email", senderEmail != null ? senderEmail.trim() : ""));
            body.put("to", List.of(Map.of("email", to)));
            body.put("subject", subject);
            body.put("textContent", textContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully to {}", to);
            } else {
                log.warn("Brevo returned status {} when sending to {}", response.getStatusCode(), to);
            }
        } catch (HttpStatusCodeException e) {
            log.warn("Could not send email to {}: {} - Response: {}", to, e.getMessage(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.warn("Could not send email to {}: {}", to, e.getMessage());
        }
    }


    @Async
    public void sendResetPasswordEmail(String to, String otp) {
        sendEmail(to,
                "Password reset verification code - Keeper App",
                "Your OTP code is: " + otp + ". Please do not share this code with anyone.");
    }

    @Async
    public void sendSignupOtpEmail(String to, String otp) {
        sendEmail(to,
                "Verify your account - Keeper App",
                "Your verification code is: " + otp + ". It expires soon, please do not share this code.");
    }

    @Async
    public void sendWorkspaceInvitationEmail(String to, String inviterName, String workspaceName, String token) {
        String cleanUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String acceptUrl = cleanUrl + "/workspace/invite/accept?token=" + token;

        sendEmail(to,
                "Invitation to join workspace " + workspaceName + " - Keeper App",
                inviterName + " has invited you to collaborate on the workspace \"" + workspaceName
                        + "\" on Keeper App.\n\n" +
                        "To accept the invitation, please click the link below:\n" +
                        acceptUrl + "\n\n" +
                        "This invitation will expire in 24 hours.");
    }

    @Async
    public void sendSubscriptionSuccessEmail(String to, String fullName) {
        sendEmail(to,
                "Upgrade to PRO Successful - MinDoCu App",
                "Dear " + (fullName != null ? fullName : "User") + ",\n\n" +
                        "Congratulations! Your account has been successfully upgraded to the PRO plan.\n" +
                        "You now have access to unlimited AI requests, custom quizzes, flashcards and mindmaps, and other advanced features on MinDoCu App.\n\n"
                        +
                        "Thank you for choosing MinDoCu to elevate your learning!\n\n" +
                        "Best regards,\n" +
                        "The MinDoCu Team");
    }
}