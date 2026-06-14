Implementation Plan - Upgrade Schema to School -> Major -> Course

This implementation plan details the changes required to upgrade the application's data structure to support multiple majors within schools, resolve unique constraints, update search, and create the Admin Dashboard interface for Majors.

User Review Required
Please review the following design and migration implications:

WARNING

Existing Course Data & Nullable major_id Existing courses in the database currently do not have a major_id. To avoid migration errors when updating the schema:

We will make the major relationship in Course.java nullable at the database/JPA level.
We will run a startup data initialization script to create default Majors (e.g., Software Engineering, Artificial Intelligence, Business Administration) for FPT University and assign existing courses to their corresponding majors.

IMPORTANT

Unique Constraints Resolution

The courses table currently has a global unique constraint on code (uk_61og8rbqdd2y28rx2et5fdnxd). This constraint must be dropped to allow the same course code (e.g., SWP391) in different majors.
We will add a startup migration hook using a native SQL query: ALTER TABLE courses DROP CONSTRAINT IF EXISTS uk_61og8rbqdd2y28rx2et5fdnxd; to automate this drop.
We will declare new composite unique constraints via JPA:
For Major: unique within (school_id, code)
For Course: unique within (major_id, code)
IMPORTANT

Document Upload Flow Improvements Previously, document upload resolved courses by a global course code. Since course codes are now unique only within a Major, resolving by code alone is ambiguous.

Change: The upload dialog on the frontend will be updated to select School -> Major -> Course.
If the course exists, the frontend sends courseId directly.
If a new course is being created, the frontend sends majorId, courseCode, and courseName to enable creation under the correct major.
Proposed Changes

1. Database Migration & Entity Schema
   [NEW]
   Major.java
   Create the Major entity extending BaseEntity with fields:

name (String, non-null)
code (String, non-null)
description (String)
school (ManyToOne, non-null)
courses (OneToMany, mappedBy = "major", JSON-ignored)
Table-level unique constraint on (school_id, code).
[MODIFY]
School.java
Add relationship to Majors:

java

@OneToMany(mappedBy = "school", cascade = CascadeType.ALL)
@JsonIgnore
private List<Major> majors;
[MODIFY]
Course.java
Remove unique = true from @Column on code.
Add relationship to Major:
java

@ManyToOne
@JoinColumn(name = "major_id", nullable = true)
private Major major;
Add table-level unique constraint on (major_id, code). 2. Backend Repositories, Services, and Controllers
[NEW]
MajorRepository.java
Standard JPA repository. Add lookup queries:

existsBySchoolIdAndCode(UUID schoolId, String code);
existsBySchoolIdAndCodeAndIdNot(UUID schoolId, String code, UUID id);
List<Major> findBySchoolId(UUID schoolId);
[NEW]
CreateMajorRequest.java
DTO for creation/update: name, code, description, schoolId.

[NEW]
MajorResponse.java
DTO for responses: contains id, name, code, description, schoolId, schoolName, schoolCode, createdAt, updatedAt.

[NEW]
MajorService.java
&
MajorServiceImpl.java
Standard CRUD implementations, checking code uniqueness within a school.

[NEW]
MajorController.java
REST Controller exposing:

POST /api/majors (Admin)
GET /api/majors (Public, supports optional schoolId filter)
GET /api/majors/{id} (Public)
PUT /api/majors/{id} (Admin)
DELETE /api/majors/{id} (Admin)
[MODIFY]
SecurityConfig.java
Configure security rules for /api/majors/\*\* (permit GET, protect POST/PUT/DELETE for ADMIN).

[MODIFY]
CreateCourseRequest.java
&
CourseServiceImpl.java
Add majorId to creation request.
Update Course creation service to assign Course to Major.
Add filtering/searching courses by majorId.
[MODIFY]
DataInitializer.java
Add startup execution of native SQL to drop old course code unique constraint.
Initialize default Majors.
Map default courses to Software Engineering and Artificial Intelligence majors. 3. Search Enhancements
[MODIFY]
DocumentRepository.java
Update JPQL query in searchPublicByMetadata to join c.major m and m.school s and filter on:

m.code and m.name
s.code and s.name
[MODIFY]
DocumentDiscoveryServiceImpl.java
Update buildSearchableMetadata to append course's major code/name and major's school code/name.

[MODIFY]
DocumentResponse.java
&
DocumentDetailResponse.java
Enhance CourseInfo in response DTOs to nest Major and School details. Map these in DocumentServiceImpl.java.

4. Frontend Components & UI Breadcrumbs
   [MODIFY]
   BaseCrud.jsx
   Support Editing (Pencil edit icon, Edit state handling, PUT request support).
   Support "select" and "textarea" field types.
   Add onFieldChange callback to support dependent fields.
   [NEW]
   CatalogMajorsPage.jsx
   Administrative CRUD page for Major management using the enhanced BaseCrud. Let admins select the School for each Major.

[MODIFY]
CatalogCoursesPage.jsx
Update Course management form fields to select School, then Major, then Course.

[MODIFY]
SettingsPage.jsx
Map /admin/settings route to SettingsPage in App.jsx instead of a Coming Soon placeholder.
Add Majors tab to display CatalogMajorsPage.
[MODIFY]
AdminSidebar.jsx
Add navigation item for Majors.

[MODIFY]
DashboardPage.jsx
&
DashboardController.java
Incorporate Major counts in backend stats and render a "Total Majors" card on the admin home panel.

[MODIFY]
CourseDetailPage.jsx
Replace the hardcoded University / FPT / {code} breadcrumb with dynamic values loaded from the course API: {course.major.school.name} / {course.major.name} / {course.code}.

[MODIFY]
Homepage.jsx
Update document client-side search filtering to check title, course, major, and school properties.

[MODIFY]
UploadDocumentDialog.jsx
Enhance document uploads:

Selecting a School filters available Majors.
Selecting a Major filters available Courses.
Send courseId for existing courses or majorId for new courses during upload.
Verification Plan
Automated Tests
Run backend tests to verify build compilation: mvn clean test-compile
Run application and verify database schema generation under Neon Postgres.
Manual Verification
Login as admin, go to Catalog Management -> Majors tab:
Create, list, edit, and delete Majors.
Go to Catalog Management -> Courses tab:
Verify selecting School and Major before creating a Course.
Open a Course detail page (e.g. http://localhost:5173/courses/{id}) and verify that the breadcrumb correctly reflects the database school name and major name.
Try searching for documents on the Homepage using school name, school code, major name, major code, course name, and course code to verify the updated filtering logic.
Open the Upload Dialog:
Select a School -> check if Majors update.
Select a Major -> check if Courses update.
Upload a document and verify that it links correctly.
