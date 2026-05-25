import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Bell,
  Shield,
  Download,
  Upload,
  LogOut,
  ChevronRight,
  Lock,
  Fingerprint,
  Type,
  Trash2,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react-native';
import { updateProfile } from '../../lib/database';
import { documentDirectory, cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { HABIT_COLORS } from '../../constants/theme';

export default function SettingsScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { mode, setMode, colors, spacing, fontSizes, radius, colorScheme } = useTheme();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [exporting, setExporting] = useState(false);

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      await updateProfile(user.id, { [key]: value });
      await refreshProfile();
    } catch (err) {
      console.error('Update setting error:', err);
    }
  };

  const handleSetPin = async () => {
    if (pin.length < 4) return;
    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    await updateSetting('pin_lock', pin);
    setShowPinModal(false);
    setPin('');
    setConfirmPin('');
  };

  const handleRemovePin = async () => {
    await updateSetting('pin_lock', null);
  };

  const handleExportJSON = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        profile,
        userId: user.id,
      };
      const jsonStr = JSON.stringify(data, null, 2);
      const fileUri = `${cacheDirectory}habitflow_backup_${Date.now()}.json`;
      await writeAsStringAsync(fileUri, jsonStr, { encoding: EncodingType.UTF8 });
      await shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Backup' });
    } catch (err) {
      console.error('Export error:', err);
      Alert.alert('Export Failed', 'Could not export data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const csvLines = ['Date,Habit,Completed,Count'];
      const fileUri = `${cacheDirectory}habitflow_export_${Date.now()}.csv`;
      await writeAsStringAsync(fileUri, csvLines.join('\n'), { encoding: EncodingType.UTF8 });
      await shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export CSV' });
    } catch (err) {
      console.error('CSV export error:', err);
      Alert.alert('Export Failed', 'Could not export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const accentColor = profile?.accent_color || '#4F9D69';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: 48, paddingBottom: spacing.md }]}>
        <Text style={{ color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700' }}>
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}>
        {/* Theme */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600', marginBottom: spacing.md }}>
            APPEARANCE
          </Text>
          <View style={{ gap: spacing.sm }}>
            {[
              { value: 'light' as const, icon: <Sun size={20} color={colors.text} />, label: 'Light' },
              { value: 'dark' as const, icon: <Moon size={20} color={colors.text} />, label: 'Dark' },
              { value: 'system' as const, icon: <Monitor size={20} color={colors.text} />, label: 'System' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.settingRow,
                  {
                    backgroundColor: mode === opt.value ? colors.primaryLight : 'transparent',
                    borderRadius: radius.sm,
                  },
                ]}
                onPress={() => setMode(opt.value)}
              >
                {opt.icon}
                <Text style={{ color: colors.text, fontSize: fontSizes.md, fontWeight: '500', marginLeft: 12, flex: 1 }}>
                  {opt.label}
                </Text>
                {mode === opt.value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Accent Color */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Palette size={20} color={colors.text} />
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
              ACCENT COLOR
            </Text>
          </View>
          <View style={[styles.colorGrid, { gap: spacing.sm }]}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: c,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: accentColor === c ? colors.text : 'transparent',
                  },
                ]}
                onPress={() => updateSetting('accent_color', c)}
              />
            ))}
          </View>
        </Card>

        {/* Reminders */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Bell size={20} color={colors.text} />
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
              REMINDERS
            </Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={{ color: colors.text, fontSize: fontSizes.md, flex: 1 }}>Morning Reminder</Text>
            <Switch
              value={profile?.morning_reminder || false}
              onValueChange={(v) => updateSetting('morning_reminder', v)}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={{ color: colors.text, fontSize: fontSizes.md, flex: 1 }}>Evening Reminder</Text>
            <Switch
              value={profile?.evening_reminder || false}
              onValueChange={(v) => updateSetting('evening_reminder', v)}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Font Size */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Type size={20} color={colors.text} />
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
              FONT SIZE
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[
              { label: 'Small', value: 14 },
              { label: 'Medium', value: 16 },
              { label: 'Large', value: 18 },
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.fontSizeBtn,
                  {
                    backgroundColor: profile?.font_size === opt.value ? colors.primary : colors.surfaceSecondary,
                    borderRadius: radius.sm,
                    flex: 1,
                  },
                ]}
                onPress={() => updateSetting('font_size', opt.value)}
              >
                <Text style={{ color: profile?.font_size === opt.value ? '#FFF' : colors.textSecondary, fontWeight: '600', fontSize: opt.value - 2 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Security */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Shield size={20} color={colors.text} />
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
              SECURITY
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => profile?.pin_lock ? handleRemovePin() : setShowPinModal(true)}
          >
            <Lock size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: fontSizes.md, fontWeight: '500', marginLeft: 12, flex: 1 }}>
              {profile?.pin_lock ? 'Remove PIN Lock' : 'Set PIN Lock'}
            </Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Data & Backup */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Download size={20} color={colors.text} />
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
              DATA & BACKUP
            </Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            <TouchableOpacity style={styles.settingRow} onPress={handleExportJSON} disabled={exporting}>
              <FileJson size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontSize: fontSizes.md, fontWeight: '500', marginLeft: 12, flex: 1 }}>
                Export Backup (JSON)
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow} onPress={handleExportCSV} disabled={exporting}>
              <FileSpreadsheet size={20} color={colors.success} />
              <Text style={{ color: colors.text, fontSize: fontSizes.md, fontWeight: '500', marginLeft: 12, flex: 1 }}>
                Export Data (CSV)
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Account */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <LogOut size={20} color={colors.text} />
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' }}>
              ACCOUNT
            </Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: fontSizes.sm, marginBottom: spacing.md }}>
            {user?.email}
          </Text>
          <Button title="Sign Out" variant="danger" onPress={handleSignOut} />
        </Card>

        {/* App Info */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Text style={{ color: colors.textTertiary, fontSize: fontSizes.sm }}>
            HabitFlow v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} onClose={() => setShowPinModal(false)} title="Set PIN Lock">
        <Input
          label="Enter 4-digit PIN"
          value={pin}
          onChangeText={setPin}
          placeholder="0000"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
        <Input
          label="Confirm PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder="0000"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
        <View style={{ marginTop: spacing.md }}>
          <Button title="Set PIN" onPress={handleSetPin} disabled={pin.length < 4} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
  },
  fontSizeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
