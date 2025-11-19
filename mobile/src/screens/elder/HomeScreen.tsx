import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { Card, Loading } from '../../components/common';
import ExerciseButton from '../../components/elder/ExerciseButton';
import EmergencyButton from '../../components/elder/EmergencyButton';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectUser } from '../../store/slices/authSlice';
import {
  selectIsExercising,
  selectElapsedSeconds,
  startExercise,
  endExercise,
  updateElapsedTime,
  triggerEmergency,
} from '../../store/slices/exerciseSlice';
import {
  useStartExerciseMutation,
  useEndExerciseMutation,
  useTriggerEmergencyMutation,
  useGetCurrentExerciseQuery,
  useGetStatsQuery,
} from '../../store/api/exerciseApi';

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isExercising = useAppSelector(selectIsExercising);
  const elapsedSeconds = useAppSelector(selectElapsedSeconds);

  const [startExerciseApi, { isLoading: isStarting }] = useStartExerciseMutation();
  const [endExerciseApi, { isLoading: isEnding }] = useEndExerciseMutation();
  const [triggerEmergencyApi] = useTriggerEmergencyMutation();

  const { data: currentExercise } = useGetCurrentExerciseQuery();
  const { data: statsData } = useGetStatsQuery({ period: 'day' });

  // 計時器
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isExercising) {
      timer = setInterval(() => {
        dispatch(updateElapsedTime(elapsedSeconds + 1));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExercising, elapsedSeconds, dispatch]);

  // 格式化時間
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 開始/結束運動
  const handleExercisePress = async () => {
    if (isExercising) {
      // 結束運動
      try {
        const result = await endExerciseApi().unwrap();
        if (result.success && result.data) {
          dispatch(endExercise());
          Alert.alert(
            '運動完成！',
            `運動時長：${result.data.durationMinutes} 分鐘\n獲得點數：${result.data.pointsEarned}`
          );
        }
      } catch (error) {
        Alert.alert('錯誤', '結束運動失敗，請重試');
      }
    } else {
      // 開始運動
      try {
        const result = await startExerciseApi().unwrap();
        if (result.success && result.data) {
          dispatch(startExercise(result.data));
        }
      } catch (error) {
        Alert.alert('錯誤', '開始運動失敗，請重試');
      }
    }
  };

  // 緊急求助
  const handleEmergency = async () => {
    try {
      // TODO: 取得實際位置
      const result = await triggerEmergencyApi({
        latitude: 25.0330,
        longitude: 121.5654,
      }).unwrap();

      if (result.success) {
        dispatch(triggerEmergency());
        Alert.alert('求助已發送', '您的子女已收到通知');
      }
    } catch (error) {
      Alert.alert('錯誤', '發送求助失敗，請重試');
    }
  };

  const stats = statsData?.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 歡迎訊息 */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {user?.name}，您好！
        </Text>
        <Text style={styles.points}>
          目前點數：{user?.totalPoints || 0} 點
        </Text>
      </View>

      {/* 今日統計 */}
      <Card title="今日運動" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalMinutes || 0}</Text>
            <Text style={styles.statLabel}>分鐘</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.exerciseCount || 0}</Text>
            <Text style={styles.statLabel}>次</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>點數</Text>
          </View>
        </View>
      </Card>

      {/* 運動按鈕 */}
      <View style={styles.exerciseSection}>
        <ExerciseButton
          isExercising={isExercising}
          onPress={handleExercisePress}
          disabled={isStarting || isEnding}
          elapsedTime={isExercising ? formatTime(elapsedSeconds) : undefined}
        />
      </View>

      {/* 緊急求助按鈕（運動中才顯示） */}
      {isExercising && (
        <View style={styles.emergencySection}>
          <EmergencyButton onPress={handleEmergency} />
        </View>
      )}

      {(isStarting || isEnding) && <Loading overlay />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  points: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  exerciseSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  emergencySection: {
    marginTop: Spacing.lg,
  },
});

export default HomeScreen;
