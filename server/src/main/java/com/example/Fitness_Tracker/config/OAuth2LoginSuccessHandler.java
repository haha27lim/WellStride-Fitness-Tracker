package com.example.Fitness_Tracker.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.Fitness_Tracker.entity.ERole;
import com.example.Fitness_Tracker.entity.Role;
import com.example.Fitness_Tracker.entity.User;
import com.example.Fitness_Tracker.repository.RoleRepository;
import com.example.Fitness_Tracker.security.jwt.JwtUtils;
import com.example.Fitness_Tracker.security.services.UserDetailsImpl;
import com.example.Fitness_Tracker.service.UserServiceImpl;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    @Autowired
    private final UserServiceImpl userService;

    @Autowired
    private final JwtUtils jwtUtils;

    @Autowired
    RoleRepository roleRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    String username;
    String idAttributeKey;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws ServletException, IOException {
        OAuth2AuthenticationToken oAuth2AuthenticationToken = (OAuth2AuthenticationToken) authentication;
        if (!"google".equals(oAuth2AuthenticationToken.getAuthorizedClientRegistrationId())) {
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        }

        DefaultOAuth2User principal = (DefaultOAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = principal.getAttributes();
        String email = attributes.getOrDefault("email", "").toString();
        String name = attributes.getOrDefault("name", "").toString();
        String username = email.split("@")[0];
        String idAttributeKey = "sub";

        System.out.println("HELLO OAUTH: " + email + " : " + name + " : " + username);

        User currentUser = null;

        currentUser = userService.findByEmail(email)
                .map(user -> {
                    String roleName = user.getRoles().stream()
                            .map(role -> role.getName().name())
                            .findFirst()
                            .orElse(ERole.ROLE_USER.name());

                    DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                            List.of(new SimpleGrantedAuthority(roleName)),
                            attributes,
                            idAttributeKey);

                    Authentication securityAuth = new OAuth2AuthenticationToken(
                            oauthUser,
                            List.of(new SimpleGrantedAuthority(roleName)),
                            oAuth2AuthenticationToken.getAuthorizedClientRegistrationId());
                    SecurityContextHolder.getContext().setAuthentication(securityAuth);
                    return user;
                })
                .orElseGet(() -> {
                    User newUser = new User();
                    Optional<Role> userRole = roleRepository.findByName(ERole.ROLE_USER);
                    if (userRole.isPresent()) {
                        newUser.setRoles(java.util.Collections.singleton(userRole.get()));
                    } else {
                        throw new RuntimeException("Default role not found");
                    }
                    newUser.setEmail(email);
                    newUser.setUsername(username);
                    newUser.setSignUpMethod(oAuth2AuthenticationToken.getAuthorizedClientRegistrationId());
                    User savedUser = userService.registerUser(newUser);
                    
                    DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                            List.of(new SimpleGrantedAuthority(ERole.ROLE_USER.name())),
                            attributes,
                            idAttributeKey);
                    Authentication securityAuth = new OAuth2AuthenticationToken(
                            oauthUser,
                            List.of(new SimpleGrantedAuthority(ERole.ROLE_USER.name())),
                            oAuth2AuthenticationToken.getAuthorizedClientRegistrationId());
                    SecurityContextHolder.getContext().setAuthentication(securityAuth);
                    return savedUser;
                });

        System.out.println("OAuth2LoginSuccessHandler: " + username + " : " + email);

        UserDetailsImpl userDetails = UserDetailsImpl.build(currentUser);

        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(userDetails);
        String token = jwtUtils.generateTokenFromUsername(userDetails);

        response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "oauth2/redirect")
                .fragment("token=" + token)
                .build().toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}