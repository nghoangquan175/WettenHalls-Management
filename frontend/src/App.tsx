import { RouterProvider } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { router } from "./routes/AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache by default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isInitializing } = useAuth();
  const [showSlowConnection, setShowSlowConnection] = useState(false);

  useEffect(() => {
    let timeout: any;
    if (isInitializing) {
      timeout = setTimeout(() => setShowSlowConnection(true), 8000);
    }
    return () => clearTimeout(timeout);
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="DisplayXLBold text-primary mb-8 tracking-widest animate-pulse">WETTENHALLS</h1>
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="ContentSBold text-gray-500 mb-2">Initializing Management System...</p>
        {showSlowConnection && (
          <p className="ContentSMedium text-warning animate-in fade-in duration-500">
            Connection is slower than expected. Please check your network.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Outfit, sans-serif',
            borderRadius: '16px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
