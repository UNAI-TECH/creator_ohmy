import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsAndConditionsProps {
  onBack: () => void;
}

export default function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
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
          Terms and Conditions
        </h1>

        <div className="prose prose-red max-w-none space-y-6 text-gray-600 leading-relaxed">
          <p>
            Welcome to the <strong>OH MY HINDUSTAN Creator Dashboard</strong>. By accessing and using this platform, you agree to comply with and be bound by the following terms and conditions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By registering as a creator, you accept all the terms, conditions, policies, and guidelines provided within this application. If you do not agree to these terms, please do not use the creator dashboard.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Content Guidelines</h2>
          <p>
            As a creator on OH MY HINDUSTAN, you are expected to maintain the highest standards of journalism and content creation. You agree:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Not to publish false, misleading, or unverified information.</li>
            <li>Not to publish content that incites hate, violence, or disrupts public harmony.</li>
            <li>To ensure all content (videos, blogs, news) belongs to you or you have the right to publish it.</li>
            <li>Not to use the platform for unauthorized advertising or spamming.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Account Integrity</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify our support team if you notice any unauthorized access to your account.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Monetization & Earnings</h2>
          <p>
            Earnings are calculated based on views, engagement, and platform-specific metrics. We reserve the right to revise the monetization models. Any fraudulent views or activities to inflate earnings will result in immediate account suspension and withholding of payments.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Termination</h2>
          <p>
            OH MY HINDUSTAN reserves the right to suspend or terminate any creator account without prior notice if we believe the account violates these Terms and Conditions or poses a risk to the platform and our audience.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Changes to Terms</h2>
          <p>
            We may update these terms periodically. Continued use of the platform after changes have been made constitutes your acceptance of the revised terms.
          </p>

          <p className="mt-12 text-sm text-gray-400 font-bold uppercase tracking-widest pt-8 border-t">
            Last Updated: April 2026
          </p>
        </div>
      </div>
    </div>
  );
}
