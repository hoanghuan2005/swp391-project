package com.example.keeper.data;

import com.example.keeper.systems.auth.entity.Role;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import com.example.keeper.systems.subject.entity.Subject;
import com.example.keeper.systems.subject.repository.SubjectRepository;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final LanguageRepository languageRepository;
        private final SchoolRepository schoolRepository;
        private final SubjectRepository subjectRepository;
        private final TagRepository tagRepository;

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

                if (schoolRepository.count() == 0) {
                        schoolRepository.saveAll(List.of(
                                        School.builder()
                                                        .code("FPT")
                                                        .name("FPT University")
                                                        .description("FPT University Vietnam")
                                                        .build(),

                                        School.builder()
                                                        .code("HCMUS")
                                                        .name("University of Science")
                                                        .description("VNUHCM - University of Science")
                                                        .build(),

                                        School.builder()
                                                        .code("UIT")
                                                        .name("University of Information Technology")
                                                        .description("VNUHCM - UIT")
                                                        .build(),
                                        School.builder()
                                                        .code("HUST")
                                                        .name("Hanoi University of Science and Technology")
                                                        .description("Hanoi, Vietnam")
                                                        .build(),
                                        School.builder()
                                                        .code("NEU")
                                                        .name("National Economics University")
                                                        .description("Hanoi, Vietnam")
                                                        .build(),
                                        School.builder()
                                                        .code("UEH")
                                                        .name("University of Economics Ho Chi Minh City")
                                                        .description("Ho Chi Minh City, Vietnam")
                                                        .build()));
                }

                if (subjectRepository.count() == 0) {
                        subjectRepository.save(new Subject(
                                        "SWP391",
                                        "Software Architecture and Design",
                                        "Core architecture concepts and design patterns"));
                }

                if (tagRepository.count() == 0) {
                        tagRepository.save(new Tag("Final Exam"));
                        tagRepository.save(new Tag("Slide"));
                        tagRepository.save(new Tag("Assignment"));
                }

                if (languageRepository.count() == 0) {
                        languageRepository.save(Language.builder()
                                        .code("EN")
                                        .name("English")
                                        .build());
                        languageRepository.save(Language.builder()
                                        .code("JA")
                                        .name("Japanese")
                                        .build());
                        languageRepository.save(Language.builder()
                                        .code("ZH")
                                        .name("Chinese")
                                        .build());
                        languageRepository.save(Language.builder()
                                        .code("KO")
                                        .name("Korean")
                                        .build());
                        languageRepository.save(Language.builder()
                                        .code("VI")
                                        .name("Vietnamese")
                                        .build());
                }
        }
}
