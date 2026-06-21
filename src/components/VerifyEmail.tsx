import React, { useEffect, useState } from 'react';
import { getAuth, applyActionCode } from 'firebase/auth';
import { useLocation, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const auth = getAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oobCode = params.get('oobCode');
    if (!oobCode) {
      setStatus('error');
      setMessage('Missing verification code.');
      return;
    }

    (async () => {
      try {
        await applyActionCode(auth, oobCode);
        await auth.currentUser?.reload();
        setStatus('success');
        setMessage('Your email has been verified. You may now sign in.');
      } catch (err: any) {
        console.error('Email verification failed:', err);
        setStatus('error');
        setMessage(err?.message || 'Verification failed or link expired.');
      }
    })();
  }, [location.search]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white p-6 rounded-md shadow-md text-center">
        <h2 className="text-xl font-bold mb-3">Email Verification</h2>
        <p className="mb-4">{message}</p>

        {status === 'success' && (
          <div>
            <Link to="/" className="inline-block mt-2 px-4 py-2 bg-teal-600 text-white rounded">Go to Home / Sign In</Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <Link to="/" className="inline-block mt-2 px-4 py-2 bg-slate-200 text-slate-800 rounded">Return</Link>
          </div>
        )}
      </div>
    </div>
  );
}
