import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { storage } from '../../utils/storage';
import { User } from '../../types/user';
import { API_URL } from '../../utils/constants';

console.log('[AUTH] API_URL at module load:', API_URL);

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoggedIn: false,
  loading: false,
  error: null,
};

// Backend ba'zi xabarlarni inglizcha qaytaradi — UI o'zbekcha bo'lishi shart.
const ERROR_TRANSLATIONS: Record<string, string> = {
  'Invalid credentials': 'Email yoki parol noto\'g\'ri',
  'Invalid or expired code': 'Kod noto\'g\'ri yoki muddati tugagan',
  'Email not verified': 'Email tasdiqlanmagan. Tasdiqlash uchun ro\'yxatdan qaytadan o\'ting.',
};

const pickError = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  if (data) {
    // 1. Array of validation errors (e.g., [{ msg: '...', param: '...' }])
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const parts = data.errors.map((e: any) => e.msg || e.message).filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    // 2. Direct message
    const msg = data.message;
    if (typeof msg === 'string' && msg.length > 0) return ERROR_TRANSLATIONS[msg] ?? msg;
    // 3. Direct error field
    const err = data.error;
    if (typeof err === 'string' && err.length > 0) return ERROR_TRANSLATIONS[err] ?? err;
  }
  if (error?.message === 'Network Error') return 'Internet aloqasini tekshiring';
  return fallback;
};

// Login muvaffaqiyatli bo'lsa token axiosInstance interceptori orqali
// allaqachon saqlangan bo'ladi (body'dan) — shu yerda faqat o'qiymiz.
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    // Backend emaillarni odatda lowercase saqlaydi — case mismatch oldini olamiz.
    const email = credentials.email.trim().toLowerCase();
    console.log('[LOGIN] →', { email, passwordLength: credentials.password?.length });
    try {
      const response = await axiosInstance.post('/auth/login', { email, password: credentials.password });
      console.log('[LOGIN] ← OK', response.status, JSON.stringify(response.data).slice(0, 300));
      let user = response.data?.data?.user ?? response.data?.user ?? null;
      const token = await storage.getToken();
      if (!user || !token) {
        return rejectWithValue('Kirishda xatolik yuz berdi');
      }

      // Mahalliy keshdagi avatarni tekshirish va biriktirish
      try {
        const localAvatar = await storage.getItem(`custom_avatar_${user.username}`);
        if (localAvatar) {
          console.log('[LOGIN] Merging locally stored avatar:', localAvatar);
          user = { ...user, avatar: localAvatar };
          await storage.setItem('custom_avatar', localAvatar);
        }
      } catch (err) {
        console.log('[LOGIN] Error loading custom avatar from storage:', err);
      }

      return { user, token };
    } catch (error: any) {
      const resp = error?.response;
      const dataStr = resp?.data ? JSON.stringify(resp.data).slice(0, 300) : '(no response body)';
      console.log('[LOGIN] ← ERROR status:', resp?.status ?? '(no status)', 'data:', dataStr, 'axiosMsg:', error?.message, 'code:', error?.code);
      // Email tasdiqlanmagan bo'lsa backend 403 + requiresEmailVerification qaytaradi.
      // Foydalanuvchini avtomatik tasdiqlash ekraniga otkazmaymiz (chalkash UX) —
      // shunchaki aniq xato xabari ko'rsatamiz. requiresEmailVerification flagini
      // payload ichida saqlaymiz: RegisterScreen auto-login fallback uchun ishlatadi.
      if (resp?.status === 403 && resp?.data?.requiresEmailVerification) {
        return rejectWithValue({
          requiresEmailVerification: true,
          email: resp.data?.email ?? email,
          message: 'Email tasdiqlanmagan. Tasdiqlash uchun ro\'yxatdan qaytadan o\'ting.',
        });
      }
      return rejectWithValue(pickError(error, 'Email yoki parol noto\'g\'ri'));
    }
  }
);

