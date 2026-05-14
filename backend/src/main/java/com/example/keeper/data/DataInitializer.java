package com.example.keeper.data;

import com.example.keeper.systems.auth.entity.Role;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Tạo các role mặc định (ADMIN và STUDENT)
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role("ADMIN"));
            roleRepository.save(new Role("STUDENT"));
        }

        // 2. Tạo User mặc định
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            Role studentRole = roleRepository.findByName("STUDENT").orElseThrow();

            // Khởi tạo tài khoản Admin
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(adminRole);
            userRepository.save(admin);

            // Khởi tạo tài khoản User (Student)
            User student = new User();
            student.setUsername("student");
            student.setEmail("student@example.com");
            student.setPassword(passwordEncoder.encode("student123"));
            student.setRole(studentRole);
            userRepository.save(student);

            System.out.println("✅ Đã khởi tạo cấu hình Role và 2 tài khoản:");
            System.out.println("   - Admin ($ADMIN) : admin / admin123");
            System.out.println("   - Student ($STUDENT) : student / student123");
        } else {
            System.out.println("⚡ Dữ liệu người dùng đã tồn tại, bỏ qua DataInitializer.");
        }
    }
}
