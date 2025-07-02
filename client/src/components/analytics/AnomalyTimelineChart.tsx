import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

interface AnomalyTimelineData {
  date: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface AnomalyTimelineChartProps {
  data: AnomalyTimelineData[]
}

export function AnomalyTimelineChart({ data }: AnomalyTimelineChartProps) {
  const processedData = data.map(item => ({
    ...item,
    dateValue: new Date(item.date).getTime(),
    size: item.severity === 'high' ? 100 : item.severity === 'medium' ? 60 : 30,
    color: item.severity === 'high' ? '#ef4444' : item.severity === 'medium' ? '#f59e0b' : '#10b981'
  }))

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            dataKey="dateValue"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
            axisLine={false}
            tickLine={false}
            className="text-sm"
          />
          <YAxis
            dataKey="count"
            axisLine={false}
            tickLine={false}
            className="text-sm"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} anomalies`,
              `${props.payload.severity} severity`
            ]}
            labelFormatter={(value: number) => format(new Date(value), 'MMM d, yyyy')}
          />
          <Scatter
            dataKey="count"
            fill={(entry: any) => entry.color}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}