'use client';

import { useState, useEffect } from 'react';
import { SectionLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Download, Eye, Trash2, Search, Filter, FolderOpen } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';

interface Document {
  _id: string;
  name: string;
  type: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy: { name: string; email: string };
  linkedTo: { entityType: string };
  status: string;
  fileUrl: string;
  fileData?: string;
  mimeType?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, byType: [] });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    uploadedBy: '',
    minSize: '',
    maxSize: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${API_URL}/api/finance-advanced/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.type) {
      filtered = filtered.filter(doc => doc.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(doc => new Date(doc.uploadedAt) <= new Date(filters.dateTo));
    }
    if (filters.uploadedBy) {
      filtered = filtered.filter(doc => doc.uploadedBy?.name?.toLowerCase().includes(filters.uploadedBy.toLowerCase()));
    }
    if (filters.minSize) {
      filtered = filtered.filter(doc => (doc.fileSize || 0) >= Number(filters.minSize) * 1024 * 1024);
    }
    if (filters.maxSize) {
      filtered = filtered.filter(doc => (doc.fileSize || 0) <= Number(filters.maxSize) * 1024 * 1024);
    }

    return filtered;
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      uploadedBy: '',
      minSize: '',
      maxSize: ''
    });
  };

  const filteredDocuments = applyFilters();

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${API_URL}/api/finance-advanced/documents/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Stats received:', data);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', 'OTHER');
      formData.append('entityType', 'GENERAL');
      formData.append('entityId', 'none');

      const token = localStorage.getItem('auth-token');
      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      const res = await fetch(`${API_URL}/api/finance-advanced/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      console.log('Upload response status:', res.status);
      const result = await res.json();
      console.log('Upload result:', result);

      if (res.ok) {
        alert('✅ Document uploaded successfully!');
        await fetchDocuments();
        await fetchStats();
      } else {
        alert(`❌ Upload failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      await fetch(`${API_URL}/api/finance-advanced/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${API_URL}/api/finance-advanced/documents/${doc._id}?download=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${API_URL}/api/finance-advanced/documents/${doc._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setViewDoc(data.document || doc);
    } catch (error) {
      console.error('Failed to load document:', error);
      setViewDoc(doc);
    }
  };

  const getTypeColor = (type: string) => {
    const t = type?.toUpperCase();
    switch (t) {
      case 'INVOICE': return 'bg-blue-100 text-blue-700';
      case 'RECEIPT': return 'bg-green-100 text-green-700';
      case 'CONTRACT': return 'bg-purple-100 text-purple-700';
      case 'REPORT': return 'bg-orange-100 text-orange-700';
      case 'CERTIFICATE': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700';
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const columns: Column<Document>[] = [
    {
      key: 'name',
      header: 'Document Name',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <Badge className={getTypeColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'linkedTo',
      header: 'Category',
      render: (value: any) => value?.entityType || 'General',
      sortable: true
    },
    {
      key: 'fileSize',
      header: 'Size',
      render: (value) => formatFileSize(value as number),
      sortable: true
    },
    {
      key: 'uploadedAt',
      header: 'Upload Date',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'uploadedBy',
      header: 'Uploaded By',
      render: (value: any) => value?.name || 'Unknown',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge className={getStatusColor(value)} variant="secondary">
          {value || 'ACTIVE'}
        </Badge>
      )
    },
    {
      key: '_id',
      header: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleView(row)} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDownload(row)} title="Download">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(value)} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const categories = [
    { name: 'Invoices', count: 45, icon: FileText },
    { name: 'Receipts', count: 32, icon: FileText },
    { name: 'Contracts', count: 18, icon: FileText },
    { name: 'Tax Documents', count: 25, icon: FileText },
    { name: 'Audit Reports', count: 12, icon: FileText },
    { name: 'Certificates', count: 8, icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management"
        description="Organize and manage financial documents and attachments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Documents' }
        ]}
        actions={
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0))}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{documents.filter(d => d.status === 'PENDING_REVIEW').length}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
              </div>
              <Upload className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="w-full mt-1 p-2 border rounded" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                  <option value="">All Types</option>
                  <option value="INVOICE">Invoice</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="REPORT">Report</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="w-full mt-1 p-2 border rounded" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Uploaded By</label>
                <Input placeholder="Search by name" value={filters.uploadedBy} onChange={(e) => setFilters({...filters, uploadedBy: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Min Size (MB)</label>
                <Input type="number" placeholder="0" value={filters.minSize} onChange={(e) => setFilters({...filters, minSize: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Max Size (MB)</label>
                <Input type="number" placeholder="50" value={filters.maxSize} onChange={(e) => setFilters({...filters, maxSize: e.target.value})} />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Document Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div key={category.name} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <category.icon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{category.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <SectionLoader text="Loading documents..." />
          ) : (
            <DataTable
              data={filteredDocuments}
              columns={columns}
              title="All Documents"
              searchable
              exportable
              onExport={() => console.log('Export documents')}
            />
          )}
        </TabsContent>

        <TabsContent value="recent">
          <DataTable
            data={filteredDocuments.slice(0, 10)}
            columns={columns}
            title="Recent Documents"
            searchable
          />
        </TabsContent>

        <TabsContent value="pending">
          <DataTable
            data={filteredDocuments.filter(doc => doc.status === 'PENDING_REVIEW')}
            columns={columns}
            title="Pending Review"
            searchable
          />
        </TabsContent>

        <TabsContent value="archived">
          <DataTable
            data={filteredDocuments.filter(doc => doc.status === 'ARCHIVED')}
            columns={columns}
            title="Archived Documents"
            searchable
          />
        </TabsContent>
      </Tabs>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
            <p className="text-muted-foreground mb-4">Support for PDF, DOC, XLS, and image files up to 10MB</p>
            <input
              type="file"
              id="quick-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button onClick={() => document.getElementById('quick-upload')?.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Document Modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewDoc(null)}>
          <Card className="w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Document Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewDoc(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{viewDoc.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge className={getTypeColor(viewDoc.type)}>{viewDoc.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{formatFileSize(viewDoc.fileSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(viewDoc.status)}>{viewDoc.status || 'ACTIVE'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded By</p>
                  <p className="font-medium">{viewDoc.uploadedBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upload Date</p>
                  <p className="font-medium">{new Date(viewDoc.uploadedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{viewDoc.linkedTo?.entityType || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File URL</p>
                  <p className="font-medium text-xs truncate">{viewDoc.fileUrl}</p>
                </div>
              </div>
              {viewDoc.fileData && (
                <div className="mt-4 border rounded p-2 max-h-96 overflow-auto">
                  {viewDoc.mimeType?.startsWith('image/') ? (
                    <img src={`data:${viewDoc.mimeType};base64,${viewDoc.fileData}`} alt={viewDoc.name} className="w-full" />
                  ) : viewDoc.mimeType === 'application/pdf' ? (
                    <iframe src={`data:application/pdf;base64,${viewDoc.fileData}`} className="w-full h-96" />
                  ) : viewDoc.mimeType?.startsWith('audio/') ? (
                    <audio controls className="w-full">
                      <source src={`data:${viewDoc.mimeType};base64,${viewDoc.fileData}`} />
                    </audio>
                  ) : viewDoc.mimeType?.startsWith('video/') ? (
                    <video controls className="w-full h-96">
                      <source src={`data:${viewDoc.mimeType};base64,${viewDoc.fileData}`} />
                    </video>
                  ) : viewDoc.mimeType?.includes('word') || viewDoc.mimeType?.includes('document') ? (
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                      <p className="font-medium">{viewDoc.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">Word Document - {formatFileSize(viewDoc.fileSize)}</p>
                      <Button onClick={() => handleDownload(viewDoc)} className="mt-4">Download to View</Button>
                    </div>
                  ) : viewDoc.mimeType?.includes('sheet') || viewDoc.mimeType?.includes('excel') ? (
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-green-500" />
                      <p className="font-medium">{viewDoc.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">Excel Spreadsheet - {formatFileSize(viewDoc.fileSize)}</p>
                      <Button onClick={() => handleDownload(viewDoc)} className="mt-4">Download to View</Button>
                    </div>
                  ) : viewDoc.mimeType?.includes('presentation') || viewDoc.mimeType?.includes('powerpoint') ? (
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                      <p className="font-medium">{viewDoc.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">PowerPoint Presentation - {formatFileSize(viewDoc.fileSize)}</p>
                      <Button onClick={() => handleDownload(viewDoc)} className="mt-4">Download to View</Button>
                    </div>
                  ) : viewDoc.mimeType?.includes('csv') ? (
                    <div className="overflow-auto max-h-96">
                      <pre className="text-xs p-4">{atob(viewDoc.fileData)}</pre>
                    </div>
                  ) : viewDoc.mimeType === 'text/plain' ? (
                    <pre className="whitespace-pre-wrap p-4">{atob(viewDoc.fileData)}</pre>
                  ) : (
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      <p className="font-medium">{viewDoc.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">Preview not available for this file type</p>
                      <Button onClick={() => handleDownload(viewDoc)} className="mt-4">Download to View</Button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleDownload(viewDoc)} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
