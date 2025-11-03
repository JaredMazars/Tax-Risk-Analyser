import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserMenu from '@/components/UserMenu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // This should be caught by middleware, but as a fallback
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Mapper</span>
            </Link>
            
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>
    </div>
  );
}