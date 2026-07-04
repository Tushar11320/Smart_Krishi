package com.smartkrishi.controller;

import com.smartkrishi.dto.auth.UpdateProfileRequest;
import com.smartkrishi.dto.auth.UserResponse;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.entity.User;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserController userController;

    private User user;
    private UserPrincipal userPrincipal;

    @BeforeEach
    public void setUp() {
        user = new User();
        user.setId(50L);
        user.setEmail("user@smartkrishi.com");
        user.setFirstName("OldFirst");
        user.setLastName("OldLast");
        user.setPhone("1112223333");
        user.setProfileImage("old-img.jpg");

        userPrincipal = new UserPrincipal(
                50L,
                "user@smartkrishi.com",
                "user@smartkrishi.com",
                "pwdHash",
                Collections.emptyList()
        );
    }

    @Test
    public void testProfileUpdate_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("NewFirst");
        request.setLastName("NewLast");
        request.setPhone("9998887777");
        request.setProfileImage("new-img.jpg");

        when(userRepository.findById(50L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateProfile(userPrincipal, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().getSuccess());
        assertEquals("Profile updated successfully", response.getBody().getMessage());
        
        UserResponse responseData = response.getBody().getData();
        assertEquals("NewFirst", responseData.getFirstName());
        assertEquals("NewLast", responseData.getLastName());
        assertEquals("9998887777", responseData.getPhone());
        assertEquals("new-img.jpg", responseData.getProfileImage());

        verify(userRepository).save(argThat(u -> 
            "NewFirst".equals(u.getFirstName()) &&
            "NewLast".equals(u.getLastName()) &&
            "9998887777".equals(u.getPhone()) &&
            "new-img.jpg".equals(u.getProfileImage())
        ));
    }
}