// Google bilan kirish — mobil ilova Google id_token oladi, backend uni tekshiradi
// va odatiy login javobini (user + token body'da) qaytaradi. Token axiosInstance
// interceptori orqali allaqachon saqlangan bo'ladi — shu yerda faqat o'qiymiz.
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ idToken, referralCode }: { idToken: string; referralCode?: string }, { rejectWithValue }) => {
    try {
      // Backend 'credential' maydonini kutmoqda (idToken emas)
      const response = await axiosInstance.post('/auth/google', { credential: idToken, referralCode });
      let user = response.data?.data?.user ?? response.data?.user ?? null;
      const token = await storage.getToken();
      if (!user || !token) {
        return rejectWithValue('Google orqali kirishda xatolik yuz berdi');
      }

      // Mahalliy keshdagi avatarni tekshirish va biriktirish
      try {
        const localAvatar = await storage.getItem(`custom_avatar_${user.username}`);
        if (localAvatar) {
          console.log('[GOOGLE-LOGIN] Merging locally stored avatar:', localAvatar);
          user = { ...user, avatar: localAvatar };
          await storage.setItem('custom_avatar', localAvatar);
        }
      } catch (err) {
        console.log('[GOOGLE-LOGIN] Error loading custom avatar from storage:', err);
      }

      return { user, token };
    } catch (error: any) {
      return rejectWithValue(pickError(error, 'Google orqali kirishda xatolik'));
    }
  }
);

// Backend ro'yxatdan o'tishda sessiya bermaydi — email tasdiqlash kodini
// yuboradi (requiresEmailVerification). RegisterScreen auto-login urinadi;
// agar muvaffaqiyatsiz bo'lsa, fallback sifatida VerifyEmail ekraniga o'tadi.
export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    // Email lowercase qilamiz — login/forgot-password bilan mos kelishi uchun.
    const normalizedUserData = {
      ...userData,
      email: userData?.email?.trim().toLowerCase(),
    };
    console.log('[REGISTER] →', { email: normalizedUserData.email, username: normalizedUserData?.username, passwordLength: normalizedUserData?.password?.length });
    try {
      const response = await axiosInstance.post('/auth/register', normalizedUserData);
      console.log('[REGISTER] ← OK', response.status, JSON.stringify(response.data).slice(0, 300));
      const data = response.data ?? {};
      const user = data?.data?.user ?? data?.user ?? null;
      const token = await storage.getToken();
      // Ehtiyot shart: agar backend kelajakda to'g'ridan-to'g'ri sessiya bersa
      if (user && token) {
        return { user, token };
      }
      // Asosiy holat: email tasdiqlash talab qilinadi
      return {
        requiresEmailVerification: true,
        email: data?.email ?? normalizedUserData.email,
      };
    } catch (error: any) {
      const resp = error?.response;
      const dataStr = resp?.data ? JSON.stringify(resp.data).slice(0, 300) : '(no response body)';
      console.log('[REGISTER] ← ERROR status:', resp?.status ?? '(no status)', 'data:', dataStr, 'axiosMsg:', error?.message, 'code:', error?.code);
      return rejectWithValue(pickError(error, 'Ro\'yxatdan o\'tish amalga oshmadi'));
    }
  }
);

// Emailga kelgan 6 xonali kodni tekshiradi (auth talab qilinmaydi).
// MUHIM: bu `/verify-email-public` (email tasdiqlash) endpoint — NOT `/verify-code` (parol tiklash OTP).
// Backend kodni 15 daqiqa davomida amal qiladigan qilib saqlaydi va 5 ta noto'g'ri urinishdan keyin bekor qiladi.
export const verifyEmailCode = createAsyncThunk(
  'auth/verifyEmailCode',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    try {
      await axiosInstance.post('/auth/verify-email-public', { email: normalizedEmail, code: normalizedCode });
      return { email: normalizedEmail };
    } catch (error: any) {
      return rejectWithValue(pickError(error, 'Kod noto\'g\'ri yoki muddati tugagan'));
    }
  }
);

// --- Parol tiklash oqimi (3 bosqich) ---
// Backend xavfsizlik patterni: forgot → verify-code (resetToken qaytaradi) → reset-password.
// Bu pattern email + kod ham, yangi parol ham qo'lda bo'lishini talab qiladi.

