package com.gr1.exam.core.initializer;

import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seed admin account mặc định khi ứng dụng khởi động.
 * Đọc username & password từ application.properties.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(adminUsername)) {
            User admin = User.builder()
                .username(adminUsername)
                .name("admin")
                .password(passwordEncoder.encode(adminPassword))
                .role(User.Role.ADMIN)
                .build();

            userRepository.save(admin);
            log.info("✅ Admin account created: username={}", adminUsername);
        } else {
            log.info("ℹ️ Admin account already exists: username={}", adminUsername);
        }
    }
}
