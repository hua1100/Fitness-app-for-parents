import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

import { Card, Button, Loading } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store';
import { useUpdateProfileMutation, useChangePasswordMutation, useUploadAvatarMutation } from '../../store/api/authApi';
import { setUser } from '../../store/slices/authSlice';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  // 編輯模態框狀態
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // 編輯表單
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  // 密碼表單
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // API mutations
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 選擇頭像
  const handleSelectAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'avatar.jpg',
        } as any);

        const response = await uploadAvatar(formData).unwrap();
        if (response.data) {
          dispatch(setUser({ ...user!, avatarUrl: response.data.avatarUrl }));
          Alert.alert('成功', '頭像已更新');
        }
      }
    } catch (error: any) {
      Alert.alert('錯誤', error.data?.error?.message || '頭像上傳失敗');
    }
  };

  // 儲存個人資料
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('錯誤', '請輸入姓名');
      return;
    }

    try {
      const response = await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      }).unwrap();

      if (response.data) {
        dispatch(setUser(response.data));
        setEditModalVisible(false);
        Alert.alert('成功', '個人資料已更新');
      }
    } catch (error: any) {
      Alert.alert('錯誤', error.data?.error?.message || '更新失敗');
    }
  };

  // 修改密碼
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('錯誤', '新密碼至少需要 6 個字元');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('錯誤', '新密碼與確認密碼不符');
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('成功', '密碼已修改');
    } catch (error: any) {
      Alert.alert('錯誤', error.data?.error?.message || '密碼修改失敗');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>個人資料</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 頭像區 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleSelectAvatar} style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Icon name="account" size={48} color={Colors.surface} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Icon name="camera" size={14} color={Colors.surface} />
            </View>
            {isUploadingAvatar && (
              <View style={styles.avatarLoading}>
                <Loading size="small" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || '使用者'}</Text>
          <Text style={styles.userRole}>子女帳號</Text>
        </View>

        {/* 基本資料 */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>基本資料</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="account-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>姓名</Text>
            </View>
            <Text style={styles.infoValue}>{user?.name || '未設定'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="phone-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>手機號碼</Text>
            </View>
            <Text style={styles.infoValue}>{user?.phone || '未設定'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="email-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>電子郵件</Text>
            </View>
            <Text style={styles.infoValue}>{user?.email || '未設定'}</Text>
          </View>
        </Card>

        {/* 帳號資訊 */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>帳號資訊</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="identifier" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>使用者 ID</Text>
            </View>
            <Text style={styles.infoValueSmall} numberOfLines={1}>
              {user?.id || '未知'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="clock-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>註冊時間</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
          </View>
        </Card>

        {/* 操作按鈕 */}
        <Card style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setEditName(user?.name || '');
              setEditPhone(user?.phone || '');
              setEditModalVisible(true);
            }}
          >
            <View style={styles.actionIcon}>
              <Icon name="account-edit" size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>編輯個人資料</Text>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Icon name="lock-reset" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.actionText}>修改密碼</Text>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* 編輯個人資料模態框 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>編輯個人資料</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>姓名</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="請輸入姓名"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>手機號碼</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="請輸入手機號碼"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <Button
              title="儲存"
              onPress={handleSaveProfile}
              loading={isUpdating}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* 修改密碼模態框 */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>修改密碼</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>目前密碼</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="請輸入目前密碼"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>新密碼</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="請輸入新密碼（至少 6 字元）"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>確認新密碼</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="請再次輸入新密碼"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
              />
            </View>

            <Button
              title="修改密碼"
              onPress={handleChangePassword}
              loading={isChangingPassword}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userRole: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  infoCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
    maxWidth: 150,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  actionsCard: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  modalButton: {
    marginTop: Spacing.md,
  },
});

export default ProfileScreen;
