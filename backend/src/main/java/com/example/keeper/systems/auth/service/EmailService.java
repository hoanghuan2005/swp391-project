package com.example.keeper.systems.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    @Async
    public void sendResetPasswordEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Password reset verification code - Keeper App");
            message.setText("Your OTP code is: " + otp + ". Please do not share this code with anyone.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not send reset password email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendSignupOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Verify your account - Keeper App");
            message.setText("Your verification code is: " + otp + ". It expires soon, please do not share this code.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not send signup OTP email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendWorkspaceInvitationEmail(String to, String inviterName, String workspaceName, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Invitation to join workspace " + workspaceName + " - Keeper App");
            message.setText(inviterName + " has invited you to collaborate on the workspace \"" + workspaceName
                    + "\" on Keeper App.\n\n" +
                    "To accept the invitation, please click the link below:\n" +
                    "http://localhost:5173/workspace/invite/accept?token=" + token + "\n\n" +
                    "This invitation will expire in 24 hours.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not send workspace invitation email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendSubscriptionSuccessEmail(String to, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Upgrade to PRO Successful - MinDoCu App");
            message.setText("Dear " + (fullName != null ? fullName : "User") + ",\n\n" +
                    "Congratulations! Your account has been successfully upgraded to the PRO plan.\n" +
                    "You now have access to unlimited AI requests, custom quizzes, flashcards and mindmaps, and other advanced features on MinDoCu App.\n\n"
                    +
                    "Thank you for choosing MinDoCu to elevate your learning!\n\n" +
                    "Best regards,\n" +
                    "The MinDoCu Team");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not send subscription success email to {}: {}", to, e.getMessage());
        }
    }
}