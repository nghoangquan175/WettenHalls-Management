import { type ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
