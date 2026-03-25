import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Gear } from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import SimpleXPCounter from '@/components/ui/SimpleXPCounter';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';

interface ChatHeaderProps {
  userName?: string;
  userLevel?: string;
  onLogout: () => void;
  totalXP?: number;
  sessionXP?: number;
  onXPCounterClick?: () => void;
  onHelpPress?: () => void;
}

export default function ChatHeader({
  userName,
  userLevel,
  onLogout,
  totalXP,
  sessionXP,
  onXPCounterClick,
  onHelpPress,
}: ChatHeaderProps) {
  return (
    <View style={{
      height: 56,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(22,21,58,0.97)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.07)',
    }}>

      {/* Left — Charlotte avatar + status */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
        <CharlotteAvatar size="sm" showStatus isOnline />
        <View>
          <AppText style={{ color: '#fff', fontWeight: '600', fontSize: 14, letterSpacing: 0.1 }}>Charlotte</AppText>
          <AppText style={{ color: '#4ade80', fontSize: 11, fontWeight: '500' }}>online</AppText>
        </View>
      </View>

      {/* Center — XP Counter */}
      <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
        {totalXP !== undefined && (
          <SimpleXPCounter totalXP={totalXP} sessionXP={sessionXP} size={42} onClick={onXPCounterClick} />
        )}
      </View>

      {/* Right — user badge + settings (logout fica só em Configurações) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>

        <AppText style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
          {userName?.split(' ')[0] ?? ''}
        </AppText>

        <TouchableOpacity
          onPress={() => router.push('/(app)/configuracoes')}
          style={styles.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Configurações"
        >
          <Gear size={21} color="rgba(255,255,255,0.55)" weight="regular" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
