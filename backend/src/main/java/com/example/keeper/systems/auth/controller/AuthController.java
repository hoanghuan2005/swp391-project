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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String accessToken = authService.login(request);

            if ("Invalid email or password!".equals(accessToken) || "User not found!".equals(accessToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(accessToken);
            }

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            org.springframework.http.ResponseCookie accessCookie = 
                    com.example.keeper.util.CookieUtils.createAccessTokenCookie(accessToken, 86400);
            org.springframework.http.ResponseCookie refreshCookie = 
                    com.example.keeper.util.CookieUtils.createRefreshTokenCookie(refreshToken.getToken(), 604800);

            Map<String, String> response = new HashMap<>();
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken.getToken());

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(response);
        } catch (RuntimeException ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Login failed";
            HttpStatus status = message.contains("verify") ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
            return ResponseEntity.status(status).body(message);
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(
            @RequestBody(required = false) Map<String, String> request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        String requestRefreshToken = request != null ? request.get("refreshToken") : null;

        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            requestRefreshToken = com.example.keeper.util.CookieUtils.getCookieValue(httpRequest, com.example.keeper.util.CookieUtils.REFRESH_TOKEN_COOKIE_NAME);
        }

        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Refresh Token is missing!");
        }

        final String tokenStr = requestRefreshToken;

        try {
            return refreshTokenService.findByToken(tokenStr)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        String newAccessToken = jwtService.generateToken(user);
                        org.springframework.http.ResponseCookie newAccessCookie = 
                                com.example.keeper.util.CookieUtils.createAccessTokenCookie(newAccessToken, 86400);

                        Map<String, String> response = new HashMap<>();
                        response.put("accessToken", newAccessToken);
                        response.put("refreshToken", tokenStr);

                        return ResponseEntity.ok()
                                .header(org.springframework.http.HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                                .body(response);
                    })
                    .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest httpRequest) {
        String refreshTokenStr = com.example.keeper.util.CookieUtils.getCookieValue(httpRequest, com.example.keeper.util.CookieUtils.REFRESH_TOKEN_COOKIE_NAME);
        if (refreshTokenStr != null && !refreshTokenStr.isEmpty()) {
            refreshTokenService.findByToken(refreshTokenStr).ifPresent(token -> {
                refreshTokenService.deleteByUser(token.getUser());
            });
        }

        org.springframework.http.ResponseCookie cleanAccessCookie = com.example.keeper.util.CookieUtils.cleanAccessTokenCookie();
        org.springframework.http.ResponseCookie cleanRefreshCookie = com.example.keeper.util.CookieUtils.cleanRefreshTokenCookie();

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cleanAccessCookie.toString())
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cleanRefreshCookie.toString())
                .body(Map.of("message", "Logged out successfully"));
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