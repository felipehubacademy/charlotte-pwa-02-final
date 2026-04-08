import { Text, TextProps } from 'react-native';

interface AppTextProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper de texto padrão do app Charlotte.
 * - Cor padrão: textPrimary (#FFFFFF)
 * - Aplica classes NativeWind automaticamente
 * - Ponto único para futura troca de fonte (ex: Inter, Poppins)
 */
export function AppText({ children, className = '', style, ...props }: AppTextProps) {
  return (
    <Text
      className={`text-textPrimary ${className}`}
      style={style}
      maxFontSizeMultiplier={1.3}
      {...props}
    >
      {children}
    </Text>
  );
}
