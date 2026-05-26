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
}