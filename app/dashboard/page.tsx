'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const { data } = db.useQuery({ users: {}, profileStudent: {}, profileDoctor: {} } as any);

  useEffect(() => {
    const storedUserId = localStorage.getItem('chemedical_user_id');
    if (!storedUserId) {
      router.push('/login');
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  useEffect(() => {
    if (!userId || !data) return;

    const dbData = data as any;
    const foundUser = dbData?.users?.find((u: any) => u.id === userId);
    setUser(foundUser);

    if (foundUser?.role === 'student') {
      const studentProfile = dbData?.profileStudent?.find((p: any) => p.userId === userId);
      setProfile(studentProfile);
    } else if (foundUser?.role === 'doctor') {
      const doctorProfile = dbData?.profileDoctor?.find((p: any) => p.userId === userId);
      setProfile(doctorProfile);
    }
  }, [userId, data]);

  const handleLogout = () => {
    localStorage.removeItem('chemedical_user_id');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Lade...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Willkommen zurück, {user.givenName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            Abmelden
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Profil</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-lg font-medium">{user.givenName} {user.familyName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">E-Mail</p>
              <p className="text-lg font-medium">{user.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Region</p>
              <p className="text-lg font-medium">
                {user.region === 'DE' ? 'Deutschland' : user.region === 'AT' ? 'Österreich' : 'Schweiz'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Rolle</p>
              <p className="text-lg font-medium">
                {user.role === 'student' ? '🎓 Student:in' : '🩺 Ärzt:in'}
              </p>
            </div>
          </div>

          {profile && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4">
                {user.role === 'student' ? 'Studium' : 'Berufliche Angaben'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.role === 'student' ? (
                  <>
                    {profile.university && (
                      <div>
                        <p className="text-sm text-gray-500">Universität</p>
                        <p className="text-lg font-medium">{profile.university}</p>
                      </div>
                    )}
                    {profile.semester && (
                      <div>
                        <p className="text-sm text-gray-500">Semester</p>
                        <p className="text-lg font-medium">{profile.semester}</p>
                      </div>
                    )}
                    {profile.examYear && (
                      <div>
                        <p className="text-sm text-gray-500">Examen</p>
                        <p className="text-lg font-medium">{profile.examYear}</p>
                      </div>
                    )}
                    {profile.universityEmail && (
                      <div>
                        <p className="text-sm text-gray-500">Uni-E-Mail</p>
                        <p className="text-lg font-medium">{profile.universityEmail}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {profile.specialties && (
                      <div>
                        <p className="text-sm text-gray-500">Fachrichtung</p>
                        <p className="text-lg font-medium">{profile.specialties}</p>
                      </div>
                    )}
                    {profile.employmentType && (
                      <div>
                        <p className="text-sm text-gray-500">Beschäftigung</p>
                        <p className="text-lg font-medium">
                          {profile.employmentType === 'angestellt' ? 'Angestellt' :
                           profile.employmentType === 'niedergelassen' ? 'Niedergelassen' :
                           'In Weiterbildung'}
                        </p>
                      </div>
                    )}
                    {profile.clinicName && (
                      <div>
                        <p className="text-sm text-gray-500">Praxis/Klinik</p>
                        <p className="text-lg font-medium">{profile.clinicName}</p>
                      </div>
                    )}
                    {profile.registerNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Registernummer</p>
                        <p className="text-lg font-medium">{profile.registerNumber}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Deine Services</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="https://lernapp-nbot.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <div className="text-4xl mb-3">🎮</div>
              <h3 className="font-bold text-lg mb-2">Quiz App</h3>
              <p className="text-gray-600 text-sm">Interaktive Quizfragen für dein Medizinstudium</p>
            </a>

            <div className="p-6 border-2 border-gray-200 rounded-xl opacity-50">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-bold text-lg mb-2">KI-Agent</h3>
              <p className="text-gray-600 text-sm">Demnächst verfügbar</p>
            </div>

            <div className="p-6 border-2 border-gray-200 rounded-xl opacity-50">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-bold text-lg mb-2">Online-Kurse</h3>
              <p className="text-gray-600 text-sm">Demnächst verfügbar</p>
            </div>
          </div>
        </div>

        {/* User ID for Testing */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-500">
            Deine User-ID (für Integration): <code className="bg-white px-2 py-1 rounded">{userId}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
