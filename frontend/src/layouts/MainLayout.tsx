import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const MainLayout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-8 lg:p-10">
        <div className="mx-auto space-y-8 animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
