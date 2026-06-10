export const PAGE_TITLES = {
  "/": "Dashboard",
  "/ai-flashcard": "Flashcards",
  "/ai-quiz": "Quiz",
  "/library": "Library",
  "/study-sets": "Study Sets",
  "/profile": "Profile",
  "/admin": "Admin Panel",
};

export const updateTitle = (pathname) => {
  let page = PAGE_TITLES[pathname];

  if (!page) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      page = segments
        .map(
          (segment) =>
            segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
        )
        .join(" - ");
    } else {
      page = "Dashboard";
    }
  }

  document.title = `Mindocu | ${page}`;
};
