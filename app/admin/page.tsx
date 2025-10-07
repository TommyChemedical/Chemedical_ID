'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data } = db.useQuery({
    users: {},
    credentials: {},
    profileStudent: {},
    profileDoctor: {},
    consents: {}
  } as any);

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (email === 'tom.chemedical@gmail.com' && password === 'Cscerfurt2017.') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      setError('');
    } else {
      setError('Falsche Anmeldedaten');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const deleteUser = (userId: string) => {
    if (confirm('Möchtest du diesen Nutzer wirklich löschen?')) {
      // Delete user
      (db as any).transact([
        (db as any).tx.users[userId].delete(),
      ]);

      // Delete credentials
      const cred = (data as any)?.credentials?.find((c: any) => c.userId === userId);
      if (cred) {
        (db as any).transact([
          (db as any).tx.credentials[cred.id].delete(),
        ]);
      }

      // Delete profiles
      const studentProfile = (data as any)?.profileStudent?.find((p: any) => p.userId === userId);
      if (studentProfile) {
        (db as any).transact([
          (db as any).tx.profileStudent[studentProfile.id].delete(),
        ]);
      }

      const doctorProfile = (data as any)?.profileDoctor?.find((p: any) => p.userId === userId);
      if (doctorProfile) {
        (db as any).transact([
          (db as any).tx.profileDoctor[doctorProfile.id].delete(),
        ]);
      }

      // Delete consents
      const userConsents = (data as any)?.consents?.filter((c: any) => c.userId === userId) || [];
      userConsents.forEach((consent: any) => {
        (db as any).transact([
          (db as any).tx.consents[consent.id].delete(),
        ]);
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 border-black">
          <h1 className="text-2xl font-bold mb-6" style={{ color: '#02187B' }}>
            Admin Login
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#02187B] mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#02187B] mb-1">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Anmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  const users = (data as any)?.users || [];
  const credentials = (data as any)?.credentials || [];
  const studentProfiles = (data as any)?.profileStudent || [];
  const doctorProfiles = (data as any)?.profileDoctor || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#02187B' }}>
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Abmelden
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-black mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#02187B' }}>
            Statistiken
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{users.length}</div>
              <div className="text-sm text-gray-600">Gesamt Nutzer</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{studentProfiles.length}</div>
              <div className="text-sm text-gray-600">Studenten</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{doctorProfiles.length}</div>
              <div className="text-sm text-gray-600">Ärzte</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-black">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#02187B' }}>
            Alle Nutzer
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 px-4 text-[#02187B]">E-Mail</th>
                  <th className="text-left py-3 px-4 text-[#02187B]">Rolle</th>
                  <th className="text-left py-3 px-4 text-[#02187B]">Status</th>
                  <th className="text-left py-3 px-4 text-[#02187B]">Erstellt</th>
                  <th className="text-left py-3 px-4 text-[#02187B]">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => {
                  const studentProfile = studentProfiles.find((p: any) => p.userId === user.id);
                  const doctorProfile = doctorProfiles.find((p: any) => p.userId === user.id);

                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-blue-900">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'student' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role === 'student' ? 'Student' : 'Arzt'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.status}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedUser({ user, studentProfile, doctorProfile })}
                          className="text-blue-900 hover:underline mr-3"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:underline"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: '#02187B' }}>
                  Nutzer Details
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#02187B] mb-2">Basis-Informationen</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>ID:</strong> {selectedUser.user.id}</p>
                    <p><strong>E-Mail:</strong> {selectedUser.user.email}</p>
                    <p><strong>Rolle:</strong> {selectedUser.user.role}</p>
                    <p><strong>Status:</strong> {selectedUser.user.status}</p>
                    <p><strong>Sprache:</strong> {selectedUser.user.language}</p>
                  </div>
                </div>

                {selectedUser.studentProfile && (
                  <div>
                    <h4 className="font-semibold text-[#02187B] mb-2">Studenten-Profil</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Universität:</strong> {selectedUser.studentProfile.university}</p>
                      <p><strong>Semester:</strong> {selectedUser.studentProfile.semester}</p>
                      <p><strong>Examen:</strong> {selectedUser.studentProfile.examYear}</p>
                      <p><strong>Uni-Email:</strong> {selectedUser.studentProfile.universityEmail}</p>
                      <p><strong>Verifizierung:</strong> {selectedUser.studentProfile.verificationStatus}</p>
                    </div>
                  </div>
                )}

                {selectedUser.doctorProfile && (
                  <div>
                    <h4 className="font-semibold text-[#02187B] mb-2">Arzt-Profil</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Fachrichtung:</strong> {selectedUser.doctorProfile.specialty}</p>
                      <p><strong>Beschäftigung:</strong> {selectedUser.doctorProfile.employmentType}</p>
                      <p><strong>Land:</strong> {selectedUser.doctorProfile.country}</p>
                      <p><strong>Registernummer:</strong> {selectedUser.doctorProfile.registerNumber}</p>
                      <p><strong>Verifizierung:</strong> {selectedUser.doctorProfile.verificationStatus}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
