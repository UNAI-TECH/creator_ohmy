import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Upload,
  Search,
  Trash2,
  Check,
  Image as ImageIcon,
  Film,
  Loader2,
  Copy,
  Save,
} from 'lucide-react';
import { contentService, MediaAssetRecord } from '../services/contentService';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (asset: MediaAssetRecord) => void;
  onSelectMultiple?: (assets: MediaAssetRecord[]) => void;
  multiple?: boolean;
  accept?: 'all' | 'image' | 'video';
  title?: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  multiple = false,
  accept = 'image',
  title = 'Media Library',
}: MediaLibraryModalProps) {
  const { success, error } = useToast();
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeAsset, setActiveAsset] = useState<MediaAssetRecord | null>(null);

  // Meta fields for uploading or editing active asset
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [credit, setCredit] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const list = await contentService.getMediaAssets(kindFilter);
      setAssets(list);
    } catch (e: any) {
      error(e?.message || 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setActiveAsset(null);
      loadAssets();
    }
  }, [isOpen, kindFilter]);

  useEffect(() => {
    if (activeAsset) {
      setAltText(activeAsset.alt_text || '');
      setCaption(activeAsset.caption || '');
      setCredit(activeAsset.credit || '');
    }
  }, [activeAsset]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: MediaAssetRecord[] = [];
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const res = await contentService.uploadTrackedMedia(file, {
          assetKind: isVideo ? 'video' : 'article_image',
          altText: file.name.replace(/\.[^.]+$/, ''),
        });
        uploaded.push(res.asset);
      }
      setAssets((prev) => [...uploaded, ...prev]);
      if (uploaded[0]) setActiveAsset(uploaded[0]);
      success(`Uploaded ${uploaded.length} file${uploaded.length > 1 ? 's' : ''} successfully.`);
    } catch (e: any) {
      error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!activeAsset) return;
    setSavingMeta(true);
    try {
      const updated = await contentService.updateMediaAssetMeta(activeAsset.id, {
        alt_text: altText.trim(),
        caption: caption.trim(),
        credit: credit.trim(),
      });
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setActiveAsset(updated);
      success('Media metadata saved.');
    } catch (e: any) {
      error(e?.message || 'Failed to save metadata');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteAsset = async (asset: MediaAssetRecord) => {
    if (!window.confirm(`Delete "${asset.file_name}"?`)) return;
    try {
      await contentService.deleteMediaAsset(asset);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (activeAsset?.id === asset.id) setActiveAsset(null);
      success('Media deleted.');
    } catch (e: any) {
      error(e?.message || 'Delete blocked');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (accept === 'image' && a.mime_type.startsWith('video/')) return false;
      if (accept === 'video' && !a.mime_type.startsWith('video/')) return false;
      if (!q) return true;
      return (
        a.file_name.toLowerCase().includes(q) ||
        (a.alt_text || '').toLowerCase().includes(q) ||
        (a.credit || '').toLowerCase().includes(q)
      );
    });
  }, [assets, accept, search]);

  const toggleSelect = (asset: MediaAssetRecord) => {
    setActiveAsset(asset);
    if (!multiple) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.id)) next.delete(asset.id);
      else next.add(asset.id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (multiple && onSelectMultiple) {
      const chosen = assets.filter((a) => selectedIds.has(a.id));
      if (chosen.length === 0 && activeAsset) chosen.push(activeAsset);
      onSelectMultiple(chosen);
      onClose();
      return;
    }
    if (activeAsset && onSelect) {
      onSelect(activeAsset);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">
              {multiple ? 'Select multiple images for gallery' : 'Upload or pick an asset with alt text & photo credit'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Left Grid */}
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media by filename, alt text, credit..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#D4191F]"
                />
              </div>

              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none"
              >
                <option value="all">All kinds</option>
                <option value="article_image">Article images</option>
                <option value="video">Videos</option>
                <option value="branding">Branding</option>
                <option value="story">Stories</option>
              </select>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4191F] hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  multiple
                  accept={accept === 'video' ? 'video/*' : accept === 'image' ? 'image/*' : 'image/*,video/*'}
                  className="hidden"
                  onChange={(e) => handleUploadFiles(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 size={28} className="animate-spin mb-2 text-[#D4191F]" />
                  <span className="text-xs">Loading assets...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ImageIcon size={36} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No media assets yet</p>
                  <p className="text-xs mt-1">Click Upload to add JPG, PNG, WebP (up to 5MB) or video (up to 500MB).</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((asset) => {
                    const isVideo = asset.mime_type.startsWith('video/');
                    const isSelected = activeAsset?.id === asset.id || selectedIds.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleSelect(asset)}
                        className={cn(
                          'group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-gray-50',
                          isSelected ? 'border-[#D4191F] ring-2 ring-[#D4191F]/20' : 'border-gray-200 hover:border-gray-400'
                        )}
                      >
                        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                          {isVideo ? (
                            <div className="flex flex-col items-center text-gray-500">
                              <Film size={24} />
                              <span className="text-[10px] mt-1 font-medium">Video</span>
                            </div>
                          ) : (
                            <img src={asset.public_url} alt={asset.alt_text || asset.file_name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-[11px] font-medium text-gray-800 truncate">{asset.file_name}</p>
                          <p className="text-[10px] text-gray-400">
                            {(asset.file_size / 1024).toFixed(0)} KB
                            {asset.width && asset.height ? ` · ${asset.width}x${asset.height}` : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#D4191F] text-white flex items-center justify-center shadow">
                            <Check size={13} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Metadata Inspector */}
          <div className="w-full lg:w-72 bg-gray-50 p-4 flex flex-col justify-between overflow-y-auto">
            {activeAsset ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Asset Details</h3>
                  <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white mb-2">
                    {activeAsset.mime_type.startsWith('video/') ? (
                      <video src={activeAsset.public_url} controls className="w-full h-full object-contain bg-black" />
                    ) : (
                      <img src={activeAsset.public_url} alt={activeAsset.alt_text || ''} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 break-all">{activeAsset.file_name}</p>
                  <p className="text-[11px] text-gray-500">
                    {activeAsset.mime_type} · {(activeAsset.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Alt Text (Accessibility & SEO)</label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe what appears in this image"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#D4191F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Photo caption shown beneath image"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#D4191F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Credit / Attribution</label>
                  <input
                    type="text"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    placeholder="e.g., Reuters / PostsApp Photo Desk"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#D4191F]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveMeta}
                    disabled={savingMeta}
                    className="flex-1 py-2 px-3 bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Save size={13} />
                    {savingMeta ? 'Saving...' : 'Save Info'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeAsset.public_url);
                      success('URL copied');
                    }}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100"
                    title="Copy Public URL"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(activeAsset)}
                    className="p-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete unused asset"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-10 text-center">
                Select an asset to inspect metadata, alt text, or choose it.
              </div>
            )}

            {(onSelect || onSelectMultiple) && (
              <div className="pt-4 border-t border-gray-200 mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!activeAsset && selectedIds.size === 0}
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-[#D4191F] disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                >
                  {multiple ? `Insert (${selectedIds.size || (activeAsset ? 1 : 0)})` : 'Use Asset'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
