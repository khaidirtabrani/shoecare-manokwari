import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { CustomerOrder } from '../types';
import { formatRupiah } from '../utils/storage';
import { TrendingUp, Calendar, ArrowUpRight, DollarSign, ChevronRight } from 'lucide-react';

interface RevenueChartProps {
  orders: CustomerOrder[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ orders }) => {
  const chartData = useMemo(() => {
    // Group orders by date (last 14 days)
    const now = new Date();
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });

    const dataMap = last14Days.reduce((acc, date) => {
      acc[date] = { date, revenue: 0, count: 0 };
      return acc;
    }, {} as Record<string, { date: string; revenue: number; count: number }>);

    orders.forEach(order => {
      if (order.status === 'dibatalkan') return;
      const date = order.createdAt.split('T')[0];
      if (dataMap[date]) {
        dataMap[date].revenue += order.totalPrice;
        dataMap[date].count += 1;
      }
    });

    return Object.values(dataMap).map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }));
  }, [orders]);

  const totalRevenueLast14 = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyRevenue = Math.round(totalRevenueLast14 / 14);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-2xl backdrop-blur-md bg-opacity-90">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-black text-emerald-400">{formatRupiah(payload[0].value)}</p>
          <p className="text-[10px] text-slate-300 font-medium mt-0.5">{payload[0].payload.count} Pesanan Masuk</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Main Area Chart */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <TrendingUp className="w-32 h-32 text-emerald-600 rotate-12" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Analisis Performa Omset</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Tren Pendapatan Harian</h3>
            <p className="text-xs text-slate-500">Visualisasi arus kas masuk dalam 14 hari terakhir.</p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total (14 Hari)</span>
              <span className="text-sm font-black text-slate-900 font-mono">{formatRupiah(totalRevenueLast14)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Rata-Rata / Hari</span>
              <span className="text-sm font-black text-emerald-600 font-mono">{formatRupiah(avgDailyRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(value) => `Rp ${value / 1000}k`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side Stats / Bar Chart */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Statistik Volume</span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">Kepadatan Pesanan</h3>
            <p className="text-xs text-slate-400">Jumlah pasang sepatu yang masuk per hari.</p>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count > 3 ? '#10b981' : '#334155'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
                <XAxis 
                  dataKey="formattedDate" 
                  hide
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white text-slate-900 p-2 rounded-xl text-[10px] font-bold shadow-xl border border-slate-200">
                          {payload[0].payload.formattedDate}: {payload[0].value} Pesanan
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Puncak Tertinggi</span>
                  <span className="text-xs font-black text-white">
                    {formatRupiah(Math.max(...chartData.map(d => d.revenue)))}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Pesanan</span>
                <span className="text-xs font-black text-emerald-400">
                  {Math.max(...chartData.map(d => d.count))} Order
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 flex items-center justify-between group cursor-pointer hover:bg-emerald-500 transition-colors">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-emerald-100" />
                <span className="text-xs font-bold text-white uppercase tracking-tight">Lihat Full Laporan</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-medium italic mt-6">
          * Data dihitung berdasarkan pesanan masuk (exclude status dibatalkan).
        </p>
      </div>
    </div>
  );
};
