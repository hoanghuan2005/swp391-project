package com.example.keeper.systems.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendResetPasswordEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Password reset verification code - Keeper App");
        message.setText("Your OTP code is: " + otp + ". Please do not share this code with anyone.");
        mailSender.send(message);
    }

    public void sendSignupOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Verify your account - Keeper App");
        message.setText("Your verification code is: " + otp + ". It expires soon, please do not share this code.");
        mailSender.send(message);
    }

    public void sendWorkspaceInvitationEmail(String to, String inviterName, String workspaceName, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Invitation to join workspace " + workspaceName + " - Keeper App");
        message.setText(inviterName + " has invited you to collaborate on the workspace \"" + workspaceName + "\" on Keeper App.\n\n" +
                "To accept the invitation, please click the link below:\n" +
                "http://localhost:5173/workspace/invite/accept?token=" + token + "\n\n" +
                "This invitation will expire in 24 hours.");
        mailSender.send(message);
    }
}