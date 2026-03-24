import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, ArrowLeft, LogIn, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RequestPendingProps {
  onBack: () => void;
  onGoToLogin: () => void;
  applicantEmail?: string;
}

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'not_found';

export default function RequestPending({ onBack, onGoToLogin, applicantEmail }: RequestPendingProps) {
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    if (!applicantEmail) {
      setStatus('not_found');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('creator_requests')
        .select('status, admin_message')
        .eq('email', applicantEmail)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Status check error:', error);
        // Don't set not_found on error - could be a network issue
        setLoading(false);
        return;
      }

      if (!data) {
        setStatus('not_found');
      } else {
        setStatus(data.status as RequestStatus);
        setAdminMessage(data.admin_message);
      }
    } catch (err) {
      console.error('Status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch & set up real-time subscription
  useEffect(() => {
    checkStatus();

    if (!applicantEmail) return;

    // Subscribe to real-time changes on the creator_requests table filtered by email
    const channel = supabase
      .channel(`request-status-${applicantEmail}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'creator_requests',
        filter: `email=eq.${applicantEmail}`,
      }, (payload: any) => {
        if (payload.new) {
          setStatus(payload.new.status);
          setAdminMessage(payload.new.admin_message);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'creator_requests',
        filter: `email=eq.${applicantEmail}`,
      }, (payload: any) => {
        if (payload.new) {
          setStatus(payload.new.status);
          setAdminMessage(payload.new.admin_message);
        }
      })
      .subscribe();

    // Also poll every 15 seconds as a fallback (in case Realtime isn't enabled on the table)
    const interval = setInterval(checkStatus, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [applicantEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="mt-4 text-gray-500">Checking application status...</p>
      </div>
    );
  }

  // ── APPROVED STATE ──
  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-4 text-green-700">Application Approved! 🎉</h1>
        <p className="text-xl text-gray-500 max-w-md mb-6 leading-relaxed">
          Congratulations! Your creator application has been approved. 
          You can now log in with the credentials provided by the admin.
        </p>

        {adminMessage && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 max-w-md w-full mb-8 text-left">
            <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-2">Message from Admin</p>
            <p className="text-gray-700 italic">"{adminMessage}"</p>
          </div>
        )}

        <div className="bg-gray-50 p-8 rounded-[2rem] max-w-md w-full mb-10 border border-gray-100">
          {/* Timeline */}
          <div className="flex items-start gap-4 text-left">
            <div className="shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Application Submitted</h4>
              <p className="text-sm text-gray-500">Your details were stored securely.</p>
            </div>
          </div>
          
          <div className="my-4 border-l-2 border-green-200 ml-3 h-6"></div>

          <div className="flex items-start gap-4 text-left">
            <div className="shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Admin Reviewed</h4>
              <p className="text-sm text-gray-500">Your application was approved.</p>
            </div>
          </div>

          <div className="my-4 border-l-2 border-green-200 ml-3 h-6"></div>

          <div className="flex items-start gap-4 text-left">
            <div className="shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center mt-1">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-red-600">Login to Your Studio</h4>
              <p className="text-sm text-gray-500">Use the credentials shared by admin.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onGoToLogin}
          className="px-10 py-4 bg-red-600 text-white rounded-2xl text-lg font-bold hover:bg-red-700 transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-red-200"
        >
          <LogIn className="w-5 h-5" />
          Login to Creator Studio
        </button>

        <button 
          onClick={onBack}
          className="mt-4 px-6 py-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
        >
          ← Return to Home
        </button>
      </div>
    );
  }

  // ── REJECTED STATE ──
  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8">
          <XCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-4 text-red-700">Application Rejected</h1>
        <p className="text-xl text-gray-500 max-w-md mb-6 leading-relaxed">
          Unfortunately, your creator application was not approved at this time.
        </p>

        {adminMessage && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 max-w-md w-full mb-8 text-left">
            <p className="text-sm font-bold text-red-700 uppercase tracking-wider mb-2">Reason from Admin</p>
            <p className="text-gray-700 italic">"{adminMessage}"</p>
          </div>
        )}

        <div className="bg-gray-50 p-8 rounded-[2rem] max-w-md w-full mb-10 border border-gray-100">
          <div className="flex items-start gap-4 text-left">
            <div className="shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Application Submitted</h4>
              <p className="text-sm text-gray-500">Your details were stored securely.</p>
            </div>
          </div>
          
          <div className="my-4 border-l-2 border-red-200 ml-3 h-6"></div>

          <div className="flex items-start gap-4 text-left">
            <div className="shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center mt-1">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-red-600">Application Rejected</h4>
              <p className="text-sm text-gray-500">You may re-apply in the future.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-black transition-all flex items-center gap-3 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Home
        </button>
      </div>
    );
  }

  // ── NOT FOUND STATE ──
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-8">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Application Not Found</h1>
        <p className="text-gray-500 max-w-md mb-8">We couldn't find your application. Please try submitting again.</p>
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-black transition-all flex items-center gap-3"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Home
        </button>
      </div>
    );
  }

  // ── PENDING STATE (default) ──
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <Clock className="w-12 h-12" />
      </div>
      
      <h1 className="text-4xl font-extrabold mb-4">Request Pending</h1>
      <p className="text-xl text-gray-500 max-w-md mb-4 leading-relaxed">
        We've received your application! Our admin team is reviewing your profile. 
        This page updates automatically.
      </p>

      <button 
        onClick={checkStatus}
        className="flex items-center gap-2 text-sm text-red-600 font-bold hover:text-red-700 mb-10 transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Refresh Status
      </button>

      <div className="bg-gray-50 p-8 rounded-[2rem] max-w-md w-full mb-12 border border-gray-100">
        <div className="flex items-start gap-4 text-left">
          <div className="shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Application Submitted</h4>
            <p className="text-sm text-gray-500">Your details are safely stored in our database.</p>
          </div>
        </div>
        
        <div className="my-6 border-l-2 border-dashed border-gray-200 ml-3 h-8"></div>

        <div className="flex items-start gap-4 text-left">
          <div className="shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mt-1 animate-pulse">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Under Admin Review</h4>
            <p className="text-sm text-gray-500">This usually takes 24-48 hours. Stay tuned!</p>
          </div>
        </div>

        <div className="my-6 border-l-2 border-dashed border-gray-200 ml-3 h-8"></div>

        <div className="flex items-start gap-4 text-left opacity-30">
          <div className="shrink-0 w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mt-1">
            <LogIn className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-400">Login to Studio</h4>
            <p className="text-sm text-gray-400">Available after approval.</p>
          </div>
        </div>
      </div>

      <button 
        onClick={onBack}
        className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-black transition-all flex items-center gap-3 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        Return to Home
      </button>
    </div>
  );
}
