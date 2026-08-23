"use client";

import React from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatRupiah } from '@/utils/formatters';

export function SalesTrendChart({ salesTrendData }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#174C3C" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#174C3C" stopOpacity={0.01}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE9DF" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'sans-serif' }} stroke="#9CA3AF" />
        <YAxis tick={{ fontSize: 9, fontFamily: 'sans-serif' }} stroke="#9CA3AF" tickFormatter={(v) => `Rp${v >= 1000 ? (v / 1000) + 'k' : v}`} />
        <Tooltip 
          contentStyle={{ background: '#FFF', border: '1px solid #DDE9DF', borderRadius: '12px', fontSize: '11px', fontFamily: 'sans-serif' }} 
          formatter={(value) => [formatRupiah(Number(value)), 'Pendapatan']}
        />
        <Area type="monotone" dataKey="Pendapatan" stroke="#174C3C" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({ categoryChartData, COLORS }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={categoryChartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
        >
          {categoryChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [formatRupiah(Number(value)), 'Omzet']}
          contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OrderStatusBarChart({ orderStatusData }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={orderStatusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE9DF" />
        <XAxis dataKey="status" tick={{ fontSize: 9, fontFamily: 'sans-serif' }} stroke="#9CA3AF" />
        <YAxis tick={{ fontSize: 9, fontFamily: 'sans-serif' }} stroke="#9CA3AF" allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
        <Bar dataKey="Jumlah" fill="#6E9C7C" radius={[4, 4, 0, 0]}>
          {orderStatusData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.status === 'Selesai' ? '#174C3C' : entry.status === 'Dibatalkan' ? '#EF4444' : '#6E9C7C'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
