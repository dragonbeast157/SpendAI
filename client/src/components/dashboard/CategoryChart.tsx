import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getCategoryColor } from '@/utils/categoryColors'

interface CategoryChartProps {
  data: Array<{
    category: string
    amount: number
    percentage?: number
  }>
}

export function CategoryChart({ data }: CategoryChartProps) {
  console.log('CategoryChart: Received data:', data);

  // Transform data to include consistent colors
  const dataWithColors = data.map((entry) => {
    const color = getCategoryColor(entry.category);
    console.log(`CategoryChart: Category "${entry.category}" assigned consistent color ${color}`);
    return {
      ...entry,
      fill: color
    };
  });

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
            label={({ category, amount }) => `${category}: $${amount}`}
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`$${value}`, 'Amount']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}