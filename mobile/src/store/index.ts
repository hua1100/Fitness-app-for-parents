import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { baseApi } from './api/baseApi';
// TODO: 在 Phase 3 添加 slices
// import authReducer from './slices/authSlice';
// import exerciseReducer from './slices/exerciseSlice';
// import notificationReducer from './slices/notificationSlice';
// import rewardReducer from './slices/rewardSlice';
// import voiceReducer from './slices/voiceSlice';
// import bindingReducer from './slices/bindingSlice';

// 持久化配置
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth'], // 只持久化認證狀態
  blacklist: [baseApi.reducerPath], // 不持久化 API 快取
};

// 合併 reducers
const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  // TODO: 在 Phase 3 添加 reducers
  // auth: authReducer,
  // exercise: exerciseReducer,
  // notification: notificationReducer,
  // reward: rewardReducer,
  // voice: voiceReducer,
  // binding: bindingReducer,
});

// 持久化 reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 建立 store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
  devTools: __DEV__,
});

// 持久化 store
export const persistor = persistStore(store);

// TypeScript 類型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
