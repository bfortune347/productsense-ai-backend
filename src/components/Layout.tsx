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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                ProductSense.ai
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/settings" 
                  className={`text-sm font-medium ${
                    isActive('/settings') 
                      ? 'text-indigo-600' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/search')} 
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/notifications')} 
                className="p-2 text-gray-400 hover:text-gray-500 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-400 hover:text-gray-500 md:hidden"
              >
                <Settings className="w-5 h-5" />
              </button>
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Profile"
                className="w-8 h-8 rounded-full cursor-pointer ring-2 ring-white"
                onClick={() => navigate('/profile')}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <Outlet />
      </main>
    </>
  );
}