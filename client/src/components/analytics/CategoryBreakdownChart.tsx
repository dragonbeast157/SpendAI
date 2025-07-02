import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getCategoryColor } from '@/utils/categoryColors'

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryBreakdownChartProps {
  data: Array<{
    category: string
    amount: number
    percentage: number
    policyLimit?: number
  }>
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  console.log('=== CategoryBreakdownChart DEBUG START ===');
  console.log('CategoryBreakdownChart: Component called with data:', data);
  console.log('CategoryBreakdownChart: Data type:', typeof data);
  console.log('CategoryBreakdownChart: Data is array:', Array.isArray(data));
  console.log('CategoryBreakdownChart: Data length:', data?.length);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('CategoryBreakdownChart: No valid data provided, returning empty state');
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No category data to display</p>
        </div>
      </div>
    );
  }

  // Transform data to include consistent colors
  const dataWithColors = data.map((entry, index) => {
    console.log(`CategoryBreakdownChart: Processing entry ${index}:`, entry);
    const color = getCategoryColor(entry.category);
    console.log(`CategoryBreakdownChart: Category "${entry.category}" assigned color ${color}`);
    
    const transformedEntry = {
      name: entry.category, // Recharts expects 'name' for legend
      value: entry.amount,  // Recharts expects 'value' for pie data
      percentage: entry.percentage,
      fill: color
    };
    
    console.log(`CategoryBreakdownChart: Transformed entry:`, transformedEntry);
    return transformedEntry;
  });

  console.log('CategoryBreakdownChart: Final data with colors:', dataWithColors);
  console.log('CategoryBreakdownChart: About to render PieChart');
  console.log('=== CategoryBreakdownChart DEBUG END ===');

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => {
              console.log(`CategoryBreakdownChart: Rendering label for ${name}: ${percentage}%`);
              return `${name} ${percentage}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithColors.map((entry, index) => {
              console.log(`CategoryBreakdownChart: Rendering Cell ${index} for ${entry.name} with color ${entry.fill}`);
              return (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              );
            })}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              console.log(`CategoryBreakdownChart: Tooltip - value: ${value}, name: ${name}`);
              return [`$${value}`, name];
            }}
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
            formatter={(value, entry) => {
              console.log(`CategoryBreakdownChart: Legend - value: ${value}, entry:`, entry);
              return <span style={{ color: entry.color }}>{value}</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}