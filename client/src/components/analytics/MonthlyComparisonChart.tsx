import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyComparisonChartProps {
  data: Array<{
    month: string
    current: number
    previous: number
    compliance?: number
    violations?: number
  }>
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            className="text-sm"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            className="text-sm"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name === 'current' ? 'Current Month' : 'Previous Month'
            ]}
          />
          <Legend />
          <Bar
            dataKey="current"
            fill="#3b82f6"
            name="Current Month"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="previous"
            fill="#94a3b8"
            name="Previous Month"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}