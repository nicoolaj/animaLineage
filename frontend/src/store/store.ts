import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import elevageReducer from './slices/elevageSlice';
import animalReducer from './slices/animalSlice';
import userReducer from './slices/userSlice';
import languageReducer from './slices/languageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    elevage: elevageReducer,
    animal: animalReducer,
    user: userReducer,
    language: languageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;