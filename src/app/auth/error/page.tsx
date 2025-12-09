'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access was denied. You may not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forvis-blue-50 to-forvis-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-lg border border-forvis-gray-200 shadow-corporate-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-forvis-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm font-normal text-forvis-gray-600">{getErrorMessage(error)}</p>
        </div>

        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 ease-in-out shadow-corporate hover:shadow-corporate-md focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:ring-offset-2"
            style={{ background: 'linear-gradient(135deg, #5B93D7 0%, #2E5AAC 100%)' }}
          >
            Try Again
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-4 p-4 bg-forvis-gray-100 rounded-lg text-xs text-forvis-gray-600 break-all">
            <strong>Error Code:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forvis-blue-50 to-forvis-gray-50">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}



