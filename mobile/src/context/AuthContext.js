import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthFailureHandler } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    const unregister = setAuthFailureHandler(() => {
      setToken(null);
      setUser(null);
      setAccountType(null);
    });

    return unregister;
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      const storedAccountType = await AsyncStorage.getItem("accountType");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAccountType(storedAccountType || "user");
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken, type = "user") => {
    try {
      await AsyncStorage.setItem("token", authToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem("accountType", type);
      setToken(authToken);
      setUser(userData);
      setAccountType(type);
    } catch (error) {
      console.error("Error saving auth:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "accountType"]);
      setToken(null);
      setUser(null);
      setAccountType(null);
    } catch (error) {
      console.error("Error removing auth:", error);
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        accountType,
        login,
        logout,
        loading,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
