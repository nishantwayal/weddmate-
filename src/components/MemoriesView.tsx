import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Camera,
  Film,
  Heart,
  MessageSquare,
  Download,
  MonitorPlay,
  Search,
  Upload,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  MemoryComment,
  WeddingAlbum,
  WeddingEvent,
  WeddingMemory,
} from '../types';
import { compressImageToDataUrl, readVideoAsBoundedDataUrl } from '../utils/matching';

interface MemoriesViewProps {
  myUid: string;
  myName: string;
  activeWedding: WeddingEvent | null;
}

const ALBUMS: ('All' | WeddingAlbum)[] = ['All', 'Haldi', 'Mehendi', 'Sangeet', 'Reception'];

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  myUid,
  myName,
  activeWedding,
}) => {
  const [memories, setMemories] = useState<WeddingMemory[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<'All' | WeddingAlbum>('All');
  const [viewMode, setViewMode] = useState<'gallery' | 'reels' | 'live_wall'>('gallery');
  const [findQuery, setFindQuery] = useState('');
  const [activeStory, setActiveStory] = useState<WeddingMemory | null>(null);
  const [activeCommentsMemory, setActiveCommentsMemory] = useState<WeddingMemory | null>(null);
  const [comments, setComments] = useState<MemoryComment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Upload drawer state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMediaType, setUploadMediaType] = useState<'photo' | 'reel' | 'story'>('photo');
  const [uploadAlbum, setUploadAlbum] = useState<WeddingAlbum>('Sangeet');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAllowDownload, setUploadAllowDownload] = useState(true);
  const [uploadDataUrl, setUploadDataUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [liveWallIndex, setLiveWallIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const weddingId = activeWedding?.id || 'demo_royal_udaipur';

  useEffect(() => {
    const path = `weddings/${weddingId}/memories`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as WeddingMemory);
        setMemories(docs);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );
    return () => unsub();
  }, [weddingId]);

  useEffect(() => {
    if (!activeCommentsMemory) {
      setComments([]);
      return;
    }
    const path = `weddings/${weddingId}/memories/${activeCommentsMemory.id}/comments`;
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => setComments(snap.docs.map((d) => d.data() as MemoryComment)),
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );
    return () => unsub();
  }, [weddingId, activeCommentsMemory?.id]);

  // Built-in showcase memory when wedding has 0 uploads yet so Memories never looks empty
  const displayMemories: WeddingMemory[] = useMemo(() => {
    if (memories.length > 0) return memories;
    return [
      {
        id: 'showcase_sangeet_1',
        weddingId,
        authorUid: 'planner',
        authorName: 'Royal Udaipur Host',
        mediaType: 'photo',
        album: 'Sangeet',
        mediaUrl: '/src/assets/images/memory_sangeet_dance.jpg',
        caption: 'Sangeet night under crystal chandeliers & marigolds',
        allowDownload: true,
        featuredOnLiveWall: true,
        likesCount: 24,
        likedBy: [],
        commentsCount: 2,
      },
      {
        id: 'showcase_mehendi_2',
        weddingId,
        authorUid: 'planner',
        authorName: 'Mehendi Courtyard',
        mediaType: 'story',
        album: 'Mehendi',
        mediaUrl: '/src/assets/images/profile_meera_kapoor.jpg',
        caption: 'Sunlit Mehendi afternoon portraits',
        allowDownload: true,
        featuredOnLiveWall: true,
        likesCount: 18,
        likedBy: [],
        commentsCount: 0,
      },
      {
        id: 'showcase_reception_3',
        weddingId,
        authorUid: 'planner',
        authorName: 'Palace Courtyard',
        mediaType: 'reel',
        album: 'Reception',
        mediaUrl: '/src/assets/images/hero_royal_wedding.jpg',
        caption: 'Evening pheras & candlelit courtyard reel',
        allowDownload: true,
        featuredOnLiveWall: true,
        likesCount: 31,
        likedBy: [],
        commentsCount: 1,
      },
    ];
  }, [memories, weddingId]);

  const filtered = useMemo(() => {
    return displayMemories
      .filter((m) => (selectedAlbum === 'All' ? true : m.album === selectedAlbum))
      .filter((m) =>
        findQuery.trim()
          ? m.caption.toLowerCase().includes(findQuery.toLowerCase()) ||
            m.authorName.toLowerCase().includes(findQuery.toLowerCase()) ||
            m.album.toLowerCase().includes(findQuery.toLowerCase())
          : true
      );
  }, [displayMemories, selectedAlbum, findQuery]);

  const stories = displayMemories.filter((m) => m.mediaType === 'story' || m.mediaType === 'photo');
  const reels = filtered.filter((m) => m.mediaType === 'reel' || m.mediaType === 'story');
  const liveWallItems = displayMemories.filter((m) => m.featuredOnLiveWall || m.likesCount >= 0);

  useEffect(() => {
    if (viewMode !== 'live_wall' || liveWallItems.length === 0) return;
    const id = setInterval(() => {
      setLiveWallIndex((prev) => (prev + 1) % liveWallItems.length);
    }, 4500);
    return () => clearInterval(id);
  }, [viewMode, liveWallItems.length]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      if (file.type.startsWith('video/')) {
        const url = await readVideoAsBoundedDataUrl(file);
        setUploadDataUrl(url);
        setUploadMediaType('reel');
      } else {
        const url = await compressImageToDataUrl(file, 960, 0.78);
        setUploadDataUrl(url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to process file.');
    }
  };

  const handlePublishMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDataUrl) {
      setUploadError('Select a photo or short reel video clip first.');
      return;
    }
    setUploading(true);
    setUploadError('');
    const memId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const path = `weddings/${weddingId}/memories/${memId}`;
    try {
      await setDoc(doc(db, 'weddings', weddingId, 'memories', memId), {
        id: memId,
        weddingId,
        authorUid: myUid,
        authorName: myName || 'Wedding Guest',
        mediaType: uploadMediaType,
        album: uploadAlbum,
        mediaUrl: uploadDataUrl,
        caption: uploadCaption.trim() || `${uploadAlbum} celebration moment`,
        allowDownload: uploadAllowDownload,
        featuredOnLiveWall: true,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });
      setShowUpload(false);
      setUploadDataUrl('');
      setUploadCaption('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setUploading(false);
    }
  };

  const handleLikeMemory = async (m: WeddingMemory) => {
    if (m.id.startsWith('showcase_')) return;
    const alreadyLiked = m.likedBy?.includes(myUid);
    const nextLikedBy = alreadyLiked
      ? m.likedBy.filter((u) => u !== myUid)
      : [...(m.likedBy || []), myUid];
    const nextCount = Math.max(0, alreadyLiked ? m.likesCount - 1 : m.likesCount + 1);
    const path = `weddings/${weddingId}/memories/${m.id}`;
    try {
      await updateDoc(doc(db, 'weddings', weddingId, 'memories', m.id), {
        likedBy: nextLikedBy,
        likesCount: nextCount,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentsMemory || !newComment.trim() || activeCommentsMemory.id.startsWith('showcase_')) {
      return;
    }
    const cId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const path = `weddings/${weddingId}/memories/${activeCommentsMemory.id}/comments/${cId}`;
    try {
      await setDoc(
        doc(db, 'weddings', weddingId, 'memories', activeCommentsMemory.id, 'comments', cId),
        {
          id: cId,
          memoryId: activeCommentsMemory.id,
          authorUid: myUid,
          authorName: myName || 'Wedding Guest',
          text: newComment.trim(),
          createdAt: serverTimestamp(),
        }
      );
      await updateDoc(doc(db, 'weddings', weddingId, 'memories', activeCommentsMemory.id), {
        commentsCount: activeCommentsMemory.commentsCount + 1,
      });
      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const canUpload =
    !activeWedding ||
    (activeWedding.memoriesEnabled &&
      (activeWedding.memoriesUploadPermission === 'all_guests' ||
        activeWedding.plannerUid === myUid));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
            Separate from Matchmaking · {activeWedding?.weddingName || 'Wedding Digital Album'}
          </div>
          <h2 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
            Weddmate Memories &amp; Reels
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE5D8] dark:bg-[#2A151C]">
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                  : 'text-[#5A3F47] dark:text-[#C7B3B8]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Gallery
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'reels'
                  ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                  : 'text-[#5A3F47] dark:text-[#C7B3B8]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Reels
            </button>
            <button
              type="button"
              onClick={() => setViewMode('live_wall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'live_wall'
                  ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                  : 'text-[#5A3F47] dark:text-[#C7B3B8]'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              Live Wall
            </button>
          </div>

          {canUpload && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#541524] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Memory / Reel
            </button>
          )}
        </div>
      </div>

      {/* Wedding Stories Bar */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {stories.slice(0, 10).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveStory(s)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full p-0.5 border-2 border-[#C9A048] group-hover:scale-105 transition-transform">
              {s.mediaUrl.startsWith('data:video') ? (
                <div className="w-full h-full rounded-full bg-[#6B1D2F] text-[#FAF6F0] flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
              ) : (
                <img
                  src={s.mediaUrl}
                  alt={s.authorName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>
            <span className="text-[11px] text-[#5A3F47] dark:text-[#C7B3B8] max-w-[72px] truncate">
              {s.album}
            </span>
          </button>
        ))}
      </div>

      {/* Album Filter + Find My Photos Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {ALBUMS.map((alb) => (
            <button
              key={alb}
              type="button"
              onClick={() => setSelectedAlbum(alb)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                  : 'bg-white dark:bg-[#1E0F14] border-[#DFCBB2] dark:border-[#4A2833]'
              }`}
            >
              {alb}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E535B]" />
          <input
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find My Photos (guest, caption)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
          />
        </div>
      </div>

      {/* Live Wall Venue Screen Mode */}
      {viewMode === 'live_wall' && liveWallItems.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden bg-[#140A0D] border-2 border-[#C9A048] h-[480px]">
          {liveWallItems[liveWallIndex].mediaUrl.startsWith('data:video') ? (
            <video
              src={liveWallItems[liveWallIndex].mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={liveWallItems[liveWallIndex].mediaUrl}
              alt={liveWallItems[liveWallIndex].caption}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          <div className="absolute top-5 left-6 right-6 flex items-center justify-between text-[#FAF6F0]">
            <div className="font-display text-2xl font-semibold">
              {activeWedding?.weddingName || 'Wedding Live Wall'}
            </div>
            <div className="text-xs font-mono-tabular text-[#E8C97A]">
              LIVE WALL · {liveWallIndex + 1}/{liveWallItems.length}
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 text-[#FAF6F0]">
            <div className="text-xs text-[#E8C97A] mb-1">
              {liveWallItems[liveWallIndex].album} · Shared by{' '}
              {liveWallItems[liveWallIndex].authorName}
            </div>
            <div className="font-display text-3xl font-semibold">
              {liveWallItems[liveWallIndex].caption}
            </div>
          </div>
        </div>
      )}

      {/* Vertical Reels Mode */}
      {viewMode === 'reels' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reels.map((r) => (
            <div
              key={r.id}
              className="relative rounded-3xl overflow-hidden bg-[#140A0D] border border-[#E5D9C8] dark:border-[#3D222B] aspect-[9/16] max-h-[520px] w-full"
            >
              {r.mediaUrl.startsWith('data:video') ? (
                <video
                  src={r.mediaUrl}
                  controls
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={r.mediaUrl}
                  alt={r.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-[#FAF6F0]">
                <div className="text-[11px] text-[#E8C97A] mb-0.5">
                  {r.album} Reel · {r.authorName}
                </div>
                <p className="text-xs mb-3">{r.caption}</p>
                <div className="flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => void handleLikeMemory(r)}
                    className="inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        r.likedBy?.includes(myUid) ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    <span className="font-mono-tabular">{r.likesCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCommentsMemory(r)}
                    className="inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-mono-tabular">{r.commentsCount}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Gallery Mode */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl overflow-hidden bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] flex flex-col"
            >
              <div className="h-64 bg-[#241117] relative">
                {m.mediaUrl.startsWith('data:video') ? (
                  <video
                    src={m.mediaUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={m.mediaUrl}
                    alt={m.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] text-[#8F6A20] dark:text-[#D4AF5A] font-medium">
                    {m.album} · {m.authorName}
                  </div>
                  <p className="text-sm text-[#2A151B] dark:text-[#F5EDE2] mt-1">
                    {m.caption}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EDE2D4] dark:border-[#361C25] text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => void handleLikeMemory(m)}
                      className="inline-flex items-center gap-1 text-[#5A3F47] dark:text-[#C7B3B8] hover:text-[#6B1D2F] cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          m.likedBy?.includes(myUid) ? 'fill-[#6B1D2F] text-[#6B1D2F]' : ''
                        }`}
                      />
                      <span className="font-mono-tabular">{m.likesCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentsMemory(m)}
                      className="inline-flex items-center gap-1 text-[#5A3F47] dark:text-[#C7B3B8] hover:text-[#6B1D2F] cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-mono-tabular">{m.commentsCount}</span>
                    </button>
                  </div>

                  {m.allowDownload && (
                    <a
                      href={m.mediaUrl}
                      download={`weddmate-${m.album.toLowerCase()}-${m.id}.jpg`}
                      className="inline-flex items-center gap-1 text-[#6B1D2F] dark:text-[#D4AF5A] hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Memory / Reel Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#FAF6F0] dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] rounded-3xl p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#EFE5D8] dark:hover:bg-[#2A151C] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-2xl font-semibold mb-4">
              Share Wedding Memory or Reel
            </h3>
            <form onSubmit={handlePublishMemory} className="space-y-4">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE5D8] dark:bg-[#2A151C]">
                {(['photo', 'reel', 'story'] as const).map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setUploadMediaType(mt)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize cursor-pointer ${
                      uploadMediaType === mt
                        ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                        : 'text-[#5A3F47] dark:text-[#C7B3B8]'
                    }`}
                  >
                    {mt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Wedding Album</label>
                <select
                  value={uploadAlbum}
                  onChange={(e) => setUploadAlbum(e.target.value as WeddingAlbum)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
                >
                  <option value="Haldi">Haldi</option>
                  <option value="Mehendi">Mehendi</option>
                  <option value="Sangeet">Sangeet</option>
                  <option value="Reception">Reception</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-[#C9A048] flex flex-col items-center justify-center gap-2 text-xs text-[#5A3F47] dark:text-[#C7B3B8] hover:bg-[#F3ECE2] dark:hover:bg-[#2A151C] cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                  <span>
                    {uploadDataUrl
                      ? 'Media ready! Click to replace'
                      : 'Select Photo or Short Video Reel'}
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <input
                type="text"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Write a caption for the couple & guests..."
                maxLength={280}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
              />

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadAllowDownload}
                  onChange={(e) => setUploadAllowDownload(e.target.checked)}
                  className="accent-[#6B1D2F]"
                />
                <span>Allow wedding guests to download this memory</span>
              </label>

              {uploadError && (
                <div className="text-xs text-red-700 dark:text-red-300">{uploadError}</div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] disabled:opacity-50 cursor-pointer"
              >
                {uploading ? 'Publishing...' : 'Publish to Digital Album'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-[#140A0D] border border-[#C9A048]">
            <button
              type="button"
              onClick={() => setActiveStory(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeStory.mediaUrl}
              alt={activeStory.caption}
              referrerPolicy="no-referrer"
              className="w-full h-[540px] object-cover"
            />
            <div className="p-4 text-[#FAF6F0]">
              <div className="text-xs text-[#E8C97A]">
                {activeStory.album} Story · {activeStory.authorName}
              </div>
              <div className="text-sm mt-1">{activeStory.caption}</div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Drawer Modal */}
      {activeCommentsMemory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF6F0] dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C9A048]" />
                Memory Comments
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentsMemory(null)}
                className="p-1.5 rounded-full hover:bg-[#EFE5D8] dark:hover:bg-[#2A151C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2.5">
              {comments.length === 0 ? (
                <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] py-4 text-center">
                  No comments yet. Leave a warm note!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#2A151C] text-xs"
                  >
                    <span className="font-semibold mr-1.5">{c.authorName}:</span>
                    <span>{c.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                maxLength={350}
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
