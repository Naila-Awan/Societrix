import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchCompletedEvents, 
  fetchSocietyReports, 
  submitEventReport 
} from '../../features/reports/reportSlice.mjs';
import '../../styles/pages/society/Reports.css';

const Reports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const reportsState = useSelector((state) => state.reports);
  const navigate = useNavigate();
  
  const { events = [], reports = [], loading = true, error = null } = reportsState || {};
  
  const [filter, setFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  const [newReport, setNewReport] = useState({
    eventId: '',
    title: '',
    content: '',
    attachments: [],
    attendeeCount: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [completedEvents, setCompletedEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (user?.societyId) {
          await dispatch(fetchCompletedEvents(user.societyId));
          await dispatch(fetchSocietyReports(user.societyId));
        } else if (user?.email) {
          await dispatch(fetchCompletedEvents(user.email));
          await dispatch(fetchSocietyReports(user.email));
        }
        
        if (isMounted) {
          setDataFetched(true);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
        if (isMounted) {
          setDataFetched(true);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, user]);

  useEffect(() => {
    const fetchCompletedEventsForDropdown = async () => {
      try {
        if (user?.email) {
          const events = await dispatch(fetchCompletedEvents(user.email)).unwrap();
          setCompletedEvents(events);
        }
      } catch (error) {
        console.error('Error fetching completed events for dropdown:', error);
      }
    };

    fetchCompletedEventsForDropdown();
  }, [dispatch, user]);

  useEffect(() => {
    if (showAddReportModal) {
      setNewReport({
        eventId: '',
        title: '',
        content: '',
        attachments: [],
        attendeeCount: '',
      });
    }
  }, [showAddReportModal]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };
  
  const handleAddReportInputChange = (e) => {
    const { name, value } = e.target;
    setNewReport((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddReportSubmit = async (e) => {
    e.preventDefault();

    if (!newReport.eventId || !newReport.title || !newReport.content || !newReport.attendeeCount) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...newReport,
        submissionDate: new Date().toISOString(),
        rating: 5,
      };

      await dispatch(submitEventReport(payload)).unwrap();

      setShowAddReportModal(false);
      setNewReport({
        eventId: '',
        title: '',
        content: '',
        attachments: [],
        attendeeCount: '',
      });

      if (user?.email) {
        await dispatch(fetchSocietyReports(user.email));
      }

      alert('Report added successfully!');
    } catch (error) {
      console.error('Error adding report:', error);
      alert('Failed to add report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    const attachments = files.map((file) => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    }));
    setNewReport((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...attachments],
    }));
  };

  const removeAttachment = (index) => {
    setNewReport((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const hasReport = (eventId) => {
    return reports.some(report => report.eventId === eventId);
  };
  
  const filteredEvents = Array.isArray(events) ? events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !hasReport(event._id);
    if (filter === 'submitted') return hasReport(event._id);
    return true;
  }) : [];

  const openAddReportForEvent = (event) => {
    setNewReport({
      eventId: event._id,
      title: '',
      content: '',
      attachments: [],
      attendeeCount: '',
    });
    setShowAddReportModal(true);
  };

  if (loading && !dataFetched) {
    return (
      <div className="society-reports-page">
        <div className="page-header">
          <h1 className="page-title">Event Reports</h1>
          <p className="page-description">Create and manage reports for your completed events</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error && dataFetched) {
    return (
      <div className="society-reports-page">
        <div className="page-header">
          <h1 className="page-title">Event Reports</h1>
          <p className="page-description">Create and manage reports for your completed events</p>
        </div>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Error loading reports</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="society-reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Reports</h1>
          <p className="page-description">Create and manage reports for your completed events</p>
        </div>
        
        <div className="filter-controls">
          <label htmlFor="filter">Filter:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events</option>
            <option value="pending">Pending Reports</option>
            <option value="submitted">Submitted Reports</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">📊</div>
          <h3>No events found</h3>
          <p>
            {filter === 'all' ? 'You have no completed events yet.' :
             filter === 'pending' ? 'All your completed events have reports.' :
             'You haven\'t submitted any reports yet.'}
          </p>
        </div>
      ) : (
        <div className="events-list">
          {filteredEvents.map(event => {
            const eventReport = reports.find(report => report.eventId === event._id);
            const hasSubmittedReport = !!eventReport;
            
            return (
              <div key={event._id} className="event-card">
                <div className="event-header">
                  <div>
                    <h3 className="event-title">{event.eventName}</h3>
                    <p className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="event-status">
                    <span className={hasSubmittedReport ? "status-submitted" : "status-pending"}>
                      {hasSubmittedReport ? 'Report Submitted' : 'Report Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="event-details">
                  <div className="detail-item">
                    <span className="detail-label">Venue:</span>
                    <span className="detail-value">{event.venue || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Event Time:</span>
                    <span className="detail-value">{event.time || 'Not specified'}</span>
                  </div>
                  {hasSubmittedReport && (
                    <div className="detail-item">
                      <span className="detail-label">Report Date:</span>
                      <span className="detail-value">
                        {new Date(eventReport.submissionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="event-description">
                  {event.description ? (
                    <p>{event.description.length > 150 
                      ? `${event.description.substring(0, 150)}...` 
                      : event.description}
                    </p>
                  ) : (
                    <p className="no-description">No description available</p>
                  )}
                </div>
                
                <div className="event-actions">
                  {hasSubmittedReport ? (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleViewReport(eventReport)}
                    >
                      View Report
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => openAddReportForEvent(event)}
                    >
                      Add Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button
        className="btn btn-primary add-report-btn"
        onClick={() => setShowAddReportModal(true)}
      >
        Add New Report
      </button>

      {showAddReportModal && (
        <div className="modal-overlay">
          <div className="modal add-report-modal">
            <div className="modal-header">
              <h2>Add New Report</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddReportModal(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddReportSubmit} className="add-report-form">
              <div className="form-group">
                <label htmlFor="eventId">Event <span className="required">*</span></label>
                <select
                  id="eventId"
                  name="eventId"
                  value={newReport.eventId}
                  onChange={(e) => setNewReport({ ...newReport, eventId: e.target.value })}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select an event</option>
                  {completedEvents.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="title">Title <span className="required">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newReport.title}
                  onChange={handleAddReportInputChange}
                  required
                  disabled={isSubmitting}
                  placeholder="Enter report title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Content <span className="required">*</span></label>
                <textarea
                  id="content"
                  name="content"
                  value={newReport.content}
                  onChange={handleAddReportInputChange}
                  rows="4"
                  required
                  disabled={isSubmitting}
                  placeholder="Provide details about the event outcome..."
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="attendeeCount">Attendee Count <span className="required">*</span></label>
                <input
                  type="number"
                  id="attendeeCount"
                  name="attendeeCount"
                  value={newReport.attendeeCount}
                  onChange={handleAddReportInputChange}
                  min="0"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter the number of attendees"
                />
              </div>
              <div className="form-group">
                <label>Attachments</label>
                <input
                  type="file"
                  onChange={handleAttachmentUpload}
                  multiple
                  disabled={isSubmitting}
                />
                <div className="attachments-list">
                  {newReport.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <span>{attachment.name} ({attachment.size})</span>
                      <button
                        type="button"
                        className="remove-attachment-btn"
                        onClick={() => removeAttachment(index)}
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddReportModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedReport && (
        <div className="modal-overlay">
          <div className="modal report-view-modal">
            <div className="modal-header">
              <h2>Event Report</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="report-view-content">
              <div className="event-info-banner">
                <h3>{selectedReport.eventName}</h3>
                <div className="report-meta">
                  <span>Event Date: {selectedReport.eventDate ? new Date(selectedReport.eventDate).toLocaleDateString() : 'N/A'}</span>
                  <span>Report Submitted: {new Date(selectedReport.submissionDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="report-section">
                <h4>Event Summary</h4>
                <p>{selectedReport.summary || selectedReport.content}</p>
              </div>
              
              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">Attendees</span>
                  <span className="stat-value" style={{color: "black"} }>{selectedReport.attendeeCount}</span>
                </div>
                {selectedReport.rating !== null && (
                  <div className="stat-item">
                    <span className="stat-label">Admin Rating</span>
                    <span className="stat-value rating">
                      ★ {selectedReport.rating}
                    </span>
                  </div>
                )}
              </div>
              
              {selectedReport.achievements && (
                <div className="report-section">
                  <h4>Key Achievements</h4>
                  <p>{selectedReport.achievements}</p>
                </div>
              )}
              
              {selectedReport.challenges && (
                <div className="report-section">
                  <h4>Challenges Faced</h4>
                  <p>{selectedReport.challenges}</p>
                </div>
              )}
              
              {selectedReport.feedback && (
                <div className="report-section">
                  <h4>Participant Feedback</h4>
                  <p>{selectedReport.feedback}</p>
                </div>
              )}
              
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div className="report-section">
                  <h4>Event Photos</h4>
                  <div className="report-photos">
                    {selectedReport.photos.map((photo, index) => (
                      <div key={index} className="report-photo">
                        <img 
                          src={photo.data || photo.url} 
                          alt={`Event photo ${index + 1}`} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div className="report-section">
                  <h4>Attachments</h4>
                  <div className="attachment-list">
                    {selectedReport.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item">
                        <span>{attachment.name} ({attachment.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
