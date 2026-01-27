import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 md:px-10 md:py-8">
          {/* 
            Let individual pages control max-width.
            This avoids layout fighting content.
          */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
