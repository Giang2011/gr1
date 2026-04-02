import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import axiosClient from '../api/axiosClient';

const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const testApi = async () => {
    setLoading(true);
    try {
      // Ví dụ gọi 1 endpoint từ Backend. Vì chưa rõ endpoint cụ thể nên để '/test'
      // Bạn có thể sửa endpoint theo thực tế backend.
      const response = await axiosClient.get('/test');
      setData(response);
    } catch (error) {
      console.error(error);
      setData({ error: 'Không thể kết nối đến Backend hoặc Endpoint không tồn tại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Trang chủ</h1>
          <p className="text-slate-500">Chào mừng bạn đến với hệ thống quản lý kỳ thi.</p>
        </div>
        <Button onClick={testApi} isLoading={loading}>
          Mô phỏng gọi API
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        {[1, 2, 3].map((card) => (
          <div key={card} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Thống kê {card}</h3>
            <p className="text-slate-500 text-sm">Dữ liệu tổng quan sơ bộ...</p>
          </div>
        ))}
      </div>

      {data && (
        <div className="bg-slate-900 rounded-xl p-6 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-200 font-medium">Kết quả phản hồi từ API:</h3>
          </div>
          <pre className="text-green-400 font-mono text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Home;
