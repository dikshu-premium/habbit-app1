import { View, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  barWidth?: number;
  height?: number;
  showValues?: boolean;
}

export function BarChart({
  data,
  maxValue,
  barWidth = 28,
  height = 160,
  showValues = true,
}: BarChartProps) {
  const { colors, fontSizes } = useTheme();
  const gap = 12;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const chartHeight = height - 24;
  const svgWidth = data.length * (barWidth + gap) + gap;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={svgWidth} height={height}>
        <Line
          x1={0}
          y1={chartHeight}
          x2={svgWidth}
          y2={chartHeight}
          stroke={colors.borderLight}
          strokeWidth={1}
        />
        {data.map((item, i) => {
          const barHeight = (item.value / max) * (chartHeight - 8);
          const x = gap + i * (barWidth + gap);
          const y = chartHeight - barHeight;
          return (
            <View key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={item.color || colors.primary}
              />
              {showValues && item.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill={colors.textSecondary}
                  fontSize={10}
                  fontFamily="Inter-Regular"
                  textAnchor="middle"
                >
                  {Math.round(item.value)}
                </SvgText>
              )}
              <SvgText
                x={x + barWidth / 2}
                y={height}
                fill={colors.textTertiary}
                fontSize={9}
                fontFamily="Inter-Regular"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </View>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
