import { Users, Tag, Settings, LayoutDashboard, Trash2 } from "lucide-react";
import type { ElementType } from "react";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "GUEST";

export interface NavItem {
  label: string;
  path: string; // This will now be the base path (e.g., "user")
  icon: ElementType;
  roles: UserRole[];
  permissions?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Users",
    path: "user",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Articles",
    path: "article",
    icon: Tag,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Trash",
    path: "trash",
    icon: Trash2,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Settings",
    path: "setting",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

export const getRolePrefix = (role: UserRole): string => {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN":
      return "/admin";
    default:
      return "";
  }
};
