# Course Tag School Category

## Purpose

Document catalog metadata used by documents, profiles, following, filtering, and discovery.

## Entity files

- `course/entity/Course.java`
- `tag/entity/Tag.java`
- `school/entity/School.java`
- `category/entity/Category.java`
- Related: `auth/entity/Language.java`

## Important fields

- Course: unique code, name, description
- Tag: unique name
- School: unique code, name, description
- Category: unique name/code, description, icon, color, active, documentCount

## Relationships

- Course one-to-many Document and many-to-many followers through User
- Document many-to-many Tag
- Document many-to-one Category
- School is not directly related to Document; uploader profile stores schoolCode/schoolName

## Used by which modules

Catalog APIs/admin, document upload and filtering, user profile/survey, course following, and Homepage discovery.

## Persistence caveats

- Category delete is soft-delete by active flag; School/Tag/Course deletes are repository deletes.
- Category `documentCount` is stored, while Course document count is transient.
- School/profile linkage is represented by copied code/name, not a JPA relationship.

## Related notes

- [[Catalog API]]
- [[Course Tag School Category Module]]
- [[Document DocumentChunk DocumentView]]
- [[Profile Notification]]
