package com.smartkrishi.config;

import com.smartkrishi.security.JwtAuthenticationFilter;
import com.smartkrishi.security.UserDetailsServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
@AllArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(new com.smartkrishi.exception.JwtAuthenticationEntryPoint())
                        .accessDeniedHandler(new com.smartkrishi.exception.JwtAccessDeniedHandler())
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Permit all OPTIONS requests (CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/test-email").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/images/upload").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/fertilizers", "/api/fertilizers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/crops", "/api/crops/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/machinery", "/api/machinery/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/equipments", "/api/equipments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/land-listings", "/api/land-listings/**", "/api/lands", "/api/lands/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/milk", "/api/milk/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/materials", "/api/materials/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/weather", "/api/weather/**").permitAll()
                        .requestMatchers("/api/maps/**").permitAll()
                        .requestMatchers("/api/location/**").permitAll()
                        .requestMatchers("/api/order-tracking/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews", "/api/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sellers", "/api/sellers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/uploads", "/api/uploads/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/payments/webhook").permitAll()

                        // Other secured endpoints
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
