import React, { useState } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Download, FileText, FileJson, FileType, CheckCircle, Loader2 } from 'lucide-react';
import type { ExportOptions, ExportData, ActivityFilters, DateRangePreset } from '@/types/analytics.types';

interface AnalyticsExportProps {
  filters?: ActivityFilters;
  className?: string;
}

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV', description: 'Spreadsheet data', icon: FileText },
  { value: 'json', label: 'JSON', description: 'Structured data', icon: FileJson },
  { value: 'pdf', label: 'PDF', description: 'Report format', icon: FileType },
];

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: '7 Days' },
  { value: 'last30days', label: '30 Days' },
];

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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <CardTitle>Export Analytics Data</CardTitle>
            <CardDescription>Download analytics data in your preferred format</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Format selection */}
        <div className="space-y-3">
          <Label>Export Format</Label>
          <div className="grid grid-cols-3 gap-3">
            {FORMAT_OPTIONS.map((format) => {
              const Icon = format.icon;
              const isSelected = exportOptions.format === format.value;
              return (
                <button
                  key={format.value}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as 'csv' | 'json' | 'pdf' }))}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  )}
                >
                  <Icon className={cn('h-5 w-5 mb-2', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium text-foreground">{format.label}</p>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-3">
          <Label>Date Range</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                onClick={() => handleDateRangePreset(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs">From</Label>
              <Input
                id="start-date"
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-[160px]"
              />
            </div>
            <span className="text-muted-foreground mt-6">to</span>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs">To</Label>
              <Input
                id="end-date"
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-[160px]"
              />
            </div>
          </div>
        </div>

        {/* PDF options */}
        {exportOptions.format === 'pdf' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <Checkbox
              id="include-charts"
              checked={exportOptions.includeCharts}
              onCheckedChange={(checked) => setExportOptions(prev => ({
                ...prev,
                includeCharts: checked === true
              }))}
            />
            <Label htmlFor="include-charts" className="text-sm cursor-pointer">
              Include charts and visualizations
            </Label>
          </div>
        )}

        {/* Export button */}
        <Button 
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </>
          )}
        </Button>

        {/* Success message */}
        {exportData && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1">Export Completed</h4>
                <p className="text-xs text-muted-foreground space-y-0.5">
                  <span className="block">File: <strong className="text-foreground">{exportData.filename}</strong></span>
                  <span className="block">Size: <strong className="text-foreground">{formatFileSize(exportData.size)}</strong></span>
                  <span className="block">Generated: <strong className="text-foreground">{new Date(exportData.generatedAt).toLocaleString()}</strong></span>
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-2"
                  asChild
                >
                  <a href={exportData.url} download={exportData.filename}>
                    <Download className="h-3 w-3 mr-1" />
                    Download Again
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AnalyticsExport;
