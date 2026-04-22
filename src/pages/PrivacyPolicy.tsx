import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors mb-8 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-4xl font-black tracking-tighter mb-6 uppercase text-gray-900 border-b pb-4">
          Privacy Policy
        </h1>

        <div className="prose prose-red max-w-none space-y-6 text-gray-600 leading-relaxed">
          <p>
            At <strong>OH MY HINDUSTAN</strong>, we value your trust and respect your privacy. This Privacy Policy details how we collect, use, and protect your data when you use the Creator Dashboard.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Data We Collect</h2>
          <p>We may collect information including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Data:</strong> Name, email address, phone number, and ID forms submitted during the application process.</li>
            <li><strong>Financial Data:</strong> Bank account/UPI details necessary for processing your content monetization payouts.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the dashboard, publish content, and manage your audience.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Data</h2>
          <p>Your data is strictly used to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Manage and verify your identity as an author/creator.</li>
            <li>Distribute your content to users within the OH MY HINDUSTAN app ecosystem.</li>
            <li>Calculate your earnings and process financial distributions securely.</li>
            <li>Improve dashboard functionalities, perform analytics, and ensure platform security.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Sharing and Protection</h2>
          <p>
            We do not sell, rent, or trade your personal information to third parties. We employ industry-standard encryption, authentication, and database security practices to prevent unauthorized access, manipulation, or disclosure of your information.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Third-Party Services</h2>
          <p>
            Our dashboard might integrate with third-party providers for hosting (e.g., Supabase) and content delivery. We ensure our partners maintain security standards at least as rigorous as our own.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p>
            You have the right to access, update, and request deletion of your personal data. You can access most data directly through the Profile and Settings sections of the dashboard. For total account deletion, please submit your request to our support staff.
          </p>

          <p className="mt-12 text-sm text-gray-400 font-bold uppercase tracking-widest pt-8 border-t">
            Last Updated: April 2026
          </p>
        </div>
      </div>
    </div>
  );
}
