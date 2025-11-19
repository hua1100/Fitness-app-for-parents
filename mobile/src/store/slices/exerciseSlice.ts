import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExerciseRecord, ExerciseStatus } from '../../types';

// 運動狀態
interface ExerciseState {
  currentExercise: ExerciseRecord | null;
  isExercising: boolean;
  isEmergency: boolean;
  startTime: string | null;
  elapsedSeconds: number;
}

const initialState: ExerciseState = {
  currentExercise: null,
  isExercising: false,
  isEmergency: false,
  startTime: null,
  elapsedSeconds: 0,
};

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    // 開始運動
    startExercise: (state, action: PayloadAction<ExerciseRecord>) => {
      state.currentExercise = action.payload;
      state.isExercising = true;
      state.startTime = action.payload.startTime;
      state.elapsedSeconds = 0;
    },

    // 結束運動
    endExercise: (state) => {
      state.currentExercise = null;
      state.isExercising = false;
      state.isEmergency = false;
      state.startTime = null;
      state.elapsedSeconds = 0;
    },

    // 更新計時器
    updateElapsedTime: (state, action: PayloadAction<number>) => {
      state.elapsedSeconds = action.payload;
    },

    // 觸發緊急求助
    triggerEmergency: (state) => {
      state.isEmergency = true;
    },

    // 取消緊急求助
    cancelEmergency: (state) => {
      state.isEmergency = false;
    },

    // 設定當前運動（從 API 載入）
    setCurrentExercise: (state, action: PayloadAction<ExerciseRecord | null>) => {
      if (action.payload && action.payload.status === 'IN_PROGRESS') {
        state.currentExercise = action.payload;
        state.isExercising = true;
        state.startTime = action.payload.startTime;
        state.isEmergency = action.payload.emergencyStatus === 'ACTIVE';

        // 計算已經過的時間
        const elapsed = Math.floor(
          (Date.now() - new Date(action.payload.startTime).getTime()) / 1000
        );
        state.elapsedSeconds = elapsed;
      } else {
        state.currentExercise = null;
        state.isExercising = false;
        state.isEmergency = false;
        state.startTime = null;
        state.elapsedSeconds = 0;
      }
    },

    // 清除運動狀態
    clearExercise: (state) => {
      return initialState;
    },
  },
});

export const {
  startExercise,
  endExercise,
  updateElapsedTime,
  triggerEmergency,
  cancelEmergency,
  setCurrentExercise,
  clearExercise,
} = exerciseSlice.actions;

// Selectors
export const selectCurrentExercise = (state: { exercise: ExerciseState }) =>
  state.exercise.currentExercise;
export const selectIsExercising = (state: { exercise: ExerciseState }) =>
  state.exercise.isExercising;
export const selectIsEmergency = (state: { exercise: ExerciseState }) =>
  state.exercise.isEmergency;
export const selectElapsedSeconds = (state: { exercise: ExerciseState }) =>
  state.exercise.elapsedSeconds;
export const selectStartTime = (state: { exercise: ExerciseState }) =>
  state.exercise.startTime;

export default exerciseSlice.reducer;
