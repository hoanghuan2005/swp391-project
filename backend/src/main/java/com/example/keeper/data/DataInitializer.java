package com.example.keeper.data;

import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.entity.Role;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.category.entity.Category;
import com.example.keeper.systems.category.repository.CategoryRepository;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.course.repository.CourseRepository;
import com.example.keeper.systems.notification.repository.NotificationRepository;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import com.example.keeper.systems.major.entity.Major;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.example.keeper.systems.notification.entity.Notification;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.enums.ReferenceType;
import com.example.keeper.systems.notification.repository.NotificationRepository;

import java.time.LocalDateTime;
import java.util.UUID;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final LanguageRepository languageRepository;
        private final SchoolRepository schoolRepository;
        private final CourseRepository courseRepository;
        private final TagRepository tagRepository;
        private final CategoryRepository categoryRepository;
        private final NotificationRepository notificationRepository;
        private final jakarta.persistence.EntityManager entityManager;
        private final com.example.keeper.systems.major.repository.MajorRepository majorRepository;
        private final com.example.keeper.systems.document.repository.DocumentRepository documentRepository;

        @Override
        @jakarta.transaction.Transactional
        public void run(String... args) {
                // Drop the constraint if it exists
                try {
                        entityManager.createNativeQuery(
                                        "ALTER TABLE courses DROP CONSTRAINT IF EXISTS uk_61og8rbqdd2y28rx2et5fdnxd")
                                        .executeUpdate();
                } catch (Exception e) {
                        System.err.println("Failed to drop unique constraint: " + e.getMessage());
                }

                /*
                 * =========================
                 * ROLE
                 * =========================
                 */

                if (roleRepository.count() == 0) {

                        roleRepository.save(new Role("ADMIN"));
                        roleRepository.save(new Role("STUDENT"));
                }

                /*
                 * =========================
                 * USER
                 * =========================
                 */

                if (userRepository.count() == 0) {

                        Role adminRole = roleRepository
                                        .findByName("ADMIN")
                                        .orElseThrow();

                        Role studentRole = roleRepository
                                        .findByName("STUDENT")
                                        .orElseThrow();

                        User admin = new User();

                        admin.setUsername("admin");
                        admin.setEmail("admin@example.com");
                        admin.setPassword(
                                        passwordEncoder.encode("admin123"));
                        admin.setRole(adminRole);
                        admin.setEmailVerified(true);

                        userRepository.save(admin);

                        User student = new User();

                        student.setUsername("student");
                        student.setEmail("student@example.com");
                        student.setPassword(
                                        passwordEncoder.encode("student123"));
                        student.setRole(studentRole);
                        student.setEmailVerified(true);

                        userRepository.save(student);

                        System.out.println("Seeded default users");
                }

                Role studentRole = roleRepository
                                .findByName("STUDENT")
                                .orElseThrow();

                // Seed additional creators if not already present
                String[][] mockUsers = {
                                { "Hoàng Huấn", "hoanghuan@example.com", "hoanghuan123", "FPT", "FPT University",
                                                "2022", "Software Engineering" },
                                { "Minh Thư", "minhthu@example.com", "minhthu123", "HCMUS", "University of Science",
                                                "2023", "Computer Science" },
                                { "Quốc Bảo", "quocbao@example.com", "quocbao123", "UIT",
                                                "University of Information Technology", "2021",
                                                "Information Technology" },
                                { "Thu Hà", "thuha@example.com", "thuha123", "FPT", "FPT University", "2022",
                                                "Artificial Intelligence" },
                                { "Đức Anh", "ducanh@example.com", "ducanh123", "HUST",
                                                "Hanoi University of Science and Technology", "2020",
                                                "Computer Engineering" }
                };

                for (String[] mu : mockUsers) {
                        String username = mu[0];
                        String email = mu[1];
                        String rawPassword = mu[2];
                        String schoolCode = mu[3];
                        String schoolName = mu[4];
                        int startYear = Integer.parseInt(mu[5]);
                        String major = mu[6];

                        if (userRepository.findByEmail(email).isEmpty()) {
                                User u = new User();
                                u.setUsername(username);
                                u.setEmail(email);
                                u.setPassword(passwordEncoder.encode(rawPassword));
                                u.setRole(studentRole);
                                u.setEmailVerified(true);

                                com.example.keeper.systems.profile.entity.UserProfile up = com.example.keeper.systems.profile.entity.UserProfile
                                                .builder()
                                                .user(u)
                                                .schoolCode(schoolCode)
                                                .schoolName(schoolName)
                                                .startYear(startYear)
                                                .major(major)
                                                .build();
                                u.setProfile(up);

                                userRepository.save(u);
                                System.out.println("Seeded user: " + username);
                        }
                }

                /*
                 * =========================
                 * SCHOOL
                 * =========================
                 */

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

                /*
                 * =========================
                 * MAJOR
                 * =========================
                 */
                if (majorRepository.count() == 0) {
                        School fpt = schoolRepository.findByCode("FPT").orElseThrow();
                        School hcmus = schoolRepository.findByCode("HCMUS").orElseThrow();
                        School uit = schoolRepository.findByCode("UIT").orElseThrow();

                        majorRepository.saveAll(List.of(
                                        Major.builder()
                                                        .code("SE")
                                                        .name("Software Engineering")
                                                        .description("Software Engineering major")
                                                        .school(fpt)
                                                        .build(),
                                        Major.builder()
                                                        .code("AI")
                                                        .name("Artificial Intelligence")
                                                        .description("Artificial Intelligence major")
                                                        .school(fpt)
                                                        .build(),
                                        Major.builder()
                                                        .code("BA")
                                                        .name("Business Administration")
                                                        .description("Business Administration major")
                                                        .school(fpt)
                                                        .build(),
                                        Major.builder()
                                                        .code("CS")
                                                        .name("Computer Science")
                                                        .description("Computer Science major")
                                                        .school(hcmus)
                                                        .build(),
                                        Major.builder()
                                                        .code("IT")
                                                        .name("Information Technology")
                                                        .description("Information Technology major")
                                                        .school(uit)
                                                        .build()));
                }

                /*
                 * =========================
                 * COURSE
                 * =========================
                 */

                if (courseRepository.count() == 0) {
                        School fpt = schoolRepository.findByCode("FPT").orElseThrow();
                        Major se = majorRepository.findBySchoolIdAndCode(fpt.getId(), "SE").orElseThrow();
                        Major ai = majorRepository.findBySchoolIdAndCode(fpt.getId(), "AI").orElseThrow();

                        Course c1 = new Course("SWP391", "Software Architecture and Design",
                                        "Core architecture concepts and design patterns");
                        c1.setMajor(se);
                        Course c2 = new Course("PRF192", "Programming Fundamentals",
                                        "Introduction to programming using Java");
                        c2.setMajor(se);
                        Course c3 = new Course("SSG104", "Understanding Group Dynamics", "Teamwork and communication");
                        c3.setMajor(se);
                        Course c4 = new Course("DBI202", "Database Systems", "Relational database design and SQL");
                        c4.setMajor(se);
                        Course c5 = new Course("WEB301", "Web Application Development", "Building web applications");
                        c5.setMajor(se);
                        Course c6 = new Course("MAD101", "Mobile Application Development",
                                        "Mobile app development fundamentals");
                        c6.setMajor(se);
                        Course c7 = new Course("AI101", "Introduction to AI", "Artificial Intelligence basics");
                        c7.setMajor(ai);

                        courseRepository.saveAll(List.of(c1, c2, c3, c4, c5, c6, c7));
                }

                /*
                 * =========================
                 * CATEGORY
                 * =========================
                 */

                if (categoryRepository.count() == 0) {

                        categoryRepository.saveAll(List.of(

                                        Category.builder()
                                                        .name("Slide")
                                                        .code("SLIDE")
                                                        .description("Lecture slides and presentations")
                                                        .icon("Presentation")
                                                        .color("purple")
                                                        .build(),

                                        Category.builder()
                                                        .name("Final Exam")
                                                        .code("FINAL_EXAM")
                                                        .description("Final exam materials")
                                                        .icon("FileText")
                                                        .color("red")
                                                        .build(),

                                        Category.builder()
                                                        .name("Assignment")
                                                        .code("ASSIGNMENT")
                                                        .description("Assignments and homework")
                                                        .icon("BookOpen")
                                                        .color("orange")
                                                        .build(),

                                        Category.builder()
                                                        .name("Lab")
                                                        .code("LAB")
                                                        .description("Lab exercises")
                                                        .icon("FlaskConical")
                                                        .color("pink")
                                                        .build(),

                                        Category.builder()
                                                        .name("Project")
                                                        .code("PROJECT")
                                                        .description("Project documents")
                                                        .icon("FolderKanban")
                                                        .color("cyan")
                                                        .build(),

                                        Category.builder()
                                                        .name("Reference")
                                                        .code("REFERENCE")
                                                        .description("Reference documents")
                                                        .icon("Library")
                                                        .color("blue")
                                                        .build()));
                }

                /*
                 * =========================
                 * TAG
                 * =========================
                 */

                if (tagRepository.count() == 0) {

                        tagRepository.saveAll(List.of(

                                        new Tag("java"),
                                        new Tag("spring-boot"),
                                        new Tag("database"),
                                        new Tag("sql"),
                                        new Tag("oop"),
                                        new Tag("reactjs"),
                                        new Tag("javascript"),
                                        new Tag("html"),
                                        new Tag("css"),
                                        new Tag("ai"),
                                        new Tag("mobile"),
                                        new Tag("backend"),
                                        new Tag("frontend"),
                                        new Tag("api"),
                                        new Tag("design-pattern")));
                }

                /*
                 * =========================
                 * LANGUAGE
                 * =========================
                 */

                if (languageRepository.count() == 0) {

                        languageRepository.saveAll(List.of(

                                        Language.builder()
                                                        .code("EN")
                                                        .name("English")
                                                        .build(),

                                        Language.builder()
                                                        .code("JA")
                                                        .name("Japanese")
                                                        .build(),

                                        Language.builder()
                                                        .code("ZH")
                                                        .name("Chinese")
                                                        .build(),

                                        Language.builder()
                                                        .code("KO")
                                                        .name("Korean")
                                                        .build(),

                                        Language.builder()
                                                        .code("VI")
                                                        .name("Vietnamese")
                                                        .build()));
                }

                /*
                 * =========================
                 * NOTIFICATION
                 * =========================
                 */

                if (notificationRepository.count() == 0) {

                        User admin = userRepository
                                        .findByEmail("admin@example.com")
                                        .orElseThrow();

                        User student = userRepository
                                        .findByEmail("student@example.com")
                                        .orElseThrow();

                        notificationRepository.saveAll(List.of(

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.DOCUMENT_LIKED)
                                                        .title("Document Liked")
                                                        .message("Admin liked your document 'Java Core Notes'")
                                                        .referenceType(ReferenceType.DOCUMENT)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(false)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.DOCUMENT_FEEDBACKED)
                                                        .title("New Feedback")
                                                        .message("Admin left feedback on your Spring Boot document")
                                                        .referenceType(ReferenceType.DOCUMENT)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(false)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.QUIZ_LIKED)
                                                        .title("Quiz Liked")
                                                        .message("Admin liked your Java OOP Quiz")
                                                        .referenceType(ReferenceType.QUIZ)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(false)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.QUIZ_COMPLETED)
                                                        .title("Quiz Completed")
                                                        .message("Admin completed your Java OOP Quiz")
                                                        .referenceType(ReferenceType.QUIZ)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(true)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.FLASHCARD_LIKED)
                                                        .title("Flashcard Liked")
                                                        .message("Admin liked your Flashcard Set 'N5 Vocabulary'")
                                                        .referenceType(ReferenceType.FLASHCARD)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(false)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.FLASHCARD_SAVED)
                                                        .title("Flashcard Saved")
                                                        .message("Admin saved your Flashcard Set")
                                                        .referenceType(ReferenceType.FLASHCARD)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(false)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.GROUP_INVITED)
                                                        .title("Group Invitation")
                                                        .message("You have been invited to Backend Study Group")
                                                        .referenceType(ReferenceType.GROUP)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(false)
                                                        .build(),

                                        Notification.builder()
                                                        .recipient(student)
                                                        .sender(admin)
                                                        .type(NotificationType.GROUP_MEMBER_JOINED)
                                                        .title("New Member")
                                                        .message("A new member joined your study group")
                                                        .referenceType(ReferenceType.GROUP)
                                                        .referenceId(UUID.randomUUID())
                                                        .isRead(true)
                                                        .build()));

                        System.out.println("Seeded notifications");
                }

                /*
                 * =========================
                 * DOCUMENTS
                 * =========================
                 */
                if (documentRepository.count() == 0) {
                        User hoangHuan = userRepository.findByEmail("hoanghuan@example.com").orElse(null);
                        User minhThu = userRepository.findByEmail("minhthu@example.com").orElse(null);
                        User quocBao = userRepository.findByEmail("quocbao@example.com").orElse(null);
                        User thuHa = userRepository.findByEmail("thuha@example.com").orElse(null);

                        Course swp391 = courseRepository.findByCode("SWP391").orElse(null);
                        Course prf192 = courseRepository.findByCode("PRF192").orElse(null);
                        Course dbi202 = courseRepository.findByCode("DBI202").orElse(null);
                        Course web301 = courseRepository.findByCode("WEB301").orElse(null);
                        Course ai101 = courseRepository.findByCode("AI101").orElse(null);

                        Category slide = categoryRepository.findByCode("SLIDE").orElse(null);
                        Category finalExam = categoryRepository.findByCode("FINAL_EXAM").orElse(null);
                        Category assignment = categoryRepository.findByCode("ASSIGNMENT").orElse(null);
                        Category lab = categoryRepository.findByCode("LAB").orElse(null);

                        if (hoangHuan != null) {
                                if (swp391 != null && slide != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Kiến trúc hệ thống phần mềm nâng cao");
                                        d.setDescription(
                                                        "Tài liệu bài giảng về kiến trúc hệ thống phần mềm và các mẫu thiết kế phổ biến.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(2048576L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(hoangHuan);
                                        d.setCourse(swp391);
                                        d.setCategory(slide);
                                        d.setViewCount(42);
                                        d.setDownloadCount(12);
                                        documentRepository.save(d);
                                }
                                if (prf192 != null && finalExam != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Tài liệu ôn thi cuối kỳ PRF192");
                                        d.setDescription(
                                                        "Tổng hợp kiến thức trọng tâm và các dạng bài tập thực hành thường gặp trong đề thi.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(1548576L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(hoangHuan);
                                        d.setCourse(prf192);
                                        d.setCategory(finalExam);
                                        d.setViewCount(85);
                                        d.setDownloadCount(34);
                                        documentRepository.save(d);
                                }
                        }

                        if (minhThu != null) {
                                if (prf192 != null && slide != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Computer Science Overview Slides");
                                        d.setDescription(
                                                        "Introductory slides to computer science principles and programming constructs.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(3145728L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(minhThu);
                                        d.setCourse(prf192);
                                        d.setCategory(slide);
                                        d.setViewCount(110);
                                        d.setDownloadCount(40);
                                        documentRepository.save(d);
                                }
                                if (prf192 != null && lab != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Tài liệu thực hành Lab C cơ bản");
                                        d.setDescription(
                                                        "Hướng dẫn chi tiết từng bước làm các bài lab lập trình C căn bản.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(850000L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(minhThu);
                                        d.setCourse(prf192);
                                        d.setCategory(lab);
                                        d.setViewCount(65);
                                        d.setDownloadCount(21);
                                        documentRepository.save(d);
                                }
                        }

                        if (quocBao != null) {
                                if (dbi202 != null && slide != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Database Systems Lecture Notes");
                                        d.setDescription(
                                                        "Lecture notes covering relational database concepts, normal forms, and transaction control.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(4194304L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(quocBao);
                                        d.setCourse(dbi202);
                                        d.setCategory(slide);
                                        d.setViewCount(240);
                                        d.setDownloadCount(95);
                                        documentRepository.save(d);
                                }
                                if (web301 != null && assignment != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Assignment 1 - Web Design Guidelines");
                                        d.setDescription(
                                                        "Rubric and research paper about modern web design principles and aesthetics.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(1204857L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(quocBao);
                                        d.setCourse(web301);
                                        d.setCategory(assignment);
                                        d.setViewCount(152);
                                        d.setDownloadCount(48);
                                        documentRepository.save(d);
                                }
                        }

                        if (thuHa != null) {
                                if (ai101 != null && slide != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Artificial Intelligence Introduction Slides");
                                        d.setDescription(
                                                        "Slides covering machine learning basics, deep neural networks, and prompt engineering.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(3800000L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(thuHa);
                                        d.setCourse(ai101);
                                        d.setCategory(slide);
                                        d.setViewCount(180);
                                        d.setDownloadCount(73);
                                        documentRepository.save(d);
                                }
                                if (ai101 != null && lab != null) {
                                        com.example.keeper.systems.document.entity.Document d = new com.example.keeper.systems.document.entity.Document();
                                        d.setTitle("Lab 3 - Neural Networks Basics");
                                        d.setDescription(
                                                        "Practical lab exercise instructions to build your first simple neural network model.");
                                        d.setFileUrl("https://res.cloudinary.com/demo/image/upload/sample.pdf");
                                        d.setMimeType("application/pdf");
                                        d.setFileSize(1450000L);
                                        d.setVisibility(com.example.keeper.systems.document.enums.Visibility.PUBLIC);
                                        d.setAiParseStatus(
                                                        com.example.keeper.systems.document.enums.AiParseStatus.READY);
                                        d.setUploadedBy(thuHa);
                                        d.setCourse(ai101);
                                        d.setCategory(lab);
                                        d.setViewCount(98);
                                        d.setDownloadCount(27);
                                        documentRepository.save(d);
                                }
                        }
                        System.out.println("Seeded public documents");
                }

                System.out.println("Data initialized successfully");
        }
}
