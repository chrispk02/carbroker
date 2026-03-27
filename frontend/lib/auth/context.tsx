"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: "buyer" | "seller") => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, _password: string) => {
    // Mock login - in production, this would call an API
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: "1",
      name: email.split("@")[0],
      email,
      role: "buyer",
    };
    setUser(mockUser);
    return true;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, _password: string, role: "buyer" | "seller") => {
      // Mock signup - in production, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockUser: User = {
        id: "1",
        name,
        email,
        role,
      };
      setUser(mockUser);
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
