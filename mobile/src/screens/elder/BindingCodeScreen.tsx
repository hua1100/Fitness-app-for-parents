import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';

import { Button, Card, Loading } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useGenerateBindingCodeMutation } from '../../store/api/bindingApi';

const BindingCodeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [bindingCode, setBindingCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [generateCode, { isLoading }] = useGenerateBindingCodeMutation();

  const handleGenerateCode = async () => {
    try {
      const result = await generateCode().unwrap();
      if (result.success && result.data) {
        setBindingCode(result.data.code);
        setExpiresAt(result.data.expiresAt);
      }
    } catch (error: any) {
      const message = error.data?.error?.message || '生成綁定碼失敗';
      Alert.alert('錯誤', message);
    }
  };

  const handleCopyCode = () => {
    if (bindingCode) {
      Clipboard.setString(bindingCode);
      Alert.alert('已複製', '綁定碼已複製到剪貼簿');
    }
  };

  const handleShareCode = async () => {
    if (bindingCode) {
      try {
        await Share.share({
          message: `我的長輩運動關懷 App 綁定碼是：${bindingCode}\n\n請在 App 中輸入此代碼來與我綁定。`,
        });
      } catch (error) {
        console.error('分享失敗:', error);
      }
    }
  };

  const formatExpiryTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return '已過期';
    if (diffMins < 60) return `${diffMins} 分鐘後過期`;

    const hours = Math.floor(diffMins / 60);
    return `${hours} 小時後過期`;
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
        <Text style={styles.title}>綁定碼</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Icon name="information-outline" size={24} color={Colors.info} />
          <Text style={styles.infoText}>
            生成綁定碼後，請將代碼分享給您的子女，讓他們在 App 中輸入即可完成綁定。
          </Text>
        </Card>

        {bindingCode ? (
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>您的綁定碼</Text>
            <Text style={styles.codeText}>{bindingCode}</Text>
            {expiresAt && (
              <Text style={styles.expiryText}>
                {formatExpiryTime(expiresAt)}
              </Text>
            )}

            <View style={styles.codeActions}>
              <TouchableOpacity
                onPress={handleCopyCode}
                style={styles.codeAction}
              >
                <Icon name="content-copy" size={20} color={Colors.primary} />
                <Text style={styles.codeActionText}>複製</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareCode}
                style={styles.codeAction}
              >
                <Icon name="share-variant" size={20} color={Colors.primary} />
                <Text style={styles.codeActionText}>分享</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="重新生成"
              variant="outline"
              onPress={handleGenerateCode}
              loading={isLoading}
              style={styles.regenerateButton}
            />
          </Card>
        ) : (
          <Card style={styles.generateCard}>
            <Icon name="qrcode" size={64} color={Colors.border} />
            <Text style={styles.generateTitle}>尚未生成綁定碼</Text>
            <Text style={styles.generateText}>
              點擊下方按鈕生成一個新的綁定碼
            </Text>

            <Button
              title="生成綁定碼"
              onPress={handleGenerateCode}
              loading={isLoading}
              style={styles.generateButton}
            />
          </Card>
        )}

        <Card style={styles.helpCard}>
          <Text style={styles.helpTitle}>如何使用綁定碼？</Text>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>點擊「生成綁定碼」按鈕</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>將綁定碼分享給您的子女</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>子女在 App 中輸入綁定碼</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>完成綁定，開始關懷</Text>
          </View>
        </Card>
      </View>
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
    flex: 1,
    padding: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.info + '10',
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.info,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  codeCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  codeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  expiryText: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  codeActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  codeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },
  codeActionText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  regenerateButton: {
    marginTop: Spacing.lg,
  },
  generateCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  generateTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  generateText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: Spacing.lg,
    minWidth: 200,
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
    backgroundColor: Colors.primary,
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

export default BindingCodeScreen;
