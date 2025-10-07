'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data } = db.useQuery({ users: {}, credentials: {} } as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const dbData = data as any;

      // Find user by email
      const user = dbData?.users?.find((u: any) => u.email === email);

      if (!user) {
        setError('E-Mail oder Passwort falsch');
        setIsLoading(false);
        return;
      }

      // Find credentials
      const cred = dbData?.credentials?.find((c: any) => c.userId === user.id);

      if (!cred || cred.passwordHash !== password) {
        setError('E-Mail oder Passwort falsch');
        setIsLoading(false);
        return;
      }

      // Audit log
      (db as any).transact([
        (db as any).tx.audit[`audit-${Date.now()}`].update({
          userId: user.id,
          eventType: 'login_success',
          metadata: JSON.stringify({ email }),
          timestamp: Date.now(),
        }),
      ]);

      // Store userId in localStorage
      localStorage.setItem('chemedical_user_id', user.id);

      router.push('/dashboard');
    } catch (err) {
      setError('Login fehlgeschlagen');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <img
            src="/chemedical-id-logo-2.png"
            alt="Chemedical ID"
            className="w-full mb-8"
          />
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Noch kein Account? <a href="/register" className="text-blue-900 hover:underline">Jetzt registrieren</a>
          </p>
        </div>
      </div>
    </div>
  );
}
