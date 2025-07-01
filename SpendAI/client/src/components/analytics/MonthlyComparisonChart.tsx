import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyComparisonData {
  month: string;
  income: number;
  spending: number;
  savings: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[]
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" radius={[2, 2, 0, 0]} />
          <Bar dataKey="spending" fill="#ef4444" name="Spending" radius={[2, 2, 0, 0]} />
          <Bar dataKey="savings" fill="#3b82f6" name="Savings" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}