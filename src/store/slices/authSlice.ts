
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { setUser } from '@app/store/slices/userSlice';
import { UserModel } from '@app/domain/UserModel';
import {
  ResetPasswordRequest,
  login,
  LoginRequest,
  signUp,
  SignUpRequest,
  resetPassword,
  verifySecurityCode,
  SecurityCodePayload,
  NewPasswordData,
  setNewPassword,
  LoginResponse,
} from '@app/api/auth.api';
import { deleteToken, deleteUser, persistToken, readToken, persistUser } from '@app/services/localStorage.service';
import axios from 'axios';
export interface AuthSlice {
  token: string | null;
}

const initialState: AuthSlice = {
  token: readToken(),
};


const fetchUserData = async (token: string): Promise<UserModel> => {
  // Set the authorization header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.defaults.headers.common['Content-Type'] = 'application/json';

  const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/me`); 
  const user = response.data;

  // Map the response to match the UserModel structure
  const mappedUser: UserModel = {
    id: user.id,
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    location: user?.location || '',
    imgUrl: user.avatar || '',
    userName: user.username || '',
    email: user.email || { name: '', verified: false },
    phone: user.phone || { number: '', verified: false },
    sex: user.sex || 'male',
    birthday: user.birthday || '',
    lang: user.lang || 'en',
    country: user.country || '',
    city: user.city || '',
    address1: user.address1 || '',
    address2: user.address2 || '',
    zipcode: user.zipcode || 0,
    website: user.website || '',
    socials: user.socials || {},
  };

  return mappedUser;
};

export const doLogin = createAsyncThunk('auth/doLogin', async (loginPayload: LoginRequest, { dispatch }) => {
  const res: LoginResponse = await login(loginPayload);

  const { access_token, refresh_token, expires } = res.data; // Extract tokens from the response

  if (!access_token) {
    throw new Error('Access token is missing in the response');
  }

  // Fetch user data using the access token
  const user = await fetchUserData(access_token);

  dispatch(setUser(user));
  persistToken(access_token); // Persist the token
  persistUser(user); // Persist the user data
  return access_token; // Return the token
});

export const doSignUp = createAsyncThunk('auth/doSignUp', async (signUpPayload: SignUpRequest) =>
  signUp(signUpPayload),
);

export const doResetPassword = createAsyncThunk(
  'auth/doResetPassword',
  async (resetPassPayload: ResetPasswordRequest) => resetPassword(resetPassPayload),
);

export const doVerifySecurityCode = createAsyncThunk(
  'auth/doVerifySecurityCode',
  async (securityCodePayload: SecurityCodePayload) => verifySecurityCode(securityCodePayload),
);

export const doSetNewPassword = createAsyncThunk('auth/doSetNewPassword', async (newPasswordData: NewPasswordData) =>
  setNewPassword(newPasswordData),
);

export const doLogout = createAsyncThunk('auth/doLogout', (_payload_, { dispatch }) => {
  deleteToken();
  deleteUser();
  dispatch(setUser(null));
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(doLogin.fulfilled, (state, action) => {
      state.token = action.payload; // Update the state with the token
    });
  },
});

export default authSlice.reducer;
