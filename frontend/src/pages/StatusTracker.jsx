import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function StatusTracker() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    axios.get(`${API}/status/${token}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Invalid status link'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  const { name, candidateId, currentStage, stages, status, details } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center text-white mb-6">
          <h1 className="text-2xl font-bold">INOVIT</h1>
          <p className="text-blue-200 text-sm">Application Status Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mb-3">
              {name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{name}</h2>
            <p className="text-sm text-gray-500">{candidateId}</p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
              {status?.replace(/_/g, ' ')}
            </div>
          </div>

          {/* Progress stages */}
          <div className="space-y-1 mb-6">
            {stages?.map((stage, i) => {
              const isCompleted = i < currentStage;
              const isCurrent = i === currentStage;
              const isPending = i > currentStage;
              return (
                <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-lg transition ${isCurrent ? 'bg-blue-50 border border-blue-200' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : stage.icon || i + 1}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-400'}`}>
                      {stage.label}
                    </div>
                    {isCurrent && details?.interviewDate && stage.key === 'interview' && (
                      <div className="text-xs text-blue-600 mt-0.5">Scheduled: {new Date(details.interviewDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    )}
                    {isCurrent && stage.key === 'training' && details?.trainingStatus && (
                      <div className="text-xs text-blue-600 mt-0.5">Training Status: {details.trainingStatus.replace(/_/g, ' ')}</div>
                    )}
                  </div>
                  {isCompleted && <span className="text-green-500 text-xs">Done</span>}
                  {isCurrent && <span className="text-blue-500 text-xs font-medium animate-pulse">Current</span>}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <a href={`https://wa.me/919999900000?text=STATUS`} target="_blank" rel="noopener noreferrer"
              className="block w-full py-2.5 bg-green-500 text-white rounded-lg text-center text-sm font-medium hover:bg-green-600 transition">
              💬 Contact HR on WhatsApp
            </a>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">INOVIT Solutions Private Limited © 2026</p>
        </div>
      </div>
    </div>
  );
}
