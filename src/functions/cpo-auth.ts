import Api from "@/apis/Api";

export interface CPOUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "cpo" | "admin";
  permissions: {
    [key: string]: boolean;
  };
  company_name?: string;
  is_active: boolean;
  last_login: Date;
  created_at: Date;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: CPOUser;
  message?: string;
}

export const cpoAuth = {
  // Login function
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await Api.post("/cpo-auth/login", {
        body: { email, password }
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed"
      };
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): CPOUser | null => {
    if (typeof window === "undefined") return null;
    
    const userStr = localStorage.getItem("cpo_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token from localStorage
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    
    return localStorage.getItem("cpo_token");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!(cpoAuth.getToken() && cpoAuth.getCurrentUser());
  },

  // Logout function
  logout: (): void => {
    if (typeof window === "undefined") return;
    
    localStorage.removeItem("cpo_token");
    localStorage.removeItem("cpo_user");
    window.location.href = "/cpo-portal/login";
  },

  // Verify token validity
  verifyToken: async (): Promise<boolean> => {
    try {
      const token = cpoAuth.getToken();
      if (!token) return false;

      const response = await Api.get("/cpo-auth/verify", {
        session: { token }
      });
      
      return response.success;
    } catch (error) {
      return false;
    }
  },

  // Check user permissions
  hasPermission: (permission: string): boolean => {
    const user = cpoAuth.getCurrentUser();
    return user?.permissions?.[permission] || false;
  }
};