export default function useMaterialStatus(status) {
  return {
    isDraft: status === "DRAFT",
    isPublished: status === "PUBLISHED",
    isArchived: status === "ARCHIVED",
  };
}
