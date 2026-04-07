import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, ChevronRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { getRolePrefix } from "../../constants/navigation";
import { cn } from "../../utils/cn";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";

// Define Form Schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, connectionError, authError, clearAuthError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (isLoading) return;
    setIsLoading(true);
    setApiError(null);
    clearAuthError();

    try {
      const result = await authService.login(data.email, data.password);
      
      login({
        id: result.user.id,
        name: result.user.name,
        role: result.user.role as any,
      });
      
      const prefix = getRolePrefix(result.user.role as any);
      navigate(prefix || "/");
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="DisplayXLBold text-gray-900 tracking-tight uppercase">WETTENHALLS</h1>
        <p className="ContentMRegular text-gray-400">
          Sign In to WettenHalls Management System.
        </p>
      </div>

      {authError ? (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
           <AlertCircle className="w-5 h-5 text-danger shrink-0" />
           <p className="ContentSMedium text-danger">{authError}</p>
        </div>
      ) : connectionError && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <p className="ContentSMedium text-warning">Unable to reach the server. Some features may be unavailable.</p>
        </div>
      )}

      {apiError && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <p className="ContentSMedium text-danger">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="login-email" className="ContentSBold text-gray-700 ml-1">Email Address</label>
            <div className="relative group">
              <div className={cn(
                "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200",
                errors.email ? "text-danger" : "text-gray-400 group-focus-within:text-primary"
              )}>
                <Mail className="w-5 h-5" />
              </div>
              <input
                {...register("email")}
                id="login-email"
                type="email"
                autoComplete="email"
                className={cn(
                  "w-full bg-gray-50 border rounded-xl py-3 pl-11 pr-4 ContentMRegular transition-all focus:outline-none focus:ring-2",
                  errors.email 
                    ? "border-danger bg-danger/5 focus:ring-danger/20" 
                    : "border-gray-200 focus:bg-white focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="name@company.com"
              />
            </div>
            {errors.email && (
              <p className="ContentSMedium text-danger flex items-center gap-1.5 ml-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="login-password" className="ContentSBold text-gray-700 ml-1">Password</label>
            <div className="relative group">
              <div className={cn(
                "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200",
                errors.password ? "text-danger" : "text-gray-400 group-focus-within:text-primary"
              )}>
                <Lock className="w-5 h-5" />
              </div>
              <input
                {...register("password")}
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={cn(
                  "w-full bg-gray-50 border rounded-xl py-3 pl-11 pr-12 ContentMRegular transition-all focus:outline-none focus:ring-2",
                  errors.password 
                    ? "border-danger bg-danger/5 focus:ring-danger/20" 
                    : "border-gray-200 focus:bg-white focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 rounded-lg h-full"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="ContentSMedium text-danger flex items-center gap-1.5 ml-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4" />
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-12 text-base font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
          isLoading={isLoading}
          rightIcon={<ChevronRight className="w-5 h-5" />}
        >
          Sign In
        </Button>
      </form>

      <div className="pt-6 border-t border-gray-100 mt-2">
        <p className="text-center text-xs text-gray-400 tracking-widest uppercase font-bold flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          System Status: Online
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
