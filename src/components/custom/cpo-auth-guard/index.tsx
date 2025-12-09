"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cpoAuth } from "@/functions/cpo-auth";
import { Icons } from "@/components/icons";

interface CPOAuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const CPOAuthGuard = ({ children, requiredPermission }: CPOAuthGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!cpoAuth.isAuthenticated()) {
          router.push("/cpo-portal/login");
          return;
        }

        // Verify token validity
        const isValidToken = await cpoAuth.verifyToken();
        if (!isValidToken) {
          router.push("/cpo-portal/login");
          return;
        }

        // Check specific permission if required
        if (requiredPermission && !cpoAuth.hasPermission(requiredPermission)) {
          router.push("/admin"); // Redirect to dashboard if no permission
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/cpo-portal/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredPermission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icons.LoadingIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect, so don't render anything
  }

  return <>{children}</>;
};

export default CPOAuthGuard;