import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Heart, MessageCircle, Users, FileText, TrendingUp, Star } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9898b0', font: { family: 'Inter' } } } },
  scales: {
    x: { ticks: { color: '#5a5a72', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#5a5a72', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

const DAYS = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!data)   return <div className="empty-state"><p>No data available.</p></div>;

  const { overview, postsOverTime, topPosts, engagementByDay } = data;

  // Posts over time chart
  const postsChartData = {
    labels: postsOverTime.map(d => d._id),
    datasets: [{
      label: 'Posts',
      data: postsOverTime.map(d => d.count),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.15)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#8b5cf6',
      pointRadius: 4,
    }],
  };

  // Engagement by day chart
  const engagementChartData = {
    labels: engagementByDay.map(d => DAYS[d._id] || d._id),
    datasets: [
      {
        label: 'Posts',
        data: engagementByDay.map(d => d.posts),
        backgroundColor: 'rgba(124,58,237,0.8)',
        borderRadius: 6,
      },
      {
        label: 'Likes',
        data: engagementByDay.map(d => d.likes),
        backgroundColor: 'rgba(236,72,153,0.8)',
        borderRadius: 6,
      },
    ],
  };

  // Top posts doughnut
  const topPostsChartData = {
    labels: topPosts.map((_, i) => `Post ${i + 1}`),
    datasets: [{
      data: topPosts.map(p => p.likes?.length || 0),
      backgroundColor: ['#7c3aed', '#a855f7', '#ec4899', '#3b82f6', '#10b981'],
      borderWidth: 0,
    }],
  };

  const statCards = [
    { label: 'Total Posts',    value: overview.totalPosts,     Icon: FileText,       color: '#7c3aed' },
    { label: 'Total Likes',    value: overview.totalLikes,     Icon: Heart,          color: '#ec4899' },
    { label: 'Total Comments', value: overview.totalComments,  Icon: MessageCircle,  color: '#3b82f6' },
    { label: 'Followers',      value: overview.followers,      Icon: Users,          color: '#10b981' },
    { label: 'Following',      value: overview.following,      Icon: TrendingUp,     color: '#f59e0b' },
    { label: 'Avg Likes/Post', value: overview.avgLikesPerPost, Icon: Star,          color: '#ef4444' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 20 }}>
        📊 Analytics Dashboard
      </h2>

      {/* Stat cards */}
      <div className="analytics-grid">
        {statCards.map(({ label, value, Icon, color }) => (
          <div className="stat-card fade-in" key={label}>
            <div className="stat-icon" style={{ background: `${color}22`, color }}>
              <Icon size={20} />
            </div>
            <div className="stat-value gradient-text">{value.toLocaleString()}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Posts Over Time (Last 30 Days)</div>
          {postsOverTime.length === 0
            ? <div className="empty-state"><div className="icon">📈</div><p>Post something to see data here</p></div>
            : <div style={{ height: 260 }}><Line data={postsChartData} options={chartDefaults} /></div>
          }
        </div>
        <div className="chart-card">
          <div className="chart-title">Top Posts by Likes</div>
          {topPosts.length === 0
            ? <div className="empty-state"><div className="icon">❤️</div><p>No likes yet</p></div>
            : <div style={{ height: 260 }}><Doughnut data={topPostsChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9898b0' } } }, cutout: '65%' }} /></div>
          }
        </div>
      </div>

      {/* Chart row 2 */}
      <div className="chart-card" style={{ marginTop: 16 }}>
        <div className="chart-title">Engagement by Day of Week</div>
        {engagementByDay.length === 0
          ? <div className="empty-state"><div className="icon">📅</div><p>No engagement data yet</p></div>
          : <div style={{ height: 260 }}><Bar data={engagementChartData} options={chartDefaults} /></div>
        }
      </div>

      {/* Top posts table */}
      {topPosts.length > 0 && (
        <div className="chart-card" style={{ marginTop: 16 }}>
          <div className="chart-title">🏆 Top Performing Posts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topPosts.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {i + 1}
                </div>
                {p.image && <img src={p.image} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} alt="post" />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="truncate" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.content || 'Image post'}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <span style={{ color: '#ec4899', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Heart size={14} /> {p.likes?.length || 0}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageCircle size={14} /> {p.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