// Bosqich 1: forgot-password — emailga 6 xonali kod yuboradi (10 daqiqa amal qiladi).
// Enumeration himoyasi uchun backend har doim 200 qaytaradi (email mavjud yoki yo'qligini bilmaymiz).
// MUHIM: emailni lowercase qilamiz — backend kodni lowercase email bo'yicha saqlaydi.
// Agar bu yerda case mos kelmasa, keyingi bosqich (verify-code) "Invalid or expired code" qaytaradi.
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[FORGOT-PASSWORD] →', { email: normalizedEmail, originalEmail: email });
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email: normalizedEmail });
      console.log('[FORGOT-PASSWORD] ← OK', response.status, JSON.stringify(response.data).slice(0, 200));
      return { email: normalizedEmail };
    } catch (error: any) {
      const resp = error?.response;
      console.log('[FORGOT-PASSWORD] ← ERROR status:', resp?.status, 'data:', resp?.data ? JSON.stringify(resp.data).slice(0, 200) : '(no body)');
      return rejectWithValue(pickError(error, 'Kodni yuborishda xatolik'));
    }
  }
);

// Bosqich 2: verify-code — kodni tekshiradi va bir martalik resetToken qaytaradi (15 daqiqa).
// MUHIM: email lowercase bo'lishi shart — aks holda backend kodni topa olmaydi va
// "Invalid or expired code" qaytaradi (bu Problem 3'ning eng ehtimoliy sababi).
export const verifyResetCode = createAsyncThunk(
  'auth/verifyResetCode',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    console.log('[VERIFY-CODE] →', { email: normalizedEmail, code: normalizedCode, codeLength: normalizedCode.length });
    try {
      const response = await axiosInstance.post('/auth/verify-code', { email: normalizedEmail, code: normalizedCode });
      console.log('[VERIFY-CODE] ← OK', response.status, JSON.stringify(response.data).slice(0, 200));
      const resetToken = response.data?.data?.resetToken ?? response.data?.resetToken;
      if (!resetToken) return rejectWithValue('Reset token olinmadi');
      return { resetToken };
    } catch (error: any) {
      const resp = error?.response;
      console.log('[VERIFY-CODE] ← ERROR status:', resp?.status, 'data:', resp?.data ? JSON.stringify(resp.data).slice(0, 200) : '(no body)', 'message:', error?.message);
      return rejectWithValue(pickError(error, 'Kod noto\'g\'ri yoki muddati tugagan'));
    }
  }
);

// Bosqich 3: reset-password — resetToken bilan yangi parol o'rnatadi.
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ resetToken, newPassword }: { resetToken: string; newPassword: string }, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/auth/reset-password', { resetToken, newPassword });
      return true;
    } catch (error: any) {
      return rejectWithValue(pickError(error, 'Parolni yangilashda xatolik'));
    }
  }
);

// Email tasdiqlash kodini qayta yuborish (auth talab qilinmaydi).
// Backend enumeration'dan himoyalanish uchun har doim bir xil javob qaytaradi.
export const resendVerificationCode = createAsyncThunk(
  'auth/resendVerificationCode',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await axiosInstance.post('/auth/resend-verification-public', { email: normalizedEmail });
      return { email: normalizedEmail };
    } catch (error: any) {
      return rejectWithValue(pickError(error, 'Kodni qayta yuborishda xatolik'));
    }
  }
);

