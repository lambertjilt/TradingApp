import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your trading dashboard</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Portfolio Value</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">$10,000</p>
            <p className="mt-1 text-sm text-gray-500">+2.5% today</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Available Cash</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">$5,000</p>
            <p className="mt-1 text-sm text-gray-500">50% of portfolio</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Holdings</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">5</p>
            <p className="mt-1 text-sm text-gray-500">Different stocks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Portfolio Value</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">$10,000</p>
            <p className="mt-1 text-sm text-gray-500">+2.5% today</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Available Cash</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">$5,000</p>
            <p className="mt-1 text-sm text-gray-500">50% of portfolio</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Holdings</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">5</p>
            <p className="mt-1 text-sm text-gray-500">Different stocks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
