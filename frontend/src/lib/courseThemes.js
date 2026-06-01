import {
  BookOpen,
  Code,
  Database,
  Brain,
  Globe,
  Smartphone,
} from "lucide-react";

export const courseThemes = [
  {
    banner: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    banner: "from-green-500 to-emerald-500",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    banner: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    banner: "from-orange-500 to-red-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    banner: "from-indigo-500 to-blue-500",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
];

export const getCourseTheme = (courseCode = "") => {
  const hash = courseCode
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return courseThemes[hash % courseThemes.length];
};

const icons = [BookOpen, Code, Database, Brain, Globe, Smartphone];

export const getCourseIcon = (courseCode = "") => {
  const hash = courseCode
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return icons[hash % icons.length];
};
