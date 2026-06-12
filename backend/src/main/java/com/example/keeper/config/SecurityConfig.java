package com.example.keeper.config;

import com.example.keeper.systems.auth.entity.RefreshToken;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.JwtService;
import com.example.keeper.systems.auth.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final RoleRepository roleRepository;

    @Value("${app.cors.allowed-origins:http://localhost:5173,https://*.vercel.app}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(
            org.springframework.security.config.annotation.web.builders.HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST,
                                "/api/courses",
                                "/api/schools",
                                "/api/schools/**",
                                "/api/tags",
                                "/api/tags/**",
                                "/api/languages",
                                "/api/languages/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/schools",
                                "/api/schools/**",
                                "/api/tags",
                                "/api/tags/**",
                                "/api/languages",
                                "/api/languages/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/courses/*",
                                "/api/schools",
                                "/api/schools/**",
                                "/api/tags",
                                "/api/tags/**",
                                "/api/languages",
                                "/api/languages/**")
                        .hasRole("ADMIN")

                                                .requestMatchers(
                                                                "/api/auth/**",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**",

                                                                "/api/embedding/**",

                                                                "/api/courses",
                                                                "/api/courses/**",
                                                                "/api/languages",
                                                                "/api/languages/**",
                                                                "/api/schools",
                                                                "/api/schools/**",
                                                                "/api/tags",
                                                                "/api/tags/**",

                                                                "/api/projects/shared/**",
                                                                "/api/ai/shared/ask",
                                                                
                                                                "/error",

                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/swagger-resources/**",
                                                                "/webjars/**")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/courses",
                                                                "/api/courses/**",
                                                                "/api/documents",
                                                                "/api/documents/**",
                                                                "/api/languages",
                                                                "/api/languages/**",
                                                                "/api/schools",
                                                                "/api/schools/**",
                                                                "/api/tags",
                                                                "/api/tags/**")
                                                .permitAll()

                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .anyRequest().authenticated())
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((req, res, e) -> {
                                                        res.setStatus(401);
                                                        res.setContentType("application/json");
                                                        res.getWriter().write("{\"message\":\"Unauthorized\"}");
                                                }))

                .oauth2Login(oauth -> oauth
                        .successHandler((request, response, authentication) -> {

                            OAuth2User oAuth2User = (OAuth2User) authentication
                                    .getPrincipal();

                            String email = oAuth2User.getAttribute("email");

                            User user = userRepository.findByEmail(email).orElseGet(() -> {
                                User newUser = new User();
                                String name = oAuth2User.getAttribute("name");
                                String username = (name != null && !name.isBlank())
                                        ? name.replaceAll("\\s+", "_")
                                        : email.split("@")[0];
                                newUser.setUsername(username);
                                newUser.setEmail(email);
                                newUser.setPassword(
                                        new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                                                .encode(java.util.UUID
                                                        .randomUUID()
                                                        .toString()));
                                newUser.setEmailVerified(true);
                                roleRepository.findByName("STUDENT")
                                        .ifPresent(newUser::setRole);
                                userRepository.save(newUser);
                                return newUser;
                            });

                            String accessToken = jwtService.generateToken(user);
                            RefreshToken refreshToken = refreshTokenService
                                    .createRefreshToken(user.getId());

                            String redirectUrl = "http://localhost:5173/oauth2/callback"
                                    + "?token=" + accessToken
                                    + "&refreshToken=" + refreshToken.getToken();

                            response.sendRedirect(redirectUrl);
                        }))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}