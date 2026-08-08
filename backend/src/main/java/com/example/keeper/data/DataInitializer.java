package com.example.keeper.data;

import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.entity.Role;
import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.category.entity.Category;
import com.example.keeper.systems.category.repository.CategoryRepository;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.course.repository.CourseRepository;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import com.example.keeper.systems.major.entity.Major;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        private final jakarta.persistence.EntityManager entityManager;
        private final com.example.keeper.systems.major.repository.MajorRepository majorRepository;
        private final com.example.keeper.systems.document.repository.DocumentRepository documentRepository;
        private final com.example.keeper.systems.auth.repository.SubscriptionPlanRepository subscriptionPlanRepository;

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
                 * SUBSCRIPTION PLAN
                 * =========================
                 */
                if (subscriptionPlanRepository.count() == 0) {
                        subscriptionPlanRepository.saveAll(List.of(
                                        SubscriptionPlan.builder()
                                                        .code("FREE")
                                                        .name("Free Plan")
                                                        .priceVnd(0L)
                                                        .maxFileSizeBytes(5L * 1024 * 1024)
                                                        .totalStorageBytes(100L * 1024 * 1024)
                                                        .dailyUploadLimit(3L)
                                                        .totalDocumentLimit(20L)
                                                        .dailyAiLimit(10L)
                                                        .maxFlashcardsPerGeneration(10)
                                                        .maxQuizQuestionsPerGeneration(10)
                                                        .maxOwnedProjects(3)
                                                        .maxJoinedProjects(5)
                                                        .maxSelectedDocs(2)
                                                        .maxAiContextChunks(4)
                                                        .maxChunkChars(400)
                                                        .isActive(true)
                                                        .build(),
                                        SubscriptionPlan.builder()
                                                        .code("PRO")
                                                        .name("Pro Plan")
                                                        .priceVnd(99000L)
                                                        .maxFileSizeBytes(10L * 1024 * 1024)
                                                        .totalStorageBytes(1024L * 1024 * 1024)
                                                        .dailyUploadLimit(-1L)
                                                        .totalDocumentLimit(-1L)
                                                        .dailyAiLimit(-1L)
                                                        .maxFlashcardsPerGeneration(20)
                                                        .maxQuizQuestionsPerGeneration(20)
                                                        .maxOwnedProjects(-1)
                                                        .maxJoinedProjects(-1)
                                                        .maxSelectedDocs(4)
                                                        .maxAiContextChunks(8)
                                                        .maxChunkChars(600)
                                                        .isActive(true)
                                                        .build()));
                        System.out.println("Seeded subscription plans");
                }

                subscriptionPlanRepository.findByCode("FREE").ifPresent(freePlan -> {
                        boolean updated = false;
                        if (freePlan.getMaxFileSizeBytes() == null
                                        || freePlan.getMaxFileSizeBytes() != 5L * 1024 * 1024) {
                                freePlan.setMaxFileSizeBytes(5L * 1024 * 1024);
                                updated = true;
                        }
                        if (freePlan.getDailyAiLimit() == null || freePlan.getDailyAiLimit() != 10L) {
                                freePlan.setDailyAiLimit(10L);
                                updated = true;
                        }
                        if (freePlan.getMaxFlashcardsPerGeneration() == null || freePlan.getMaxFlashcardsPerGeneration() != 10) {
                                freePlan.setMaxFlashcardsPerGeneration(10);
                                updated = true;
                        }
                        if (freePlan.getMaxQuizQuestionsPerGeneration() == null || freePlan.getMaxQuizQuestionsPerGeneration() != 10) {
                                freePlan.setMaxQuizQuestionsPerGeneration(10);
                                updated = true;
                        }
                        if (updated) {
                                subscriptionPlanRepository.save(freePlan);
                                System.out.println("Updated FREE plan limits (dailyAiLimit: 10, maxFlashcards: 10, maxQuizQuestions: 10)");
                        }
                });

                subscriptionPlanRepository.findByCode("PRO").ifPresent(proPlan -> {
                        boolean updated = false;
                        if (proPlan.getMaxFileSizeBytes() == null
                                        || proPlan.getMaxFileSizeBytes() != 10L * 1024 * 1024) {
                                proPlan.setMaxFileSizeBytes(10L * 1024 * 1024);
                                updated = true;
                        }
                        if (proPlan.getMaxFlashcardsPerGeneration() == null
                                        || proPlan.getMaxFlashcardsPerGeneration() != 20) {
                                proPlan.setMaxFlashcardsPerGeneration(20);
                                updated = true;
                        }
                        if (proPlan.getMaxQuizQuestionsPerGeneration() == null
                                        || proPlan.getMaxQuizQuestionsPerGeneration() != 20) {
                                proPlan.setMaxQuizQuestionsPerGeneration(20);
                                updated = true;
                        }
                        if (updated) {
                                subscriptionPlanRepository.save(proPlan);
                                System.out.println("Updated PRO plan limits (maxFlashcards: 20, maxQuizQuestions: 20)");
                        }
                });

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
                        student.setMaxStorageBytes(100L * 1024 * 1024);

                        userRepository.save(student);

                        System.out.println("Seeded default users");
                }

                Role studentRole = roleRepository
                                .findByName("STUDENT")
                                .orElseThrow();

                // Seed additional creators if not already present
                String[][] mockUsers = {
                                { "Hoàng Huân", "hoanghuan@example.com", "hoanghuan123", "FPT", "FPT University",
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
                                u.setMaxStorageBytes(100L * 1024 * 1024);

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
                          /*
                 * =========================
                 * SCHOOL, MAJOR, AND COURSE
                 * =========================
                 */
                School fpt = getOrCreateSchool("FPT", "FPT University", "FPT University Vietnam");
                School hcmus = getOrCreateSchool("HCMUS", "University of Science", "VNUHCM - University of Science");
                School uit = getOrCreateSchool("UIT", "University of Information Technology", "VNUHCM - UIT");
                School hust = getOrCreateSchool("HUST", "Hanoi University of Science and Technology", "Hanoi, Vietnam");
                School neu = getOrCreateSchool("NEU", "National Economics University", "Hanoi, Vietnam");
                School ueh = getOrCreateSchool("UEH", "University of Economics Ho Chi Minh City", "Ho Chi Minh City, Vietnam");

                // FPT Majors & Courses
                Major fptSe = getOrCreateMajor(fpt, "SE", "Software Engineering", "Software Engineering major");
                getOrCreateCourse(fptSe, "SWP391", "Software Architecture and Design", "Core architecture concepts and design patterns");
                getOrCreateCourse(fptSe, "PRF192", "Programming Fundamentals", "Introduction to programming using Java");
                getOrCreateCourse(fptSe, "DBI202", "Database Systems", "Relational database design and SQL");
                getOrCreateCourse(fptSe, "WEB301", "Web Application Development", "Building web applications");
                getOrCreateCourse(fptSe, "PRJ301", "Java Web Application Development", "Advanced Java web development");
                getOrCreateCourse(fptSe, "SSG104", "Understanding Group Dynamics", "Teamwork and communication");
                getOrCreateCourse(fptSe, "MAD101", "Mobile Application Development", "Mobile app development fundamentals");

                Major fptAi = getOrCreateMajor(fpt, "AI", "Artificial Intelligence", "Artificial Intelligence major");
                getOrCreateCourse(fptAi, "AI101", "Introduction to AI", "Artificial Intelligence basics");
                getOrCreateCourse(fptAi, "MLN201", "Machine Learning Fundamentals", "Core machine learning algorithms");
                getOrCreateCourse(fptAi, "DLP301", "Deep Learning & Neural Networks", "Deep neural network architectures");

                Major fptBa = getOrCreateMajor(fpt, "BA", "Business Administration", "Business Administration major");
                getOrCreateCourse(fptBa, "MGT101", "Fundamentals of Management", "Basic principles of business management");
                getOrCreateCourse(fptBa, "MKT101", "Principles of Marketing", "Introduction to marketing strategies");
                getOrCreateCourse(fptBa, "FIN201", "Corporate Finance", "Financial planning and corporate finance");

                Major fptGd = getOrCreateMajor(fpt, "GD", "Graphic Design", "Graphic Design major");
                getOrCreateCourse(fptGd, "DES101", "Fundamentals of Graphic Design", "Design principles and visual typography");
                getOrCreateCourse(fptGd, "UIX201", "UI/UX Design & Prototyping", "User interface and experience design");

                Major fptIs = getOrCreateMajor(fpt, "IS", "Information Security", "Information Security major");
                getOrCreateCourse(fptIs, "SEC201", "Network Security Fundamentals", "Network security protocols and defense");
                getOrCreateCourse(fptIs, "CYB301", "Cybersecurity & Ethical Hacking", "Ethical hacking and threat analysis");

                // HCMUS Majors & Courses
                Major hcmusCs = getOrCreateMajor(hcmus, "CS", "Computer Science", "Computer Science major");
                getOrCreateCourse(hcmusCs, "CSC10001", "Introduction to Computer Science", "Basics of computer science and algorithms");
                getOrCreateCourse(hcmusCs, "CSC10002", "Data Structures and Algorithms", "Core data structures and algorithmic complexity");
                getOrCreateCourse(hcmusCs, "CSC10003", "Object-Oriented Programming", "OOP principles and design patterns");

                Major hcmusDs = getOrCreateMajor(hcmus, "DS", "Data Science", "Data Science major");
                getOrCreateCourse(hcmusDs, "DSE20001", "Applied Statistics for Data Science", "Statistical modeling and analysis");
                getOrCreateCourse(hcmusDs, "DSE20002", "Big Data Analytics", "Distributed data processing and analytics");

                // UIT Majors & Courses
                Major uitIt = getOrCreateMajor(uit, "IT", "Information Technology", "Information Technology major");
                getOrCreateCourse(uitIt, "IT001", "Introduction to Programming", "Foundations of computer programming");
                getOrCreateCourse(uitIt, "IT002", "Object-Oriented Programming", "OOP concepts and C++ implementation");
                getOrCreateCourse(uitIt, "IT003", "Data Structures & Algorithms", "Data structures fundamentals");

                Major uitSe = getOrCreateMajor(uit, "SE", "Software Engineering", "Software Engineering major");
                getOrCreateCourse(uitSe, "SE104", "Software Engineering Fundamentals", "Software development lifecycle");
                getOrCreateCourse(uitSe, "SE347", "Agile Software Development", "Scrum, Kanban, and modern Agile methods");

                Major uitCe = getOrCreateMajor(uit, "CE", "Computer Engineering", "Computer Engineering major");
                getOrCreateCourse(uitCe, "CE118", "Digital System Design", "Logic gates and digital circuit design");
                getOrCreateCourse(uitCe, "CE213", "Microprocessors & Microcontrollers", "Embedded systems programming");

                // HUST Majors & Courses
                Major hustIt = getOrCreateMajor(hust, "IT", "Information Technology", "Information Technology major");
                getOrCreateCourse(hustIt, "IT3011", "Data Structures and Algorithms", "Advanced data structures and problem solving");
                getOrCreateCourse(hustIt, "IT3020", "Database Management Systems", "Relational databases and SQL optimization");

                Major hustEe = getOrCreateMajor(hust, "EE", "Electrical Engineering", "Electrical Engineering major");
                getOrCreateCourse(hustEe, "EE2010", "Electric Circuits Analysis", "Circuit theorems and AC/DC analysis");
                getOrCreateCourse(hustEe, "EE3020", "Control Systems Theory", "Feedback control systems and robotics");

                // NEU Majors & Courses
                Major neuMkt = getOrCreateMajor(neu, "MKT", "Marketing", "Marketing major");
                getOrCreateCourse(neuMkt, "MKT1101", "Principles of Marketing", "Core concepts of market analysis");
                getOrCreateCourse(neuMkt, "MKT2105", "Digital Marketing Strategy", "SEO, Social Media, and Content Marketing");

                Major neuFin = getOrCreateMajor(neu, "FIN", "Finance & Banking", "Finance & Banking major");
                getOrCreateCourse(neuFin, "FIN1102", "Money and Banking", "Monetary policy and financial systems");
                getOrCreateCourse(neuFin, "FIN2104", "Investment Analysis", "Portfolio management and stock evaluation");

                // UEH Majors & Courses
                Major uehAcc = getOrCreateMajor(ueh, "ACC", "Accounting", "Accounting major");
                getOrCreateCourse(uehAcc, "ACC507001", "Financial Accounting", "Financial statements and accounting standards");
                getOrCreateCourse(uehAcc, "ACC507002", "Management Accounting", "Cost management and decision making");

                Major uehIb = getOrCreateMajor(ueh, "IB", "International Business", "International Business major");
                getOrCreateCourse(uehIb, "BUS503001", "International Business Management", "Global market strategies and trade");
                getOrCreateCourse(uehIb, "BUS503002", "Supply Chain & Logistics", "Global supply chain management");

                System.out.println("Seeded schools, majors, and courses");          }

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

        private School getOrCreateSchool(String code, String name, String description) {
                return schoolRepository.findByCode(code).orElseGet(() ->
                        schoolRepository.save(School.builder()
                                        .code(code)
                                        .name(name)
                                        .description(description)
                                        .build())
                );
        }

        private Major getOrCreateMajor(School school, String code, String name, String description) {
                return majorRepository.findBySchoolIdAndCode(school.getId(), code).orElseGet(() ->
                        majorRepository.save(Major.builder()
                                        .school(school)
                                        .code(code)
                                        .name(name)
                                        .description(description)
                                        .build())
                );
        }

        private Course getOrCreateCourse(Major major, String code, String name, String description) {
                return courseRepository.findByMajorIdAndCode(major.getId(), code).orElseGet(() -> {
                        Course course = new Course(code, name, description);
                        course.setMajor(major);
                        return courseRepository.save(course);
                });
        }
}