// Profilni yangilash — backendga PUT /xp/profile yuboradi va mahalliy user'ni almashtiradi.
// Backend javobida user obyekti yangilangan holatda kelishi kutiladi; aks holda jo'natilgan
// patch'ni mahalliy user ustiga merge qilamiz (optimistik).
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (patch: Partial<{ firstName: string; lastName: string; avatar: string; bio: string }>, { rejectWithValue }) => {
    try {
      console.log('[UPDATE-PROFILE] Sending patch:', patch);
      const response = await axiosInstance.put('/xp/profile', patch);
      console.log('[UPDATE-PROFILE] Raw Response:', JSON.stringify(response.data));
      const data = response.data?.data;
      let updated = null;
      
      if (data?.user) {
        // Backend user obyektini alohida, avatar va bio-ni esa uning tashqarisida (data ichida) qaytargan.
        // Ularni yagona foydalanuvchi obyekti qilib birlashtiramiz (Redux interfeysiga moslash uchun).
        updated = {
          ...data.user,
          id: data.user.id || data.user._id,
          avatar: data.avatar || data.user.avatar || undefined,
          bio: data.bio || undefined,
        };
      } else {
        updated = data ?? response.data?.user ?? null;
      }
      
      if (updated?.avatar && updated?.username) {
        try {
          await storage.setItem(`custom_avatar_${updated.username}`, updated.avatar);
          await storage.setItem('custom_avatar', updated.avatar);
          console.log('[UPDATE-PROFILE] Saved custom avatar locally for username:', updated.username);
        } catch (err) {
          console.log('[UPDATE-PROFILE] Error saving custom avatar locally:', err);
        }
      }
      console.log('[UPDATE-PROFILE] Parsed user (with merged avatar):', updated);
      return { updated, patch };
    } catch (error: any) {
      return rejectWithValue(pickError(error, 'Profilni saqlashda xatolik'));
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await storage.getToken();
      if (!token) return null;
      console.log('[CHECK-AUTH] Fetching /auth/me...');
      const response = await axiosInstance.get('/auth/me');
      console.log('[CHECK-AUTH] Raw Response:', JSON.stringify(response.data));
      let user = response.data?.data?.user ?? response.data?.data ?? null;
      console.log('[CHECK-AUTH] Parsed user:', user);
      if (!user) {
        await storage.clearTokens();
        return rejectWithValue('Sessiya muddati tugagan');
      }

      // Mahalliy saqlangan avatarni yuklash va birlashtirish
      try {
        const localAvatar = (await storage.getItem(`custom_avatar_${user.username}`)) || (await storage.getItem('custom_avatar'));
        if (localAvatar && user) {
          console.log('[CHECK-AUTH] Merging locally stored avatar:', localAvatar);
          user = { ...user, avatar: localAvatar };
        }
      } catch (err) {
        console.log('[CHECK-AUTH] Error loading custom avatar from storage:', err);
      }

      return { user, token };
    } catch (error: any) {
      await storage.clearTokens();
      return rejectWithValue('Sessiya muddati tugagan');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.error = null;
      storage.clearTokens();
      storage.removeItem('custom_avatar');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    // Mahalliy holatda user maydonlarini patch qilish. UI uchun darhol natija;
    // backend bilan sinxronlash updateProfile thunk orqali alohida ketadi.
    updateUserLocal: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload } as User;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoggedIn = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        const payload = action.payload as any;
        // requiresEmailVerification holatida ham aniq xato xabarini ko'rsatamiz —
        // foydalanuvchi nima sodir bo'lganini bilishi shart (avtomatik navigatsiya yo'q).
        if (payload && typeof payload === 'object') {
          state.error = payload.message || 'Kirish amalga oshmadi';
        } else {
          state.error = (payload as string) || 'Kirish amalga oshmadi';
        }
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoggedIn = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.error = (action.payload as string) || 'Google orqali kirish amalga oshmadi';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        // Email tasdiqlash talab qilinsa — tizimga kirmaymiz, ekran VerifyEmail'ga o'tadi
        if (payload?.requiresEmailVerification) {
          return;
        }
        state.user = payload.user;
        state.token = payload.token;
        state.isLoggedIn = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.error = (action.payload as string) || 'Ro\'yxatdan o\'tishda xatolik';
      })
      .addCase(verifyEmailCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmailCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyEmailCode.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Kodni tasdiqlashda xatolik';
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isLoggedIn = true;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.user = null;
        state.token = null;
      })
      .addCase(updateProfile.pending, (state, action) => {
        // Optimistik: yuborilayotgan patch'ni darhol mahalliy user'ga qo'llaymiz.
        if (state.user) {
          state.user = { ...state.user, ...action.meta.arg } as User;
        }
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        // Backend updated user qaytarsa — uni qo'yamiz. Aks holda mahalliy patch saqlanadi.
        const { updated } = action.payload as any;
        if (updated) state.user = updated;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Profilni saqlashda xatolik';
      });
  },
});

export const { logout, clearAuthError, updateUserLocal } = authSlice.actions;
export default authSlice.reducer;
