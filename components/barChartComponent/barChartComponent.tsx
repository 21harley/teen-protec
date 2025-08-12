import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// types/chart.ts
export type BarChartData = {
  name: string;
  value: number;
  // Puedes añadir más campos si necesitas barras agrupadas
  secondaryValue?: number;
};

export type BarChartProps = {
  data: BarChartData[];
  width?: number | string;
  height?: number | string;
  barColors?: [string, string]; // Para barras múltiples
  name?:string;
};

const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  width = '100%',
  height = 400,
  barColors = ['#8884d8', '#82ca9d'],
  name="ventas",
}) => {
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="value" 
            fill={barColors[0]} 
            name={name}
            animationDuration={1500}
          />
          {data.some((item) => item.secondaryValue !== undefined) && (
            <Bar
              dataKey="secondaryValue"
              fill={barColors[1]}
              name="Ventas Secundarias"
              animationDuration={1500}
            />
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;