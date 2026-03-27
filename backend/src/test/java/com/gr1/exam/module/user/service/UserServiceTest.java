package com.gr1.exam.module.user.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.exception.UnauthorizedException;
import com.gr1.exam.core.security.JwtTokenProvider;
import com.gr1.exam.module.user.dto.LoginRequestDTO;
import com.gr1.exam.module.user.dto.LoginResponseDTO;
import com.gr1.exam.module.user.dto.UserRequestDTO;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private UserService userService;

    @Test
    void register_shouldCreateStudentByDefault_whenRoleIsNull() {
        UserRequestDTO request = new UserRequestDTO();
        request.setName("alice");
        request.setPassword("plain-pass");
        request.setRole(null);

        when(userRepository.existsByName("alice")).thenReturn(false);
        when(passwordEncoder.encode("plain-pass")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1);
            return user;
        });

        UserResponseDTO result = userService.register(request);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getName()).isEqualTo("alice");
        assertThat(result.getRole()).isEqualTo("STUDENT");
        verify(passwordEncoder).encode("plain-pass");
    }

    @Test
    void register_shouldThrowBadRequest_whenUsernameAlreadyExists() {
        UserRequestDTO request = new UserRequestDTO();
        request.setName("existing");
        request.setPassword("pass");

        when(userRepository.existsByName("existing")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tên đăng nhập đã tồn tại");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_shouldThrowBadRequest_whenRoleInvalid() {
        UserRequestDTO request = new UserRequestDTO();
        request.setName("bob");
        request.setPassword("pass");
        request.setRole("manager");

        when(userRepository.existsByName("bob")).thenReturn(false);

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Role không hợp lệ");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_shouldReturnBearerTokenAndUser_whenCredentialsValid() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setName("alice");
        request.setPassword("pass");

        User user = User.builder()
                .id(7)
                .name("alice")
                .password("encoded")
                .role(User.Role.ADMIN)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("alice", null, List.of()));
        when(userRepository.findByName("alice")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken("alice")).thenReturn("jwt-token");

        LoginResponseDTO result = userService.login(request);

        assertThat(result.getToken()).isEqualTo("jwt-token");
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        assertThat(result.getUser().getId()).isEqualTo(7);
        assertThat(result.getUser().getRole()).isEqualTo("ADMIN");
    }

    @Test
    void login_shouldThrowUnauthorized_whenBadCredentials() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setName("alice");
        request.setPassword("wrong");

        doThrow(new BadCredentialsException("bad creds"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Sai tên đăng nhập hoặc mật khẩu");

        verify(userRepository, never()).findByName(anyString());
    }

    @Test
    void login_shouldThrowUnauthorized_whenUserNotFoundAfterAuthentication() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setName("ghost");
        request.setPassword("pass");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("ghost", null, List.of()));
        when(userRepository.findByName("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User không tồn tại");

        verify(jwtTokenProvider, never()).generateToken(anyString());
    }

    @Test
    void getUserById_shouldThrowNotFound_whenMissing() {
        when(userRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User không tìm thấy với id: 99");
    }

    @Test
    void updateUser_shouldUpdateNamePasswordAndRole_whenValidRequest() {
        User existing = User.builder()
                .id(3)
                .name("old-name")
                .password("old-pass")
                .role(User.Role.STUDENT)
                .build();

        UserRequestDTO request = new UserRequestDTO();
        request.setName("new-name");
        request.setPassword("new-pass");
        request.setRole("admin");

        when(userRepository.findById(3)).thenReturn(Optional.of(existing));
        when(userRepository.existsByName("new-name")).thenReturn(false);
        when(passwordEncoder.encode("new-pass")).thenReturn("encoded-new-pass");
        when(userRepository.save(existing)).thenReturn(existing);

        UserResponseDTO result = userService.updateUser(3, request);

        assertThat(result.getName()).isEqualTo("new-name");
        assertThat(result.getRole()).isEqualTo("ADMIN");
        assertThat(existing.getPassword()).isEqualTo("encoded-new-pass");
    }

    @Test
    void updateUser_shouldThrowBadRequest_whenNewNameAlreadyExists() {
        User existing = User.builder()
                .id(10)
                .name("old-name")
                .password("old-pass")
                .role(User.Role.STUDENT)
                .build();

        UserRequestDTO request = new UserRequestDTO();
        request.setName("taken-name");
        request.setPassword("anything");

        when(userRepository.findById(10)).thenReturn(Optional.of(existing));
        when(userRepository.existsByName("taken-name")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tên đăng nhập đã tồn tại");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUser_shouldThrowBadRequest_whenRoleInvalid() {
        User existing = User.builder()
                .id(10)
                .name("old-name")
                .password("old-pass")
                .role(User.Role.STUDENT)
                .build();

        UserRequestDTO request = new UserRequestDTO();
        request.setName("old-name");
        request.setPassword("new-pass");
        request.setRole("invalid-role");

        when(userRepository.findById(10)).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode("new-pass")).thenReturn("encoded-new-pass");

        assertThatThrownBy(() -> userService.updateUser(10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Role không hợp lệ");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUser_shouldThrowNotFound_whenMissing() {
        when(userRepository.findById(123)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(123))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User không tìm thấy với id: 123");
    }
}
