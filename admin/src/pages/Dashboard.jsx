import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, IndianRupee } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    ordersToday: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.revenue}`, icon: IndianRupee, color: 'text-success', bg: 'bg-green-100' },
    { title: 'Orders Today', value: stats.ordersToday, icon: ShoppingCart, color: 'text-primary', bg: 'bg-blue-100' },
    { title: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-warning', bg: 'bg-yellow-100' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-info', bg: 'bg-sky-100' },
  ];



  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1">Dashboard Overview</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card flex items-center gap-4">
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--bg-body)' }}>
                <Icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-muted text-small">{stat.title}</p>
                <h2 className="text-h2">{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>
      

    </div>
  );
};

export default Dashboard;
