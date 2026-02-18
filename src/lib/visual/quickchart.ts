/**
 * QuickChart.io Integration
 * 
 * Generuje grafy z demografických dat.
 * API je zdarma, žádný klíč potřeba.
 * https://quickchart.io/documentation/
 */

export interface ChartData {
  type: 'bar' | 'line' | 'doughnut' | 'pie' | 'horizontalBar';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
}

export interface VisualIdentity {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  font: string;
  logo_url: string | null;
  style: string;
  // Photography & AI image generation settings
  photography_style?: string;       // e.g. 'documentary', 'editorial', 'lifestyle', 'minimal', 'corporate'
  photography_mood?: string;        // e.g. 'warm and authentic', 'cool and professional', 'energetic'
  photography_subjects?: string;    // e.g. 'real Czech people, families, urban settings'
  photography_avoid?: string;       // negative prompt: e.g. 'no stock photo poses, no fake smiles, no clipart'
  photography_lighting?: string;    // e.g. 'natural daylight', 'golden hour', 'studio soft light'
  photography_color_grade?: string; // e.g. 'warm tones, slight film grain', 'desaturated, muted palette'
  photography_reference?: string;   // e.g. 'Similar to Apple product photography' or 'Czech street photography'
  brand_visual_keywords?: string;   // e.g. 'trust, stability, modern Czech family, home ownership'
}

const DEFAULT_IDENTITY: VisualIdentity = {
  primary_color: '#1a1a2e',
  secondary_color: '#16213e',
  accent_color: '#0f3460',
  text_color: '#ffffff',
  font: 'Inter',
  logo_url: null,
  style: 'minimal',
};

/**
 * Generate a chart URL via QuickChart.io
 * Returns a URL to a PNG image of the chart
 */
export function generateChartUrl(
  chartData: ChartData,
  identity: Partial<VisualIdentity> = {},
): string {
  const vi = { ...DEFAULT_IDENTITY, ...identity };

  const config = {
    type: chartData.type,
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets.map((ds, i) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || [vi.primary_color, vi.accent_color, vi.secondary_color, '#e94560', '#533483'][i] || vi.primary_color,
        borderColor: ds.borderColor || 'transparent',
        borderWidth: 0,
      })),
    },
    options: {
      title: {
        display: !!chartData.title,
        text: chartData.title,
        fontColor: vi.text_color,
        fontSize: 18,
        fontFamily: vi.font,
      },
      legend: {
        labels: {
          fontColor: vi.text_color,
          fontFamily: vi.font,
        },
      },
      scales: chartData.type !== 'doughnut' && chartData.type !== 'pie' ? {
        xAxes: [{
          ticks: { fontColor: vi.text_color, fontFamily: vi.font },
          gridLines: { color: 'rgba(255,255,255,0.1)' },
        }],
        yAxes: [{
          ticks: { fontColor: vi.text_color, fontFamily: vi.font, beginAtZero: true },
          gridLines: { color: 'rgba(255,255,255,0.1)' },
        }],
      } : undefined,
      plugins: {
        datalabels: {
          color: vi.text_color,
          font: { size: 14, family: vi.font, weight: 'bold' },
          display: true,
        },
      },
    },
  };

  const chartConfig = encodeURIComponent(JSON.stringify(config));

  return `https://quickchart.io/chart?c=${chartConfig}&w=800&h=500&bkg=${encodeURIComponent(vi.primary_color)}&f=png`;
}

/**
 * Pre-built chart templates for common data visualizations
 */
export const CHART_TEMPLATES = {
  // Poměr pracujících k důchodcům
  workerRatio: (identity?: Partial<VisualIdentity>): string => generateChartUrl({
    type: 'bar',
    title: 'Pracující na 1 důchodce',
    labels: ['Dnes (2024)', '2035', '2050'],
    datasets: [{
      label: 'Poměr',
      data: [3, 2.5, 2],
      backgroundColor: ['#0f3460', '#e94560', '#e94560'],
    }],
  }, identity),

  // Porodnost v ČR
  fertilityRate: (identity?: Partial<VisualIdentity>): string => generateChartUrl({
    type: 'line',
    title: 'Porodnost v ČR (dětí na ženu)',
    labels: ['2015', '2017', '2019', '2021', '2023', '2024'],
    datasets: [{
      label: 'Porodnost',
      data: [1.57, 1.69, 1.71, 1.83, 1.45, 1.37],
      borderColor: '#e94560',
      backgroundColor: 'rgba(233,69,96,0.2)',
    }, {
      label: 'Potřeba pro udržení populace',
      data: [2.1, 2.1, 2.1, 2.1, 2.1, 2.1],
      borderColor: '#ffffff',
      backgroundColor: 'transparent',
    }],
  }, identity),

  // Stárnutí populace
  agingPopulation: (identity?: Partial<VisualIdentity>): string => generateChartUrl({
    type: 'doughnut',
    title: 'Populace 65+ v roce 2050',
    labels: ['Pod 65 let (70 %)', 'Nad 65 let (30 %)'],
    datasets: [{
      label: 'Podíl',
      data: [70, 30],
      backgroundColor: ['#0f3460', '#e94560'],
    }],
  }, identity),

  // Důchod vs nájem
  pensionVsRent: (identity?: Partial<VisualIdentity>): string => generateChartUrl({
    type: 'horizontalBar',
    title: 'Měsíční příjem (Kč)',
    labels: ['Státní důchod', 'Splátka hypotéky 2+kk', 'Nájem 2+kk Brno'],
    datasets: [{
      label: 'Kč/měsíc',
      data: [20736, 14200, 16000],
      backgroundColor: ['#e94560', '#0f3460', '#16213e'],
    }],
  }, identity),
};
