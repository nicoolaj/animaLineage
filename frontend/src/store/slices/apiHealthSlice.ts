import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ApiHealthState {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  lastCheck: string | null;
}

const initialState: ApiHealthState = {
  isHealthy: false,
  isChecking: true,
  error: null,
  lastCheck: null
};

const apiHealthSlice = createSlice({
  name: 'apiHealth',
  initialState,
  reducers: {
    setHealthy: (state) => {
      state.isHealthy = true;
      state.isChecking = false;
      state.error = null;
      state.lastCheck = new Date().toISOString();
    },
    setUnhealthy: (state, action: PayloadAction<string>) => {
      state.isHealthy = false;
      state.isChecking = false;
      state.error = action.payload;
      state.lastCheck = new Date().toISOString();
    },
    setChecking: (state) => {
      state.isChecking = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const { setHealthy, setUnhealthy, setChecking, clearError } = apiHealthSlice.actions;
export default apiHealthSlice.reducer;