import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getCategoryColor } from '@/utils/categoryColors'

interface CategoryBreakdownChartProps {
  data: Array<{
    category: string
    amount: number
    percentage: number
    policyLimit?: number
  }>
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  console.log('CategoryBreakdownChart: Received data:', data);
  console.log('CategoryBreakdownChart: Number of categories:', data.length);

  // Transform data to include consistent colors
  const dataWithColors = data.map((entry) => {
    const color = getCategoryColor(entry.category);
    console.log(`CategoryBreakdownChart: Category "${entry.category}" assigned consistent color ${color}`);
    return {
      ...entry,
      fill: color
    };
  });

  console.log('CategoryBreakdownChart: Data with colors:', dataWithColors);

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percentage }) => `${category} ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
          >
            {dataWithColors.map((entry, index) => {
              console.log(`CategoryBreakdownChart: Rendering cell for ${entry.category} with color ${entry.fill}`);
              return (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              );
            })}
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