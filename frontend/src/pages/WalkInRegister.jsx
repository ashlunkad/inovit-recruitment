import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, MapPin } from 'lucide-react';

export default function WalkInRegister() {
  const [formData, setFormData] = useState({ fullName: '', phone: '', qualification: '', experienceYears: 0, currentCity: '', currentState: '', preferredLocation: '', hearAboutUs: '', referralCode: '', consent: false });
  const [locations, setLocations] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || '/api';
    axios.get(`${API}/walkin/form-data`).then(res => {
      setLocations(res.data.locations || []);
      setQualifications(res.data.qualifications || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent) { setError('Please accept the consent checkbox'); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await axios.post(`${API}/walkin/register?location=${params.get('location') || 'direct-link'}`, formData);
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-4">You will receive a WhatsApp message shortly with next steps.</p>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">Your Application ID: <span className="font-bold">{success.candidateId}</span></p>
          </div>
          <p className="text-xs text-gray-400 mt-6">INOVIT Solutions Pvt. Ltd.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-bold">INOVIT</h1>
          <p className="text-primary-200 text-sm">Solutions Private Limited</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Junior Electrician Registration</h2>
            <p className="text-sm text-gray-500">Smart Meter Installation • Rs. 15,000 - 22,000/month</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={formData.fullName} onChange={e => setFormData(f=>({...f, fullName: e.target.value}))} required placeholder="Enter your full name" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile / WhatsApp Number *</label>
              <input value={formData.phone} onChange={e => setFormData(f=>({...f, phone: e.target.value}))} required placeholder="10-digit mobile number" className="input-field font-mono" maxLength={10} type="tel" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
              <select value={formData.qualification} onChange={e => setFormData(f=>({...f, qualification: e.target.value}))} className="input-field">
                <option value="">Select qualification</option>
                {qualifications.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Electrical Experience</label>
              <input type="number" value={formData.experienceYears} onChange={e => setFormData(f=>({...f, experienceYears: Number(e.target.value)}))} min={0} max={30} className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current City *</label>
                <input value={formData.currentCity} onChange={e => setFormData(f=>({...f, currentCity: e.target.value}))} required placeholder="e.g., Lucknow" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input value={formData.currentState} onChange={e => setFormData(f=>({...f, currentState: e.target.value}))} placeholder="e.g., UP" className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Deployment Location</label>
              <select value={formData.preferredLocation} onChange={e => setFormData(f=>({...f, preferredLocation: e.target.value}))} className="input-field">
                <option value="">Select location</option>
                {locations.map(l => <option key={l._id} value={l._id}>{l.name} ({l.city})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about this?</label>
              <select value={formData.hearAboutUs} onChange={e => setFormData(f=>({...f, hearAboutUs: e.target.value}))} className="input-field">
                <option value="">Select</option>
                {['Job Fair', 'Office Visit', 'Referral', 'Banner/Poster', 'Social Media', 'WhatsApp', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (optional)</label>
              <input value={formData.referralCode} onChange={e => setFormData(f=>({...f, referralCode: e.target.value.toUpperCase()}))} placeholder="e.g., REF-AMIT-7823" className="input-field font-mono" />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input type="checkbox" checked={formData.consent} onChange={e => setFormData(f=>({...f, consent: e.target.checked}))}
                className="mt-1 rounded border-gray-300" id="consent" />
              <label htmlFor="consent" className="text-xs text-gray-600">
                I consent to INOVIT Solutions collecting and processing my personal data for recruitment purposes. I have read the <a href="#" className="text-primary-600 underline">Privacy Policy</a>. *
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
              {loading ? 'Registering...' : 'Register Now'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">INOVIT Solutions Private Limited © 2026</p>
        </div>
      </div>
    </div>
  );
}
