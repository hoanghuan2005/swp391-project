package com.example.keeper.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public class CookieUtils {

    public static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

    public static ResponseCookie createAccessTokenCookie(String token, long maxAgeSeconds, boolean secure, String sameSite) {
        String effectiveSameSite = (sameSite != null && !sameSite.isBlank()) ? sameSite : "Lax";
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .sameSite(effectiveSameSite)
                .build();
    }

    public static ResponseCookie createAccessTokenCookie(String token, long maxAgeSeconds, boolean secure) {
        return createAccessTokenCookie(token, maxAgeSeconds, secure, "Lax");
    }

    public static ResponseCookie createAccessTokenCookie(String token, long maxAgeSeconds) {
        return createAccessTokenCookie(token, maxAgeSeconds, false, "Lax");
    }

    public static ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds, boolean secure, String sameSite) {
        String effectiveSameSite = (sameSite != null && !sameSite.isBlank()) ? sameSite : "Lax";
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .sameSite(effectiveSameSite)
                .build();
    }

    public static ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds, boolean secure) {
        return createRefreshTokenCookie(token, maxAgeSeconds, secure, "Lax");
    }

    public static ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds) {
        return createRefreshTokenCookie(token, maxAgeSeconds, false, "Lax");
    }

    public static ResponseCookie cleanAccessTokenCookie(boolean secure, String sameSite) {
        String effectiveSameSite = (sameSite != null && !sameSite.isBlank()) ? sameSite : "Lax";
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(effectiveSameSite)
                .build();
    }

    public static ResponseCookie cleanAccessTokenCookie(boolean secure) {
        return cleanAccessTokenCookie(secure, "Lax");
    }

    public static ResponseCookie cleanAccessTokenCookie() {
        return cleanAccessTokenCookie(false, "Lax");
    }

    public static ResponseCookie cleanRefreshTokenCookie(boolean secure, String sameSite) {
        String effectiveSameSite = (sameSite != null && !sameSite.isBlank()) ? sameSite : "Lax";
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(effectiveSameSite)
                .build();
    }

    public static ResponseCookie cleanRefreshTokenCookie(boolean secure) {
        return cleanRefreshTokenCookie(secure, "Lax");
    }

    public static ResponseCookie cleanRefreshTokenCookie() {
        return cleanRefreshTokenCookie(false, "Lax");
    }

    public static String getCookieValue(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
