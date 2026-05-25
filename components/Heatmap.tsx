import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { DAYS_MINI, MONTHS } from '../constants/theme';

interface HeatmapProps {
  data: Record<string, number>;
  year?: number;
  maxValue?: number;
  cellSize?: number;
}

export function Heatmap({ data, year = new Date().getFullYear(), maxValue = 4, cellSize = 14 }: HeatmapProps) {
  const { colors, spacing, fontSizes } = useTheme();
  const gap = 3;
  const weeks = 53;
  const days = 7;
  const labelWidth = 24;
  const svgWidth = labelWidth + weeks * (cellSize + gap);
  const svgHeight = days * (cellSize + gap) + 24;

  const startDate = new Date(year, 0, 1);
  const startDay = startDate.getDay();

  const getColor = (value: number): string => {
    if (value === 0) return colors.borderLight;
    const intensity = Math.min(value / maxValue, 1);
    if (intensity <= 0.25) return colors.primaryLight;
    if (intensity <= 0.5) return colors.primary;
    if (intensity <= 0.75) return colors.primaryDark;
    return colors.primaryDark;
  };

  const cells: { x: number; y: number; color: string; week: number; day: number }[] = [];

  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < days; day++) {
      const dayIndex = week * 7 + day - startDay;
      const date = new Date(year, 0, 1 + dayIndex);
      if (date.getFullYear() !== year) continue;
      const dateStr = date.toISOString().split('T')[0];
      const value = data[dateStr] || 0;
      cells.push({
        x: labelWidth + week * (cellSize + gap),
        y: day * (cellSize + gap) + 20,
        color: getColor(value),
        week,
        day,
      });
    }
  }

  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  for (let week = 0; week < weeks; week++) {
    const dayIndex = week * 7 - startDay;
    const date = new Date(year, 0, 1 + dayIndex);
    const month = date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        x: labelWidth + week * (cellSize + gap),
        label: MONTHS[month].substring(0, 3),
      });
      lastMonth = month;
    }
  }

  return (
    <View style={styles.container}>
      <Svg width={svgWidth} height={svgHeight}>
        {monthLabels.map((ml, i) => (
          <SvgText
            key={i}
            x={ml.x}
            y={14}
            fill={colors.textSecondary}
            fontSize={10}
            fontFamily="Inter-Regular"
          >
            {ml.label}
          </SvgText>
        ))}
        {DAYS_MINI.map((d, i) => (
          <SvgText
            key={i}
            x={0}
            y={i * (cellSize + gap) + 20 + cellSize / 2 + 3}
            fill={colors.textTertiary}
            fontSize={9}
            fontFamily="Inter-Regular"
          >
            {i % 2 === 1 ? d : ''}
          </SvgText>
        ))}
        {cells.map((cell, i) => (
          <Rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={cell.color}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
