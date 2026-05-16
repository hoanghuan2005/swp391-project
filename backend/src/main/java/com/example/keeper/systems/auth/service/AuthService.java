package com.example.keeper.systems.auth.service;

import com.example.keeper.systems.auth.dto.RegisterRequest;
import com.example.keeper.systems.auth.dto.LoginRequest;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    // Đăng ký tài khoản
    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists!";
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
        return "User registered successfully!";
    }

    // Đăng nhập bằng Email/Password
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // 🛑 CHỐT CHẶN: Kiểm tra xem tài khoản có bị khóa không
        if (user.isBanned()) {
            throw new RuntimeException("Your account has been banned by the Admin.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid email or password!";
        }

        return jwtService.generateToken(user);
    }

    // Quên mật khẩu
    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        // 1. Tạo mã OTP 6 số
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);

        // 2. Lưu vào DB
        user.setResetToken(otp);
        userRepository.save(user);

        // 3. Gửi mail
        try {
            emailService.sendResetPasswordEmail(email, otp);
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            throw new RuntimeException("Failed to send email, please check SMTP configuration!");
        }

        return "OTP sent successfully!";
    }

    // Đặt lại mật khẩu mới
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

    // Xác thực OTP
    public boolean verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        return user.getResetToken() != null && user.getResetToken().equals(otp);
    }
}