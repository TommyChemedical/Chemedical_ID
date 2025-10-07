'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';
import { universities, specialties } from '@/lib/data';

type Role = 'student' | 'doctor';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Basic Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [role, setRole] = useState<Role>('student');

  // Consents
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Step 2: Role-specific (Student)
  const [university, setUniversity] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [semester, setSemester] = useState('');
  const [examYear, setExamYear] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');

  // Step 2: Role-specific (Doctor)
  const [specialty, setSpecialty] = useState('');
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [employmentType, setEmploymentType] = useState<'niedergelassen' | 'angestellt' | 'weiterbildung'>('angestellt');
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState(false);
  const [country, setCountry] = useState<'deutschland' | 'österreich' | 'schweiz'>('deutschland');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [registerNumber, setRegisterNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const { data } = db.useQuery({ users: {}, credentials: {} } as any);

  // Send height to parent window
  useEffect(() => {
    const sendHeight = () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'resize', height: 900 }, '*');
      }
    };
    sendHeight();
  }, [step]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Check empty fields
    if (!email) errors.push('email');
    if (!password) errors.push('password');
    if (!passwordConfirm) errors.push('passwordConfirm');

    if (errors.length > 0) {
      setFieldErrors(errors);
      setError('Bitte fülle alle erforderlichen Felder aus.');
      return;
    }

    // Check password requirements
    if (password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Passwort muss mindestens 8 Zeichen, eine Zahl und ein Sonderzeichen enthalten.');
      setFieldErrors(['password']);
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.');
      setFieldErrors(['password', 'passwordConfirm']);
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError('Bitte akzeptiere die AGB und Datenschutzerklärung.');
      setFieldErrors(['acceptedTerms', 'acceptedPrivacy']);
      return;
    }

    setError('');
    setFieldErrors([]);
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (role === 'student') {
      if (!university) errors.push('university');
      if (!semester) errors.push('semester');
      if (!examYear) errors.push('examYear');
      if (!universityEmail) errors.push('universityEmail');
    } else if (role === 'doctor') {
      if (!specialty) errors.push('specialty');
      if (!employmentType) errors.push('employmentType');
      if (!country) errors.push('country');
      if (!registerNumber) errors.push('registerNumber');
    }

    if (errors.length > 0) {
      setFieldErrors(errors);
      setError('Bitte fülle alle erforderlichen Felder aus.');
      return;
    }

    setIsLoading(true);
    setError('');
    setFieldErrors([]);

    try {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create user (without name initially - progressive profiling)
      (db as any).transact([
        (db as any).tx.users[userId].update({
          id: userId,
          email,
          givenName: givenName || '',
          familyName: familyName || '',
          role,
          language: 'de-DE',
          status: 'pending_verification',
          createdAt: Date.now(),
        }),
      ]);

      // Store password
      (db as any).transact([
        (db as any).tx.credentials[`cred-${userId}`].update({
          userId,
          authType: 'password',
          passwordHash: password,
          createdAt: Date.now(),
        }),
      ]);

      // Store consents
      const consentId = `consent-${userId}-${Date.now()}`;
      (db as any).transact([
        (db as any).tx.consents[consentId].update({
          userId,
          consentType: 'terms',
          version: '1.0',
          status: 'accepted',
          timestamp: Date.now(),
          source: 'web',
        }),
        (db as any).tx.consents[`${consentId}-privacy`].update({
          userId,
          consentType: 'privacy_policy',
          version: '1.0',
          status: 'accepted',
          timestamp: Date.now(),
          source: 'web',
        }),
      ]);

      if (marketingConsent) {
        (db as any).transact([
          (db as any).tx.consents[`${consentId}-marketing`].update({
            userId,
            consentType: 'marketing',
            version: '1.0',
            status: 'accepted',
            timestamp: Date.now(),
            source: 'web',
          }),
        ]);
      }

      // Store role-specific profile
      if (role === 'student') {
        (db as any).transact([
          (db as any).tx.profileStudent[`profile-${userId}`].update({
            userId,
            university,
            semester,
            examYear,
            universityEmail,
            verificationStatus: 'unverified',
          }),
        ]);
      } else if (role === 'doctor') {
        (db as any).transact([
          (db as any).tx.profileDoctor[`profile-${userId}`].update({
            userId,
            specialty,
            employmentType,
            country,
            registerNumber,
            verificationStatus: 'unverified',
          }),
        ]);
      }

      // Audit log
      (db as any).transact([
        (db as any).tx.audit[`audit-${Date.now()}`].update({
          userId,
          eventType: 'registration_completed',
          metadata: JSON.stringify({ role }),
          timestamp: Date.now(),
        }),
      ]);

      localStorage.setItem('chemedical_user_id', userId);
      router.push('/dashboard');
    } catch (err) {
      setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 border-2 border-black">
          <img
            src="/chemedical-id-logo-2.png"
            alt="Chemedical ID"
            className="w-full mb-6"
          />

          <div className="mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-900 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <div className="w-20 h-1 bg-gray-300"></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-900 text-white' : 'bg-gray-300'}`}>
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#02187B' }}>Registrierung</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#02187B] mb-1">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('email') ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#02187B] mb-1">
                    Passwort * (mind. 8 Zeichen, eine Zahl, ein Sonderzeichen)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('password') ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#02187B] mb-1">
                    Passwort bestätigen *
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('passwordConfirm') ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#02187B] mb-3">
                    Ich bin *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                        role === 'student'
                          ? 'border-blue-900 bg-blue-50 text-blue-900'
                          : 'border-gray-300 text-[#02187B] hover:border-blue-300'
                      }`}
                    >
                      Student:in
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('doctor')}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                        role === 'doctor'
                          ? 'border-blue-900 bg-blue-50 text-blue-900'
                          : 'border-gray-300 text-[#02187B] hover:border-blue-300'
                      }`}
                    >
                      Ärzt:in
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className={`mt-1 w-4 h-4 text-blue-900 rounded focus:ring-blue-900 ${fieldErrors.includes('acceptedTerms') ? 'outline outline-2 outline-red-500' : ''}`}
                    />
                    <span className="text-sm text-[#02187B]">
                      Ich akzeptiere die <a href="/terms" className="text-blue-900 hover:underline">AGB</a> *
                    </span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                      className={`mt-1 w-4 h-4 text-blue-900 rounded focus:ring-blue-900 ${fieldErrors.includes('acceptedPrivacy') ? 'outline outline-2 outline-red-500' : ''}`}
                    />
                    <span className="text-sm text-[#02187B]">
                      Ich akzeptiere die <a href="/privacy" className="text-blue-900 hover:underline">Datenschutzerklärung</a> *
                    </span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                    />
                    <span className="text-sm text-[#02187B]">
                      Ich möchte Updates und Neuigkeiten per E-Mail erhalten (optional)
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-8 bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Weiter
              </button>

              <p className="mt-4 text-center text-sm text-gray-600">
                Bereits registriert? <a href="/login" className="text-blue-900 hover:underline">Jetzt anmelden</a>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-4 text-blue-900 hover:text-blue-800 flex items-center gap-1"
              >
                ← Zurück
              </button>

              <h2 className="text-2xl font-bold mb-6" style={{ color: '#02187B' }}>
                {role === 'student' ? 'Studium' : 'Berufliche Angaben'}
              </h2>

              <div className="space-y-4">
                {role === 'student' ? (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-[#02187B] mb-1">
                        Universität *
                      </label>
                      <input
                        type="text"
                        value={universitySearch || university}
                        onChange={(e) => {
                          setUniversitySearch(e.target.value);
                          setUniversity('');
                          setShowUniversityDropdown(true);
                        }}
                        onFocus={() => setShowUniversityDropdown(true)}
                        placeholder="Tippen zum Suchen..."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('university') ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {showUniversityDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {universities
                            .filter(uni => uni.toLowerCase().includes((universitySearch || '').toLowerCase()))
                            .map((uni) => (
                              <div
                                key={uni}
                                onClick={() => {
                                  setUniversity(uni);
                                  setUniversitySearch('');
                                  setShowUniversityDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                              >
                                {uni}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#02187B] mb-1">
                          Fachsemester *
                        </label>
                        <input
                          type="text"
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          placeholder="z.B. 3"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('semester') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#02187B] mb-1">
                          Voraussichtliches Examen *
                        </label>
                        <input
                          type="text"
                          value={examYear}
                          onChange={(e) => setExamYear(e.target.value)}
                          placeholder="z.B. 2026"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('examYear') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#02187B] mb-1">
                        Uni-E-Mail (für Verifizierung) *
                      </label>
                      <input
                        type="email"
                        value={universityEmail}
                        onChange={(e) => setUniversityEmail(e.target.value)}
                        placeholder="vorname.nachname@uni-muenchen.de"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('universityEmail') ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-[#02187B] mb-1">
                        Fachrichtung *
                      </label>
                      <input
                        type="text"
                        value={specialtySearch || specialty}
                        onChange={(e) => {
                          setSpecialtySearch(e.target.value);
                          setSpecialty('');
                          setShowSpecialtyDropdown(true);
                        }}
                        onFocus={() => setShowSpecialtyDropdown(true)}
                        placeholder="Tippen zum Suchen..."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('specialty') ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {showSpecialtyDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {specialties
                            .filter(spec => spec.toLowerCase().includes((specialtySearch || '').toLowerCase()))
                            .map((spec) => (
                              <div
                                key={spec}
                                onClick={() => {
                                  setSpecialty(spec);
                                  setSpecialtySearch('');
                                  setShowSpecialtyDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                              >
                                {spec}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-[#02187B] mb-1">
                        Beschäftigung *
                      </label>
                      <div
                        onClick={() => setShowEmploymentDropdown(!showEmploymentDropdown)}
                        className={`w-full px-4 py-2 border rounded-lg cursor-pointer text-blue-900 bg-white ${fieldErrors.includes('employmentType') ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        {employmentType === 'angestellt' && 'Angestellt'}
                        {employmentType === 'niedergelassen' && 'Niedergelassen'}
                        {employmentType === 'weiterbildung' && 'In Weiterbildung'}
                      </div>
                      {showEmploymentDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div
                            onClick={() => {
                              setEmploymentType('angestellt');
                              setShowEmploymentDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                          >
                            Angestellt
                          </div>
                          <div
                            onClick={() => {
                              setEmploymentType('niedergelassen');
                              setShowEmploymentDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                          >
                            Niedergelassen
                          </div>
                          <div
                            onClick={() => {
                              setEmploymentType('weiterbildung');
                              setShowEmploymentDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                          >
                            In Weiterbildung
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-[#02187B] mb-1">
                        Land *
                      </label>
                      <div
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className={`w-full px-4 py-2 border rounded-lg cursor-pointer text-blue-900 bg-white ${fieldErrors.includes('country') ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        {country === 'deutschland' && 'Deutschland'}
                        {country === 'österreich' && 'Österreich'}
                        {country === 'schweiz' && 'Schweiz'}
                      </div>
                      {showCountryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div
                            onClick={() => {
                              setCountry('deutschland');
                              setShowCountryDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                          >
                            Deutschland
                          </div>
                          <div
                            onClick={() => {
                              setCountry('österreich');
                              setShowCountryDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                          >
                            Österreich
                          </div>
                          <div
                            onClick={() => {
                              setCountry('schweiz');
                              setShowCountryDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-900"
                          >
                            Schweiz
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#02187B] mb-1">
                        {country === 'deutschland' && 'Ärztekammer-Nummer (LANR) *'}
                        {country === 'österreich' && 'Ärztekammer-Nummer *'}
                        {country === 'schweiz' && 'GLN-Nummer (Global Location Number) *'}
                      </label>
                      <input
                        type="text"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        placeholder={
                          country === 'deutschland' ? 'z.B. 123456789' :
                          country === 'österreich' ? 'z.B. 12345' :
                          'z.B. 7601234567890'
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-blue-900 ${fieldErrors.includes('registerNumber') ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Registriere...' : 'Registrierung abschließen'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
