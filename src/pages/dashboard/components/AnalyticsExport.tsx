import React, { useState } from 'react';
import { analyticsService } from '@/services/analytics.service';
import type { ExportOptions, ExportData, ActivityFilters, DateRangePreset } from '@/types/analytics.types';

interface AnalyticsExportProps {
  filters?: ActivityFilters;
  className?: string;
}

export function AnalyticsExport({ filters = {}, className = '' }: AnalyticsExportProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    includeCharts: false,
    filters,
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportData(null);

    try {
      const result = await analyticsService.exportAnalytics({
        ...exportOptions,
        filters: { ...filters, ...exportOptions.filters },
      });
      setExportData(result);

      // Automatically download the file
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      // Handle error appropriately
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateRangePreset = (preset: DateRangePreset) => {
    const today = new Date();
    let start: Date;

    switch (preset) {
      case 'today':
        start = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setExportOptions(prev => ({
      ...prev,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      },
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`analytics-export ${className}`}>
      <div className="export-header">
        <h3>Export Analytics Data</h3>
        <p>Download analytics data in your preferred format</p>
      </div>

      <div className="export-options">
        <div className="option-group">
          <label className="option-label">Export Format</label>
          <div className="format-options">
            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportOptions.format === 'csv'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'csv' }))}
              />
              <div className="format-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span>CSV</span>
                <small>Spreadsheet data</small>
              </div>
            </label>

            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportOptions.format === 'json'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' }))}
              />
              <div className="format-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <path d="M9 13h6"/>
                  <path d="M9 17h6"/>
                </svg>
                <span>JSON</span>
                <small>Structured data</small>
              </div>
            </label>

            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={exportOptions.format === 'pdf'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'pdf' }))}
              />
              <div className="format-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
                <span>PDF</span>
                <small>Report format</small>
              </div>
            </label>
          </div>
        </div>

        <div className="option-group">
          <label className="option-label">Date Range</label>
          <div className="date-range-options">
            <div className="date-presets">
              {(['today', 'yesterday', 'last7days', 'last30days'] as DateRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleDateRangePreset(preset)}
                  className="preset-button"
                >
                  {preset === 'today' && 'Today'}
                  {preset === 'yesterday' && 'Yesterday'}
                  {preset === 'last7days' && 'Last 7 Days'}
                  {preset === 'last30days' && 'Last 30 Days'}
                </button>
              ))}
            </div>

            <div className="custom-date-range">
              <input
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="date-input"
              />
            </div>
          </div>
        </div>

        {exportOptions.format === 'pdf' && (
          <div className="option-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeCharts: e.target.checked
                }))}
              />
              <span>Include charts and visualizations</span>
            </label>
          </div>
        )}
      </div>

      <div className="export-actions">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="export-button primary"
        >
          {isExporting ? (
            <>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="spinning"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Data
            </>
          )}
        </button>
      </div>

      {exportData && (
        <div className="export-success">
          <div className="success-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div className="success-content">
            <h4>Export Completed</h4>
            <p>
              File: <strong>{exportData.filename}</strong><br/>
              Size: <strong>{formatFileSize(exportData.size)}</strong><br/>
              Generated: <strong>{new Date(exportData.generatedAt).toLocaleString()}</strong>
            </p>
            <a
              href={exportData.url}
              download={exportData.filename}
              className="download-link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Again
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsExport; 