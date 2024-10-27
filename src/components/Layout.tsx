import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Bell, Settings, LayoutDashboard } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-10">
        {/* Rest of your component remains the same */}
      </header>
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <Outlet />
      </main>
    </>
  );
}
