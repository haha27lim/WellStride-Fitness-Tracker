package com.example.Fitness_Tracker.security;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.Fitness_Tracker.config.OAuth2LoginSuccessHandler;
import com.example.Fitness_Tracker.entity.ERole;
import com.example.Fitness_Tracker.entity.Role;
import com.example.Fitness_Tracker.entity.User;
import com.example.Fitness_Tracker.repository.RoleRepository;
import com.example.Fitness_Tracker.repository.UserRepository;
import com.example.Fitness_Tracker.security.jwt.AuthEntryPointJwt;
import com.example.Fitness_Tracker.security.jwt.AuthTokenFilter;
import com.example.Fitness_Tracker.security.services.UserDetailsServiceImpl;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Autowired
    @Lazy
    OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                    "https://wellstride-fitness-tracker.vercel.app",
                    "https://wellstride-fitness-tracker.onrender.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration
                .setAllowedHeaders(
                        Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "X-XSRF-TOKEN", "Accept"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/auth/**", "/h2-console/**"))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html", "/assets/**", "/*.ico", "/*.png", "/*.svg",
                                "/*.webmanifest",
                                "/*.js", "/vite.svg")
                        .permitAll()
                        .requestMatchers("/api/auth/**", "/oauth2/**", "/login/oauth2/code/google")
                        .permitAll()
                        .requestMatchers("/api/csrf-token").permitAll()
                        .requestMatchers("/api/test/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .anyRequest().authenticated())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin()))
                .oauth2Login(oauth2 -> {
                    oauth2.successHandler(oAuth2LoginSuccessHandler);

                });

        http.authenticationProvider(authenticationProvider(userDetailsService));
        http.exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler));
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CommandLineRunner initData(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_USER)));

            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_ADMIN)));

            if (!userRepository.existsByUsername("user1")) {
                User user1 = new User("user1", "user1@example.com", passwordEncoder.encode("password1"));
                user1.setSignUpMethod("email");
                user1.setRoles(java.util.Collections.singleton(userRole));
                userRepository.save(user1);
            }

            if (!userRepository.existsByUsername("admin")) {
                User admin = new User("admin", "admin@example.com", passwordEncoder.encode("adminPass"));
                admin.setSignUpMethod("email");
                admin.setRoles(java.util.Collections.singleton(adminRole));
                userRepository.save(admin);
            }
        };
    }
}
