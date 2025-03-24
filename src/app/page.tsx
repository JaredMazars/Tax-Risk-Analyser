'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="py-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-900">Mapper</div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Trial Balance Mapping{' '}
              <span className="text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Transform your trial balance into SARS-compliant financial statements with ease. 
              Save time and ensure accuracy with our intelligent mapping system.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Get Started
              <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Intelligent Mapping
              </h3>
              <p className="text-gray-600">
                Our system automatically maps your trial balance items to the correct SARS categories.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Project Management
              </h3>
              <p className="text-gray-600">
                Organize your work by projects and keep track of multiple mappings effortlessly.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Export Flexibility
              </h3>
              <p className="text-gray-600">
                Download your mapped data in various formats including Excel and JSON.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Mapper. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
