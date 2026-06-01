package com.example.keeper.systems.auth.service;

import com.example.keeper.systems.auth.dto.RegisterRequest;
import com.example.keeper.systems.auth.dto.LoginRequest;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists!";
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(false);

        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        user.setResetToken(otp);

        userRepository.save(user);

        try {
            emailService.sendSignupOtpEmail(request.getEmail(), otp);
        } catch (Exception e) {
            System.err.println("Error sending signup OTP: " + e.getMessage());
            throw new RuntimeException("Failed to send verification email, please check SMTP configuration!");
        }

        return "User registered successfully. OTP sent!";
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (user.isBanned()) {
            throw new RuntimeException("Your account has been banned by the Admin.");
        }

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your account before logging in.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid email or password!";
        }

        return jwtService.generateToken(user);
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);

        user.setResetToken(otp);
        userRepository.save(user);

        try {
            emailService.sendResetPasswordEmail(email, otp);
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            throw new RuntimeException("Failed to send email, please check SMTP configuration!");
        }

        return "OTP sent successfully!";
    }

    public String resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (user.getResetToken() == null || !user.getResetToken().equals(otp)) {
            throw new RuntimeException("Invalid OTP!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        userRepository.save(user);

        return "Password updated successfully!";
    }

    public boolean verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        return user.getResetToken() != null && user.getResetToken().equals(otp);
    }

    public String verifySignupOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        if (user.getResetToken() == null || !user.getResetToken().equals(otp)) {
            throw new RuntimeException("Invalid OTP!");
        }

        user.setEmailVerified(true);
        user.setResetToken(null);
        userRepository.save(user);

        return "Account verified successfully!";
    }

    public String resendSignupOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        if (user.isEmailVerified()) {
            return "Account already verified.";
        }

        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        user.setResetToken(otp);
        userRepository.save(user);

        try {
            emailService.sendSignupOtpEmail(email, otp);
        } catch (Exception e) {
            System.err.println("Error resending signup OTP: " + e.getMessage());
            throw new RuntimeException("Failed to resend verification email!");
        }

        return "OTP sent successfully!";
    }

    public User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }
}