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

    @org.springframework.beans.factory.annotation.Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @org.springframework.beans.factory.annotation.Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

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
            User user = authService.login(request);
            String accessToken = jwtService.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            org.springframework.http.ResponseCookie accessCookie = 
                    com.example.keeper.util.CookieUtils.createAccessTokenCookie(accessToken, 86400, cookieSecure, cookieSameSite);
            org.springframework.http.ResponseCookie refreshCookie = 
                    com.example.keeper.util.CookieUtils.createRefreshTokenCookie(refreshToken.getToken(), 604800, cookieSecure, cookieSameSite);

            Map<String, String> response = new HashMap<>();
            response.put("name", user.getUsername());
            response.put("role", user.getRole() != null ? user.getRole().getName() : "USER");
            response.put("email", user.getEmail());

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(response);
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("code", "UNAUTHORIZED", "message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            if ("USER_UNVERIFIED".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("code", "USER_UNVERIFIED", "message", "Please verify your account before logging in."));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("code", "BAD_REQUEST", "message", ex.getMessage()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Login failed";
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("code", "LOGIN_FAILED", "message", message));
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
                                com.example.keeper.util.CookieUtils.createAccessTokenCookie(newAccessToken, 86400, cookieSecure, cookieSameSite);

                        return ResponseEntity.ok()
                                .header(org.springframework.http.HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                                .body(Map.of("message", "Token refreshed successfully"));
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

        org.springframework.http.ResponseCookie cleanAccessCookie = com.example.keeper.util.CookieUtils.cleanAccessTokenCookie(cookieSecure, cookieSameSite);
        org.springframework.http.ResponseCookie cleanRefreshCookie = com.example.keeper.util.CookieUtils.cleanRefreshTokenCookie(cookieSecure, cookieSameSite);

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