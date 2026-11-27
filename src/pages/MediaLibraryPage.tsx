import React, { useEffect, useState, useMemo } from 'react';
import {
  Upload,
  Search,
  Trash2,
  Image as ImageIcon,
  Film,
  Loader2,
  Copy,
  Save,
  FolderOpen,
} from 'lucide-react';
import { contentService, MediaAssetRecord } from '../services/contentService';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

export default function MediaLibraryPage() {
  const { success, error } = useToast();
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [activeAsset, setActiveAsset] = useState<MediaAssetRecord | null>(null);

  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [credit, setCredit] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const list = await contentService.getMediaAssets(kindFilter);
      setAssets(list);
      if (list.length > 0 && !activeAsset) {
        setActiveAsset(list[0]);
      }
    } catch (e: any) {
      error(e?.message || 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [kindFilter]);

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
      success(`Uploaded ${uploaded.length} asset${uploaded.length > 1 ? 's' : ''}.`);
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
      success('Metadata updated.');
    } catch (e: any) {
      error(e?.message || 'Failed to update metadata');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteAsset = async (asset: MediaAssetRecord) => {
    if (!window.confirm(`Delete "${asset.file_name}" permanently?`)) return;
    try {
      await contentService.deleteMediaAsset(asset);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (activeAsset?.id === asset.id) setActiveAsset(null);
      success('Asset deleted.');
    } catch (e: any) {
      error(e?.message || 'Cannot delete asset');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (!q) return true;
      return (
        a.file_name.toLowerCase().includes(q) ||
        (a.alt_text || '').toLowerCase().includes(q) ||
        (a.credit || '').toLowerCase().includes(q)
      );
    });
  }, [assets, search]);

  return (
    <div className="max-w-[1600px] mx-auto pb-10 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FolderOpen className="text-[#D4191F]" size={24} />
            Media Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload images &amp; videos with alt text, captions, and credit attribution. Unused assets can be safely deleted.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4191F] hover:bg-red-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search filenames, alt text, credits..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#D4191F]"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'article_image', label: 'Images' },
                { id: 'video', label: 'Videos' },
                { id: 'branding', label: 'Branding' },
                { id: 'story', label: 'Stories' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setKindFilter(t.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                    kindFilter === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={32} className="animate-spin text-[#D4191F] mb-3" />
                <span className="text-sm">Loading media library...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <ImageIcon size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-700">No media files found</p>
                <p className="text-xs mt-1">Upload an image or video to populate your asset library.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filtered.map((asset) => {
                  const isVideo = asset.mime_type.startsWith('video/');
                  const isSelected = activeAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setActiveAsset(asset)}
                      className={cn(
                        'rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-gray-50',
                        isSelected ? 'border-[#D4191F] ring-2 ring-[#D4191F]/20' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                        {isVideo ? (
                          <Film size={28} className="text-gray-400" />
                        ) : (
                          <img src={asset.public_url} alt={asset.alt_text || asset.file_name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-2.5 bg-white">
                        <p className="text-xs font-semibold text-gray-900 truncate">{asset.file_name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {(asset.file_size / 1024).toFixed(0)} KB
                          {asset.width && asset.height ? ` · ${asset.width}x${asset.height}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 bg-gray-50 p-5 flex flex-col gap-4">
          {activeAsset ? (
            <>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Asset Inspector</h3>
              <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white">
                {activeAsset.mime_type.startsWith('video/') ? (
                  <video src={activeAsset.public_url} controls className="w-full h-full object-contain bg-black" />
                ) : (
                  <img src={activeAsset.public_url} alt={activeAsset.alt_text || ''} className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 break-all">{activeAsset.file_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeAsset.mime_type} · {(activeAsset.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#D4191F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#D4191F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Credit</label>
                <input
                  type="text"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#D4191F]"
                />
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                <button
                  onClick={handleSaveMeta}
                  disabled={savingMeta}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {savingMeta ? 'Saving...' : 'Save Info'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeAsset.public_url);
                    success('Public URL copied');
                  }}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100"
                  title="Copy URL"
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={() => handleDeleteAsset(activeAsset)}
                  className="p-2.5 bg-white border border-red-200 rounded-xl text-red-600 hover:bg-red-50"
                  title="Delete unused asset"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400 text-center py-16">
              Select a media item to edit metadata or copy its URL.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
