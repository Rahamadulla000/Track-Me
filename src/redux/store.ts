import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User, LocationRecord } from "../types";

// Helper to load state from localStorage
const loadInitialAuth = (): AuthState => {
  try {
    const token = localStorage.getItem("trackme_token");
    const userStr = localStorage.getItem("trackme_user");
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      loading: false,
      error: null,
    };
  } catch (e) {
    return {
      token: null,
      user: null,
      loading: false,
      error: null,
    };
  }
};

// Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialAuth(),
  reducers: {
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;
      try {
        localStorage.setItem("trackme_token", action.payload.token);
        localStorage.setItem("trackme_user", JSON.stringify(action.payload.user));
      } catch (e) {
        console.error("Failed to save credentials to localStorage", e);
      }
    },
    updateProfileSuccess(state, action: PayloadAction<{ token?: string; user: User }>) {
      state.user = action.payload.user;
      if (action.payload.token) {
        state.token = action.payload.token;
        try {
          localStorage.setItem("trackme_token", action.payload.token);
        } catch (e) {}
      }
      try {
        localStorage.setItem("trackme_user", JSON.stringify(action.payload.user));
      } catch (e) {}
      state.loading = false;
      state.error = null;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      try {
        localStorage.removeItem("trackme_token");
        localStorage.removeItem("trackme_user");
      } catch (e) {}
    },
  },
});

// Tracking Slice
interface TrackingState {
  isActive: boolean;
  currentLocation: LocationRecord | null;
  history: LocationRecord[];
  intervalId: any | null;
}

const initialTrackingState: TrackingState = {
  isActive: false,
  currentLocation: null,
  history: [],
  intervalId: null,
};

const trackingSlice = createSlice({
  name: "tracking",
  initialState: initialTrackingState,
  reducers: {
    setTrackingActive(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload;
    },
    setCurrentLocation(state, action: PayloadAction<LocationRecord | null>) {
      state.currentLocation = action.payload;
    },
    setHistory(state, action: PayloadAction<LocationRecord[]>) {
      state.history = action.payload;
    },
    addHistoryLocation(state, action: PayloadAction<LocationRecord>) {
      state.currentLocation = action.payload;
      // Prevent duplicates in history
      const exists = state.history.some((l) => l.id === action.payload.id || 
        (Math.abs(l.latitude - action.payload.latitude) < 0.00001 && 
         Math.abs(l.longitude - action.payload.longitude) < 0.00001 && 
         Math.abs(new Date(l.created_at).getTime() - new Date(action.payload.created_at).getTime()) < 1000));
      if (!exists) {
        state.history.push(action.payload);
      }
    },
    clearTrackingState(state) {
      state.isActive = false;
      state.currentLocation = null;
      state.history = [];
    },
  },
});

export const { setAuthLoading, setAuthError, loginSuccess, updateProfileSuccess, logout } = authSlice.actions;
export const { setTrackingActive, setCurrentLocation, setHistory, addHistoryLocation, clearTrackingState } = trackingSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    tracking: trackingSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
