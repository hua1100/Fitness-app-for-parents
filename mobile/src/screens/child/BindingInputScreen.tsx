import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button, Input, Card } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useUseBindingCodeMutation } from '../../store/api/bindingApi';

const BindingInputScreen: React.FC = () => {
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const [useBindingCode, { isLoading }] = useUseBindingCodeMutation();

  const handleSubmit = async () => {
    setError('');

    if (!code.trim()) {
      setError('請輸入綁定碼');
      return;
    }

    if (code.length !== 6) {
      setError('綁定碼應為 6 位數字');
      return;
    }

    try {
      const result = await useBindingCode({ code: code.trim() }).unwrap();

      if (result.success) {
        Alert.alert(
          '綁定成功',
          '已成功向長輩發送綁定請求，請等待確認',
          [
            {
              text: '確定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      const message = error.data?.error?.message || '綁定失敗，請確認綁定碼是否正確';
      setError(message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>輸入綁定碼</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Icon name="information-outline" size={24} color={Colors.info} />
          <Text style={styles.infoText}>
            請向您要關懷的長輩取得綁定碼，輸入後即可開始關懷他們的運動狀況。
          </Text>
        </Card>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>綁定碼</Text>
          <Input
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, ''));
              setError('');
            }}
            placeholder="請輸入 6 位數字"
            keyboardType="number-pad"
            maxLength={6}
            error={error}
            style={styles.codeInput}
          />

          <Button
            title="送出綁定請求"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || code.length !== 6}
            style={styles.submitButton}
          />
        </View>

        <Card style={styles.helpCard}>
          <Text style={styles.helpTitle}>如何取得綁定碼？</Text>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>請長輩開啟 App 並登入</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>進入「設定」→「綁定碼」</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>長輩點擊「生成綁定碼」</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>將 6 位數字輸入到上方欄位</Text>
          </View>
        </Card>
      </View>
    </KeyboardAvoidingView>
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
    flex: 1,
    padding: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.info + '10',
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.info,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: FontSizes.xl,
    letterSpacing: 8,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  helpCard: {
    padding: Spacing.md,
  },
  helpTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.surface,
  },
  stepText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});

export default BindingInputScreen;
