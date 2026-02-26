import { useState } from 'react';
import { importAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ImportData() {
  const [step, setStep] = useState(1); // 1=upload, 2=map, 3=results
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState(null); // headers, preview, systemFields, batchId
  const [mapping, setMapping] = useState({});
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await importAPI.upload(formData);
      setUploadData(res.data);
      // Auto-map obvious columns
      const autoMap = {};
      const headers = res.data.headers || [];
      res.data.systemFields?.forEach(sf => {
        const match = headers.find(h => {
          const hl = h.toLowerCase().replace(/[_\-\s]/g, '');
          const sl = sf.label.toLowerCase().replace(/[_\-\s]/g, '');
          return hl === sl || hl.includes(sl) || sl.includes(hl) || hl.includes(sf.key.toLowerCase());
        });
        if (match) autoMap[sf.key] = match;
      });
      setMapping(autoMap);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!mapping.fullName || !mapping.phone) {
      toast.error('Name and Phone mapping are required');
      return;
    }
    setProcessing(true);
    try {
      const res = await importAPI.process({
        batchId: uploadData.batchId,
        filePath: uploadData.filePath,
        fileType: uploadData.fileType,
        columnMapping: mapping,
      });
      setResults(res.data.results);
      setStep(3);
      toast.success(`Imported ${res.data.results.imported} candidates!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setStep(1); setFile(null); setUploadData(null); setMapping({}); setResults(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
        {step > 1 && <button onClick={reset} className="btn-outline text-sm">New Import</button>}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Upload File', 'Map Columns', 'Results'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span className={step === i+1 ? 'font-medium text-gray-800' : 'text-gray-400'}>{s}</span>
            {i < 2 && <ArrowRight size={14} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-gray-600">Reading file...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg text-gray-700 mb-2">Drag & drop your file here</p>
                <p className="text-sm text-gray-500 mb-4">Supports: Excel (.xlsx, .xls) and CSV (.csv)</p>
                <label className="btn-primary cursor-pointer">
                  Browse Files
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleUpload(e.target.files[0])} />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && uploadData && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-1">Map Your Columns</h2>
            <p className="text-sm text-gray-500 mb-4">
              File: <strong>{file?.name}</strong> • {uploadData.totalRows} rows detected • {uploadData.headers?.length} columns
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {uploadData.systemFields?.map(sf => (
                <div key={sf.key} className="flex items-center gap-3">
                  <label className={`w-40 text-sm ${sf.required ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                    {sf.label} {sf.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[sf.key] || ''}
                    onChange={e => setMapping(m => ({ ...m, [sf.key]: e.target.value }))}
                    className={`input-field flex-1 ${sf.required && !mapping[sf.key] ? 'border-red-300' : ''}`}
                  >
                    <option value="">-- Select Column --</option>
                    {uploadData.headers?.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Preview (first 10 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>{uploadData.headers?.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {uploadData.preview?.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      {uploadData.headers?.map(h => <td key={h} className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[200px] truncate">{row[h] ?? ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={reset} className="btn-outline">Cancel</button>
            <button onClick={handleProcess} disabled={processing || !mapping.fullName || !mapping.phone}
              className="btn-primary disabled:opacity-50">
              {processing ? 'Importing...' : `Import ${uploadData.totalRows} Candidates`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && results && (
        <div className="card">
          <div className="text-center mb-6">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Import Complete!</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{results.imported}</div>
              <div className="text-sm text-green-700">Imported</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{results.duplicates}</div>
              <div className="text-sm text-yellow-700">Duplicates (skipped)</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{results.errors}</div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{results.blacklisted}</div>
              <div className="text-sm text-gray-700">Blacklisted (blocked)</div>
            </div>
          </div>
          {results.errorDetails?.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Error Details (first 20)</h3>
              <div className="bg-red-50 rounded-lg p-3 max-h-60 overflow-y-auto text-sm space-y-1">
                {results.errorDetails.slice(0, 20).map((e, i) => (
                  <div key={i} className="text-red-700">Row {e.row}: {e.error}</div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-center mt-6 gap-3">
            <button onClick={reset} className="btn-outline">Import More</button>
            <button onClick={() => window.location.href = '/candidates'} className="btn-primary">View Candidates</button>
          </div>
        </div>
      )}
    </div>
  );
}
