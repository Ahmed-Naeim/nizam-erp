import React from 'react';
import { Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value="12"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Inventory"
          value="1,234"
          icon={Package}
          color="bg-indigo-500"
        />
        <StatCard
          title="Low Stock Items"
          value="5"
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <StatCard
          title="Monthly Revenue"
          value="$45,231"
          icon={TrendingUp}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stock updated for "Widget A"</p>
                  <p className="text-sm text-gray-500">2 hours ago • John Doe</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Users className="mb-2 text-blue-500" />
              <span className="font-medium block">Add Employee</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Package className="mb-2 text-indigo-500" />
              <span className="font-medium block">Add Item</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
