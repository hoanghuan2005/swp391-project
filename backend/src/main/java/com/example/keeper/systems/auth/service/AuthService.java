package com.example.keeper.systems.auth.service;

import com.example.keeper.systems.auth.dto.RegisterRequest;
import com.example.keeper.systems.auth.dto.LoginRequest; // Đã thêm import cho gọn
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

    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists!";
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Thêm role mặc định khi đăng ký (ở đây để STUDENT mặc định)
        // Lưu ý: Import RoleRepository nếu cần, hoặc tự set
        // Hiện tại tạm comment, nếu project có form register cần truyền Role thì thêm
        // sau
        // user.setRole(roleRepository.findByName("STUDENT").orElse(null));

        userRepository.save(user);
        return "User registered successfully!";
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid email or password!";
        }

        // Return token and Role separated by colon or in json, but existing code
        // returns String token
        // We will include role in JWT Token body next, but for simplicity we will
        // return Token
        return jwtService.generateToken(user);
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        // 1. Tạo mã OTP 6 số
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);

        // 2. Lưu vào DB
        user.setResetToken(otp);
        userRepository.save(user);

        // 3. Gửi mail (Sử dụng đúng hàm trong EmailService của bạn)
        try {
            emailService.sendResetPasswordEmail(email, otp);
        } catch (Exception e) {
            // Nếu lỗi gửi mail, in ra log để debug nhưng vẫn báo cho user check
            System.err.println("Lỗi gửi mail: " + e.getMessage());
            throw new RuntimeException("Không thể gửi mail, vui lòng kiểm tra lại cấu hình SMTP!");
        }

        return "Mã OTP đã được gửi!";
    }

    public String resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getResetToken() == null || !user.getResetToken().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        userRepository.save(user);

        return "Password updated successfully!";
    }

    public boolean verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        return user.getResetToken() != null && user.getResetToken().equals(otp);
    }
}
