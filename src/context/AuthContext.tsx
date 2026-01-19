import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useMemo
} from "react";
import { UserModel } from "@/types/user.types";
import { LoginRequest, login as loginApi } from "@/api/auth.api";
import { httpApi } from "@/api/http.api";
import {
  persistToken,
  persistUser,
  readToken,
  readUser,
  deleteToken,
  deleteUser
} from "@/services/localStorage.service";

interface AuthContextType {
  user: UserModel | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (loginPayload: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserModel | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = () => {
      const storedToken = readToken();
      const storedUser = readUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
      setIsLoading(false);
    };

    bootstrap();
  }, []);

  const login = async (loginPayload: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("AuthContext: Starting login API call...");
      const response = await loginApi(loginPayload);
      console.log("AuthContext: Full API response:", response);

      const { access_token } = response.data;
      console.log("AuthContext: Got access_token:", access_token);

      if (!access_token) {
        throw new Error('Access token is missing in the response');
      }

      // Fetch user data using the access token
      console.log("AuthContext: Fetching user profile from /users/me...");
      const userResponse = await httpApi.get('/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      console.log("AuthContext: User profile response:", userResponse.data);
      const apiUser = userResponse.data;

      // Map the response to match the UserModel structure (like legacy client)
      const userData: UserModel = {
        id: apiUser.id,
        first_name: apiUser?.first_name || '',
        last_name: apiUser?.last_name || '',
        location: apiUser?.location || '',
        imgUrl: apiUser.avatar || '',
        userName: apiUser.username || '',
        email: apiUser.email || { name: '', verified: false },
        phone: apiUser.phone || { number: '', verified: false },
        sex: apiUser.sex || 'male',
        birthday: apiUser.birthday || '',
        lang: apiUser.lang || 'en',
        country: apiUser.country || '',
        city: apiUser.city || '',
        address1: apiUser.address1 || '',
        address2: apiUser.address2 || '',
        zipcode: apiUser.zipcode || 0,
        website: apiUser.website || '',
        socials: apiUser.socials || {},
      };

      console.log("AuthContext: Mapped user data:", userData);
      console.log("AuthContext: User location:", userData.location);
      setToken(access_token);
      setUser(userData);

      persistToken(access_token);
      persistUser(userData);

      console.log("AuthContext: State updated, setting isLoading to false");
      setIsLoading(false);
    } catch (err) {
      console.error('Login failed:', err);
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    deleteToken();
    deleteUser();
  };

  const isAuthenticated = !!token;

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated
  }), [user, token, isLoading, error, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
