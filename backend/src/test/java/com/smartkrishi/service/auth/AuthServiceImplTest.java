package com.smartkrishi.service.auth;

import com.smartkrishi.dto.auth.*;
import com.smartkrishi.entity.BuyerProfile;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.entity.Role;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.repository.*;
import com.smartkrishi.security.JwtTokenProvider;
import com.smartkrishi.security.UserDetailsServiceImpl;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.notification.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private EmailService emailService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AuthServiceImpl authService;

    private Role userRole;

    @BeforeEach
    public void setUp() {
        ReflectionTestUtils.setField(authService, "googleClientId", "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com");

        userRole = new Role();
        userRole.setId(1L);
        userRole.setRoleType(Role.RoleType.ROLE_USER);
        userRole.setDescription("Standard User Role");
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGoogleLogin_WithFirstAndLastName_Success() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setToken("valid-token-first-last");
        request.setUserType("BUYER");

        GoogleTokenPayload payload = new GoogleTokenPayload();
        payload.setEmail("john.doe@smartkrishi.com");
        payload.setSub("google-sub-12345");
        payload.setAud("YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com");
        payload.setName("John Doe");
        payload.setGivenName("John");
        payload.setFamilyName("Doe");
        payload.setPicture("http://example.com/pic.jpg");

        when(userRepository.findByEmail(payload.getEmail())).thenReturn(Optional.empty());
        when(roleRepository.findByRoleType(Role.RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        when(buyerProfileRepository.save(any(BuyerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-pwd");
        
        when(tokenProvider.generateTokenFromEmail(eq(payload.getEmail()), eq(10L), anyList())).thenReturn("jwt-access-token");
        when(tokenProvider.generateRefreshToken(eq(payload.getEmail()))).thenReturn("jwt-refresh-token");
        when(tokenProvider.getExpirationTime()).thenReturn(3600000L);

        when(restTemplate.getForObject(contains("valid-token-first-last"), eq(GoogleTokenPayload.class))).thenReturn(payload);

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("jwt-access-token", response.getAccessToken());
        assertEquals("jwt-refresh-token", response.getRefreshToken());
        assertEquals("John", response.getUser().getFirstName());
        assertEquals("Doe", response.getUser().getLastName());
        
        verify(userRepository).save(argThat(user -> 
            "John".equals(user.getFirstName()) && 
            "Doe".equals(user.getLastName()) && 
            "GOOGLE".equals(user.getAuthProvider())
        ));
    }

    @Test
    public void testGoogleLogin_WithOnlyOneName_Success() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setToken("valid-token-one-name");
        request.setUserType("BUYER");

        GoogleTokenPayload payload = new GoogleTokenPayload();
        payload.setEmail("single.name@smartkrishi.com");
        payload.setSub("google-sub-67890");
        payload.setAud("YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com");
        payload.setName("SingleNameUser");
        payload.setGivenName(null);
        payload.setFamilyName(null);
        payload.setPicture("http://example.com/pic2.jpg");

        when(userRepository.findByEmail(payload.getEmail())).thenReturn(Optional.empty());
        when(roleRepository.findByRoleType(Role.RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        when(buyerProfileRepository.save(any(BuyerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-pwd-2");
        
        when(tokenProvider.generateTokenFromEmail(eq(payload.getEmail()), eq(11L), anyList())).thenReturn("jwt-access-token-2");
        when(tokenProvider.generateRefreshToken(eq(payload.getEmail()))).thenReturn("jwt-refresh-token-2");
        when(tokenProvider.getExpirationTime()).thenReturn(3600000L);

        when(restTemplate.getForObject(contains("valid-token-one-name"), eq(GoogleTokenPayload.class))).thenReturn(payload);

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("jwt-access-token-2", response.getAccessToken());
        assertEquals("SingleNameUser", response.getUser().getFirstName());
        assertEquals("User", response.getUser().getLastName());
        
        verify(userRepository).save(argThat(user -> 
            "SingleNameUser".equals(user.getFirstName()) && 
            "User".equals(user.getLastName()) && 
            "GOOGLE".equals(user.getAuthProvider())
        ));
    }

    @Test
    public void testLogin_ExistingEmail_Success() {
        LoginRequest request = new LoginRequest("test@smartkrishi.com", "Demo@12345");

        User existingUser = new User();
        existingUser.setId(20L);
        existingUser.setEmail("test@smartkrishi.com");
        existingUser.setPasswordHash("hashed-password");
        existingUser.setUserStatus(User.UserStatus.ACTIVE);
        existingUser.setEmailVerified(true);
        existingUser.setFirstName("John");
        existingUser.setLastName("Doe");

        Role role = new Role();
        role.setId(1L);
        role.setRoleType(Role.RoleType.ROLE_USER);
        existingUser.getRoles().add(role);

        when(userRepository.findByEmail("test@smartkrishi.com")).thenReturn(Optional.of(existingUser));

        UserPrincipal principal = UserPrincipal.create(existingUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

        when(tokenProvider.generateToken(auth)).thenReturn("login-jwt-token");
        when(tokenProvider.generateRefreshToken("test@smartkrishi.com")).thenReturn("login-refresh-token");
        when(tokenProvider.getExpirationTime()).thenReturn(3600000L);

        JwtResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("login-jwt-token", response.getAccessToken());
        assertEquals("login-refresh-token", response.getRefreshToken());
        assertEquals("John", response.getUser().getFirstName());
        assertEquals("Doe", response.getUser().getLastName());
    }

    @Test
    public void testRegister_LocalSignup_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newlocal@smartkrishi.com");
        request.setPhone("9876543210");
        request.setFirstName("Alice");
        request.setLastName("Smith");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");
        request.setUserType("BUYER");

        when(userRepository.existsByEmail("newlocal@smartkrishi.com")).thenReturn(false);
        when(userRepository.existsByPhone("9876543210")).thenReturn(false);
        when(roleRepository.findByRoleType(Role.RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("Password@123")).thenReturn("hashed-pwd-local");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(30L);
            return saved;
        });

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("Alice", response.getFirstName());
        assertEquals("Smith", response.getLastName());
        assertEquals("newlocal@smartkrishi.com", response.getEmail());
        assertEquals("INACTIVE", response.getUserStatus());
        assertFalse(response.getEmailVerified());
        
        verify(emailService).sendEmail(eq("newlocal@smartkrishi.com"), anyString(), anyString());
    }

    @Test
    public void testGoogleLogin_WithNameSplitting_Success() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setToken("valid-token-splitting");
        request.setUserType("BUYER");

        GoogleTokenPayload payload = new GoogleTokenPayload();
        payload.setEmail("jane.doe.split@smartkrishi.com");
        payload.setSub("google-sub-abcde");
        payload.setAud("YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com");
        payload.setName("Jane Doe");
        payload.setGivenName(null);
        payload.setFamilyName(null);
        payload.setPicture("http://example.com/pic-split.jpg");

        when(userRepository.findByEmail(payload.getEmail())).thenReturn(Optional.empty());
        when(roleRepository.findByRoleType(Role.RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(12L);
            return saved;
        });
        when(buyerProfileRepository.save(any(BuyerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-pwd-3");
        
        when(tokenProvider.generateTokenFromEmail(eq(payload.getEmail()), eq(12L), anyList())).thenReturn("jwt-access-token-3");
        when(tokenProvider.generateRefreshToken(eq(payload.getEmail()))).thenReturn("jwt-refresh-token-3");
        when(tokenProvider.getExpirationTime()).thenReturn(3600000L);

        when(restTemplate.getForObject(contains("valid-token-splitting"), eq(GoogleTokenPayload.class))).thenReturn(payload);

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("Jane", response.getUser().getFirstName());
        assertEquals("Doe", response.getUser().getLastName());
        
        verify(userRepository).save(argThat(user -> 
            "Jane".equals(user.getFirstName()) && 
            "Doe".equals(user.getLastName())
        ));
    }

    @Test
    public void testGoogleLogin_ExistingUserLink_Success() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setToken("valid-token-link");
        request.setUserType("SELLER");

        GoogleTokenPayload payload = new GoogleTokenPayload();
        payload.setEmail("existing@smartkrishi.com");
        payload.setSub("google-sub-link");
        payload.setAud("YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com");
        payload.setName("Existing User");
        payload.setGivenName("Existing");
        payload.setFamilyName("User");

        User existingUser = new User();
        existingUser.setId(40L);
        existingUser.setEmail("existing@smartkrishi.com");
        existingUser.setFirstName("OldFirst");
        existingUser.setLastName("OldLast");
        existingUser.setUserStatus(User.UserStatus.ACTIVE);
        existingUser.setEmailVerified(true);
        existingUser.setRoles(new HashSet<>(Collections.singletonList(userRole)));

        Role sellerRole = new Role();
        sellerRole.setId(2L);
        sellerRole.setRoleType(Role.RoleType.ROLE_SELLER);

        when(userRepository.findByEmail(payload.getEmail())).thenReturn(Optional.of(existingUser));
        when(roleRepository.findByRoleType(Role.RoleType.ROLE_SELLER)).thenReturn(Optional.of(sellerRole));
        when(roleRepository.findByRoleType(Role.RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(sellerProfileRepository.findByUserId(40L)).thenReturn(Optional.empty());
        when(sellerProfileRepository.save(any(SellerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(tokenProvider.generateTokenFromEmail(eq(payload.getEmail()), eq(40L), anyList())).thenReturn("jwt-access-token-linked");
        when(tokenProvider.generateRefreshToken(eq(payload.getEmail()))).thenReturn("jwt-refresh-token-linked");
        when(tokenProvider.getExpirationTime()).thenReturn(3600000L);

        when(restTemplate.getForObject(contains("valid-token-link"), eq(GoogleTokenPayload.class))).thenReturn(payload);

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("OldFirst", response.getUser().getFirstName());
        assertEquals("OldLast", response.getUser().getLastName());
        assertTrue(response.getUser().getRoles().contains("ROLE_SELLER"));
        
        verify(sellerProfileRepository).save(any(SellerProfile.class));
    }

    @Test
    public void testVerifyOtp_Success() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("test@smartkrishi.com");
        request.setOtpCode("123456");

        User user = new User();
        user.setId(50L);
        user.setEmail("test@smartkrishi.com");
        user.setUserStatus(User.UserStatus.INACTIVE);
        user.setEmailVerified(false);
        user.setOtpCode("123456");
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));
        user.setOtpAttempts(0);

        when(userRepository.findByEmail("test@smartkrishi.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.verifyOtp(request);

        assertNotNull(response);
        assertEquals("ACTIVE", response.getUserStatus());
        assertTrue(response.getEmailVerified());
        assertNull(user.getOtpCode());
    }

    @Test
    public void testVerifyOtp_WrongOtp() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("test@smartkrishi.com");
        request.setOtpCode("wrong");

        User user = new User();
        user.setId(50L);
        user.setEmail("test@smartkrishi.com");
        user.setUserStatus(User.UserStatus.INACTIVE);
        user.setEmailVerified(false);
        user.setOtpCode("123456");
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));
        user.setOtpAttempts(0);

        when(userRepository.findByEmail("test@smartkrishi.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> authService.verifyOtp(request));
        assertEquals(1, user.getOtpAttempts());
    }

    @Test
    public void testResendOtp_Success() {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setEmail("test@smartkrishi.com");

        User user = new User();
        user.setId(50L);
        user.setEmail("test@smartkrishi.com");
        user.setUserStatus(User.UserStatus.INACTIVE);
        user.setEmailVerified(false);
        user.setOtpCode("111111");
        user.setOtpExpiry(java.time.LocalDateTime.now().minusMinutes(5)); // expired, so cooldown is over

        when(userRepository.findByEmail("test@smartkrishi.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.resendOtp(request);

        assertNotNull(user.getOtpCode());
        assertNotEquals("111111", user.getOtpCode());
        verify(emailService).sendEmail(eq("test@smartkrishi.com"), anyString(), anyString());
    }
}
