import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllReports, 
  updateReportRating 
} from '../../features/reports/reportSlice.mjs';
import { fetchSocieties } from '../../features/society/societySlice.mjs';
import { getAllEvents } from '../../features/events/eventSlice.mjs';
import '../../styles/pages/admin/Reports.css';

const Reports = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'recent', 'oldest', 'highRated', 'lowRated'
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const dispatch = useDispatch();
  const { reports, loading } = useSelector((state) => state.reports);
  const { events } = useSelector((state) => state.events);
  const { societies } = useSelector((state) => state.society);

  const [processedReports, setProcessedReports] = useState([]);

  useEffect(() => {
    dispatch(fetchAllReports());
    dispatch(getAllEvents());
    dispatch(fetchSocieties());
  }, [dispatch]);

  useEffect(() => {
    if (reports?.length && events?.length && societies?.length) {
      const enhancedReports = reports.map(report => {
        const matchingEvent = events.find(event => event._id === report.eventId);
        const matchingSociety = matchingEvent ? 
          societies.find(society => society._id === matchingEvent.societyId) : null;

        return {
          ...report,
          eventName: report.eventName || (matchingEvent?.eventName || 'Unknown Event'),
          eventDate: report.eventDate || (matchingEvent?.date || new Date().toISOString()),
          societyName: report.societyName || (matchingSociety?.name || 'Unknown Society')
        };
      });

      setProcessedReports(enhancedReports);
    } else {
      setProcessedReports(reports || []);
    }
  }, [reports, events, societies]);

  const handleRatingChange = (reportId, rating, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentReports = [...reports];
    const reportIndex = reports.findIndex(r => r._id === reportId);
    if (reportIndex !== -1) {
      const updatedReports = [...reports];
      updatedReports[reportIndex] = { ...updatedReports[reportIndex], rating };
      dispatch({ type: 'reports/setReports', payload: updatedReports });
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport(prev => ({ ...prev, rating }));
      }
    }
    
    console.log(`Updating report ${reportId} with rating ${rating}`);
    
    dispatch(updateReportRating({ id: reportId, rating }))
      .unwrap()
      .then((result) => {
        console.log('Report rating updated successfully:', result);
        
        if (result.societyRating) {
          console.log(`Society rating updated to ${result.societyRating}`);
        }
      })
      .catch(error => {
        console.error('Failed to update rating:', error);
        alert(`Failed to update rating: ${error}`);
        
        dispatch({ type: 'reports/setReports', payload: currentReports });
        if (selectedReport && selectedReport._id === reportId) {
          setSelectedReport(prev => ({ 
            ...prev, 
            rating: currentReports.find(r => r._id === reportId)?.rating 
          }));
        }
      });
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleDownloadAttachment = async (reportId, attachmentName) => {
    try {
      setDownloadStatus((prev) => ({
        ...prev,
        [`${reportId}_${attachmentName}`]: 'downloading'
      }));

      const response = await fetch(`/api/reports/${reportId}/attachments/${encodeURIComponent(attachmentName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error downloading attachment: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachmentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus((prev) => ({
        ...prev,
        [`${reportId}_${attachmentName}`]: 'completed'
      }));

      setTimeout(() => {
        setDownloadStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[`${reportId}_${attachmentName}`];
          return newStatus;
        });
      }, 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus((prev) => ({
        ...prev,
        [`${reportId}_${attachmentName}`]: 'failed'
      }));

      setTimeout(() => {
        setDownloadStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[`${reportId}_${attachmentName}`];
          return newStatus;
        });
      }, 3000);
    }
  };

  const renderDownloadButton = (reportId, attachment) => {
    const status = downloadStatus[`${reportId}_${attachment.name}`];

    switch (status) {
      case 'downloading':
        return <button className="download-btn downloading">Downloading...</button>;
      case 'completed':
        return <button className="download-btn completed">Downloaded ✓</button>;
      case 'failed':
        return <button className="download-btn failed" onClick={() => handleDownloadAttachment(reportId, attachment.name)}>Retry</button>;
      default:
        return <button className="download-btn" onClick={() => handleDownloadAttachment(reportId, attachment.name)}>Download</button>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  };

  const getFilteredAndSortedReports = () => {
    let filtered = [...processedReports];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        (report.title && report.title.toLowerCase().includes(term)) ||
        (report.societyName && report.societyName.toLowerCase().includes(term)) ||
        (report.eventName && report.eventName.toLowerCase().includes(term)) ||
        (report.content && report.content.toLowerCase().includes(term))
      );
    }
    
    switch(filter) {
      case 'recent':
        return filtered.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));
      case 'highRated':
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'lowRated':
        return filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'unrated':
        return filtered.filter(report => report.rating === null);
      default:
        return filtered.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
    }
  };

  if (loading) {
    return <div className="loading">Loading reports archive...</div>;
  }

  const filteredReports = getFilteredAndSortedReports();

  const renderStarRating = (report) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${report.rating >= i ? 'filled' : ''}`}
          onClick={(e) => handleRatingChange(report._id, i, e)}
        >
          ★
        </span>
      );
    }
    return <div className="star-rating">{stars}</div>;
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports Archive</h1>
        <div className="reports-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-controls">
            <label htmlFor="filter">View:</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Reports</option>
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="highRated">Highest Rated</option>
              <option value="lowRated">Lowest Rated</option>
              <option value="unrated">Unrated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reports-stats">
        <div className="stat-card">
          <span className="stat-value">{processedReports.length}</span>
          <span className="stat-label">Total Reports</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{processedReports.filter(r => r.rating !== null).length}</span>
          <span className="stat-label">Rated Reports</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {processedReports.length > 0 
              ? (processedReports.reduce((sum, r) => sum + (r.rating || 0), 0) / 
                 processedReports.filter(r => r.rating !== null).length).toFixed(1) 
              : '0'}
          </span>
          <span className="stat-label">Avg Rating</span>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports">No reports found matching your criteria</div>
      ) : (
        <div className="reports-list">
          {filteredReports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <div className="report-society-info">
                  <h3>{report.title || 'Untitled Report'}</h3>
                  <div className="society-name">{report.societyName || 'Unknown Society'}</div>
                </div>
                <div className="existing-rating">
                  Rating: <span className="rating-value">★ {report.rating || 0}</span>
                </div>
              </div>
              <hr />

              <div className="report-info">
                <div className="info-item">
                  <span className="info-label">Society</span>
                  <span className="info-value">{report.societyName || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Event Date</span>
                  <span className="info-value">{formatDate(report.eventDate)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Submitted</span>
                  <span className="info-value">{formatDate(report.submissionDate)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Attendees</span>
                  <span className="info-value">{report.attendeeCount || 'N/A'}</span>
                </div>
              </div>

              <div className="report-preview">
                <p>{report.content.substring(0, 150)}...</p>
              </div>

              <div className="report-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleViewReport(report)}
                >
                  View Full Report
                </button>
                <div className="rating-container">
                  <span className="rating-label">Rate:</span>
                  {renderStarRating(report)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReportModal && selectedReport && (
        <div className="modal-overlay">
          <div className="modal report-modal">
            <div className="modal-header">
              <h2>{selectedReport.title}</h2>
              <button className="close-btn" onClick={() => setShowReportModal(false)}>×</button>
            </div>

            <div className="report-modal-content">
              <div className="report-meta">
                <div className="meta-section">
                  <h3>Event Information</h3>
                  <div className="meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Society:</span>
                      <span className="meta-value">{selectedReport.societyName || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Event:</span>
                      <span className="meta-value">{selectedReport.eventName || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Date:</span>
                      <span className="meta-value">{formatDate(selectedReport.eventDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="meta-section">
                  <h3>Report Details</h3>
                  <div className="meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Submitted:</span>
                      <span className="meta-value">{formatDate(selectedReport.submissionDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="report-content">
                <h3>Report Content</h3>
                <p>{selectedReport.content}</p>
              </div>

              <div className="report-attachments">
                <h3>Attachments</h3>
                <ul className="attachments-list">
                  {selectedReport.attachments.map((attachment, index) => (
                    <li key={`${selectedReport._id}_${attachment.name}`} className="attachment-item">
                      <span className="attachment-icon">📎</span>
                      <span className="attachment-name">{attachment.name}</span>
                      <span className="attachment-size">{attachment.size}</span>
                      {renderDownloadButton(selectedReport._id, attachment)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="report-rating-section">
                <h3>Rate This Report</h3>
                <div className="rating-container modal-rating">
                  {renderStarRating(selectedReport)}
                  <span className="rating-help">
                    Rating this report helps prioritize high-performing societies
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
