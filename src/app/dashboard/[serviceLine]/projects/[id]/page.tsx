'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirect wrapper for service-line-aware project routes
 * Redirects /dashboard/[serviceLine]/projects/[id] to /dashboard/projects/[id]
 * 
 * This maintains backward compatibility while supporting the new service line structure.
 * In the future, project pages can be fully migrated to service-line-specific routes.
 */
export default function ServiceLineProjectRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      // Redirect to the existing project page structure
      router.replace(`/dashboard/projects/${params.id}`);
    }
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-forvis-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forvis-blue-600 mx-auto"></div>
        <p className="mt-4 text-forvis-gray-700">Loading project...</p>
      </div>
    </div>
  );
}
