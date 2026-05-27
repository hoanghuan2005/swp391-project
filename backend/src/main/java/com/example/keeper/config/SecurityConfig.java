package com.example.keeper.config;

import com.example.keeper.systems.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; // Nên thêm cái này
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final JwtService jwtService;
        // Nếu bạn có class AuthenticationProvider thì inject vào, nếu không thì bỏ qua
        // private final AuthenticationProvider authenticationProvider;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/api/auth/**",
                                                                "/v3/api-docs",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/swagger-resources/**",
                                                                "/webjars/**",
                                                                "/error",
                                                                "/api/documents/**",
                                                                "/api/courses/**",
                                                                "/api/languages/**",
                                                                "/api/schools/**",
                                                                "/api/tags/**",
                                                                "/api/projects/shared/**",
                                                                "/api/ai/flashcards/**")
                                                .permitAll()
                                                .requestMatchers("/api/users/upload-avatar").authenticated()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .anyRequest().authenticated())
                                .oauth2Login(oauth -> oauth
                                                .successHandler((request, response, authentication) -> {
                                                        OAuth2User oAuth2User = (OAuth2User) authentication
                                                                        .getPrincipal();
                                                        String email = oAuth2User.getAttribute("email");

                                                        String jwt = jwtService.generateToken(email);

                                                        // redirect về FE kèm token
                                                        String redirectUrl = "http://localhost:5173/oauth2/callback?token="
                                                                        + jwt;

                                                        response.sendRedirect(redirectUrl);
                                                }))
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(
                                List.of("http://localhost:5173"));

                configuration.setAllowedMethods(
                                List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

                configuration.setAllowedHeaders(
                                List.of("*"));

                configuration.setAllowCredentials(true);

                configuration.setExposedHeaders(
                                List.of("Authorization"));

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", configuration);

                return source;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}