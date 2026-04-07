import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, getRolePrefix } from "../../constants/navigation";
import { Button } from "../ui/Button/Button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../contexts/AuthContext";
import { formatRoleName } from "../../utils/format";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const filteredNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(user.role)),
    [user.role]
  );

  const prefix = getRolePrefix(user.role);

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0">
      {/* Top: Branding */}
      <div className="p-6 border-b border-gray-100 mb-4">
        <h1 className="DisplayLBold text-primary tracking-tight uppercase">
          WETTENHALLS
        </h1>
      </div>

      {/* Middle: Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const fullPath = `${prefix}/${item.path}`.replace(/\/$/, "");

          return (
            <NavLink
              key={item.path}
              to={fullPath}
              end={item.path === ""}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group cursor-pointer",
                  "ContentMMedium text-gray-600 hover:bg-gray-100 hover:text-primary",
                  isActive && "bg-primary/10 text-primary border-r-4 border-primary rounded-r-none"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-gray-400 group-hover:text-primary"
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: User Profile & Logout */}
      <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary ContentMBold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="ContentMMedium text-gray-900 truncate">
              {user.name}
            </span>
            <span className="ContentSMedium text-gray-500 uppercase text-[10px] tracking-wider">
              {formatRoleName(user.role)}
            </span>
          </div>
        </div>
        
        <Button
          variant="danger"
          className="w-full justify-start gap-3 h-11"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
