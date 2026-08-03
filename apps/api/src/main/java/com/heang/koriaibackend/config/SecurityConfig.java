package com.heang.koriaibackend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOriginsRaw;

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOriginsRaw.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
                // Configure CORS (Cross-Origin Resource Sharing) using the corsConfigurationSource bean.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF (Cross-Site Request Forgery) protection. This is common for stateless APIs.
                .csrf(AbstractHttpConfigurer::disable)
                // Set the session management policy to STATELESS. This means no sessions will be created or used by Spring Security.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Configure exception handling, specifically for authentication entry points.
                .exceptionHandling(exception -> exception.authenticationEntryPoint((request, response, authException) -> {
                    // If the response has already been committed, do nothing.
                    if (response.isCommitted()) return;
                    // Set the HTTP status to 401 Unauthorized.
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    // Set the content type to application/json.
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    // Create a standardized error response body.
                    ApiResponse<Map<String, String>> body =
                            ApiResponse.error(Code.AUTHENTICATION_FAILED, Map.of("message", "Unauthorized"));
                    // Write the error response to the response writer.
                    response.getWriter().write(new ObjectMapper().writeValueAsString(body));
                }))
                // Configure authorization for HTTP requests.
                .authorizeHttpRequests(auth -> auth
                        // Permit all requests of type ASYNC.
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ASYNC).permitAll()
                        // Permit all requests to /api/auth/**, /api/health, and /error endpoints.
                        .requestMatchers("/api/auth/**", "/api/health", "/error",
                                "/api/telegram/webhook",
                                "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        // Any other request must be authenticated.
                        .anyRequest().authenticated())
                // Add the custom JWT authentication filter before the standard UsernamePasswordAuthenticationFilter.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // Build the SecurityFilterChain.
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
