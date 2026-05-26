package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.dto.LoginRequest;
import com.example.keeper.systems.auth.dto.RegisterRequest;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.entity.RefreshToken;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.AuthService;
import com.example.keeper.systems.auth.service.JwtService;
import com.example.keeper.systems.auth.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        String result = authService.register(request);
        return ResponseEntity.ok(result);
    }

    // SỬA HÀM NÀY: Trả về Object JSON chứa cả 2 Token thay vì chỉ trả về 1 chuỗi
    // String token trơn
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Gọi hàm login cũ để lấy Access Token (chuỗi JWT)
            String accessToken = authService.login(request);

            // Chốt chặn nếu tài khoản gõ sai mật khẩu/sai email (tránh lưu chữ lỗi vào
            // localStorage)
            if ("Invalid email or password!".equals(accessToken) || "User not found!".equals(accessToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(accessToken);
            }

            // 2. Tìm User trong DB dựa vào Email đăng nhập để lấy ID tạo Refresh Token
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

            // 3. Tạo Refresh Token lưu xuống database
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            // 4. Đóng gói cả 2 mã trả về cho Frontend dưới dạng JSON
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken.getToken());

            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Login failed";
            HttpStatus status = message.contains("verify") ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
            return ResponseEntity.status(status).body(message);
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");

        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Refresh Token is missing!");
        }

        try {
            return refreshTokenService.findByToken(requestRefreshToken)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        String newAccessToken = jwtService.generateToken(user);

                        Map<String, String> response = new HashMap<>();
                        response.put("accessToken", newAccessToken);
                        response.put("refreshToken", requestRefreshToken);
                        return ResponseEntity.ok(response);
                    })
                    .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            String result = authService.forgotPassword(email);
            return ResponseEntity.ok(java.util.Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String email,
            @RequestParam String otp,
            @RequestParam String newPassword) {
        return ResponseEntity.ok(authService.resetPassword(email, otp, newPassword));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        boolean isValid = authService.verifyOtp(email, otp);

        if (isValid) {
            return ResponseEntity.ok(java.util.Map.of("message", "OTP is valid!"));
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body("OTP code is not correct!");
        }
    }

    @PostMapping("/verify-signup-otp")
    public ResponseEntity<?> verifySignupOtp(@RequestParam String email, @RequestParam String otp) {
        try {
            String result = authService.verifySignupOtp(email, otp);
            return ResponseEntity.ok(java.util.Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @PostMapping("/resend-signup-otp")
    public ResponseEntity<?> resendSignupOtp(@RequestParam String email) {
        try {
            String result = authService.resendSignupOtp(email);
            return ResponseEntity.ok(java.util.Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }
}