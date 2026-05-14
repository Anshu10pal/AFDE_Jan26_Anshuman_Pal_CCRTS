import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API from '../services/api';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState({ excel: false, pdf: false });

  const download = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await API.get(`/api/reports/complaints/${type}`, {
        responseType: 'blob'
      });
      const ext      = type === 'excel' ? 'xlsx' : 'pdf';
      const mime     = type === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const url      = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `CCRTS_Report_${new Date().toISOString().slice(0,10)}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} report downloaded!`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (!['admin', 'supervisor'].includes(user?.role)) {
    return <div style={{ padding: '2rem', color: '#6b7280' }}>Not authorized</div>;
  }

  return (
    <div>
      <div className="page-header"><h1>📥 Download Reports</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '700px' }}>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📊</div>
          <h3 style={{ color: '#1e3a5f', marginBottom: '0.5rem' }}>Excel Report</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            All complaints with full details, status colours, and summary sheet.
          </p>
          <button className="btn btn-success" style={{ width: '100%' }}
            onClick={() => download('excel')} disabled={loading.excel}>
            {loading.excel ? 'Generating...' : '⬇ Download Excel'}
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📄</div>
          <h3 style={{ color: '#1e3a5f', marginBottom: '0.5rem' }}>PDF Report</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Printable complaint report with table layout. Up to 100 most recent complaints.
          </p>
          <button className="btn btn-danger" style={{ width: '100%' }}
            onClick={() => download('pdf')} disabled={loading.pdf}>
            {loading.pdf ? 'Generating...' : '⬇ Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}