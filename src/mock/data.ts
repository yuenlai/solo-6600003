// Mock data generator for the dashboard
import type { DataPoint, RealTimeData } from '../types';

export function generateTimeSeriesData(count: number = 24): DataPoint[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now.getTime() - (count - i) * 3600000).toISOString(),
    value: Math.floor(Math.random() * 1000) + 200
  }));
}

export function generateRealTimeStream(): RealTimeData {
  return {
    series: '实时数据',
    points: generateTimeSeriesData(30)
  };
}

export function generateCategoryData(categories: string[]): { name: string; value: number }[] {
  return categories.map(name => ({
    name,
    value: Math.floor(Math.random() * 500) + 100
  }));
}

export function generateScatterData(count: number = 50): number[][] {
  return Array.from({ length: count }, () => [
    Math.random() * 100,
    Math.random() * 100
  ]);
}

export function generateHeatmapData(xLen: number, yLen: number): [number, number, number][] {
  const data: [number, number, number][] = [];
  for (let x = 0; x < xLen; x++) {
    for (let y = 0; y < yLen; y++) {
      data.push([x, y, Math.floor(Math.random() * 100)]);
    }
  }
  return data;
}
