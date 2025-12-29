import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getMyNotifications, markNotificationRead } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const userId = localStorage.getItem('userId');
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (userId) {
      setNotifications([]); // Clear on filter change
      setPage(0);
      setHasMore(true);
      loadNotifications(0, priorityFilter, true);
    }
  }, [userId, priorityFilter]);

  const loadNotifications = async (pageNum, priority, isReset = false) => {
    setLoading(true);
    try {
      const data = await getMyNotifications(userId, pageNum, PAGE_SIZE, priority);
      if (data.length < PAGE_SIZE) setHasMore(false);

      setNotifications(prev => isReset ? data : [...prev, ...data]);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, priorityFilter);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id, userId);
      setNotifications(notifications.map(n =>
        n.notificationId === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  if (!userId) return <div className="p-6 text-white">Please log in to view notifications.</div>;

  const Card = ({ note }) => {
    return (
      <div className={`card-vibrant mb-4 border-l-4 ${note.read ? 'opacity-60 border-l-gray-500' : 'border-l-lime-500'}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-lime-500/20 rounded-full text-lime-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${note.priority === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                    note.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                  }`}>
                  {note.priority}
                </span>
                {note.isPinned && <span className="bg-lime-500/20 text-lime-300 text-xs px-2 py-0.5 rounded">PINNED</span>}
                <span className="text-xs text-white/50">{new Date(note.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <h4 className="font-bold text-lg text-white mb-1">{note.title}</h4>
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              {note.body}
            </p>

            {note.createdBy && (
              <p className="text-xs text-white/40 italic">Posted by: {note.createdBy.username || 'Admin'}</p>
            )}

            <div className="mt-4 flex justify-end">
              {!note.read ? (
                <button
                  className="px-4 py-2 text-sm bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-lime-900/20"
                  onClick={() => handleMarkRead(note.notificationId)}
                >
                  Mark as Read
                </button>
              ) : (
                <span className="text-xs text-lime-500/50 font-medium px-3 py-1 border border-lime-500/20 rounded-full">
                  Read
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold gradient-text">Notifications</h2>
          <p className="text-white/60 text-sm mt-1">Stay updated with latest announcements</p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
          <span className="text-sm text-lime-200/70 pl-2">Filter:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent text-sm text-white border-none outline-none focus:ring-0 cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All</option>
            <option value="HIGH" className="bg-slate-900">High Priority</option>
            <option value="MEDIUM" className="bg-slate-900">Medium Priority</option>
            <option value="LOW" className="bg-slate-900">Low Priority</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map(n => <Card key={n.notificationId} note={n} />)
        ) : (
          !loading && (
            <div className="text-center py-12 card-vibrant border-dashed">
              <p className="text-white/50 text-lg">No notifications found.</p>
            </div>
          )
        )}
      </div>

      {loading && <div className="text-center py-8 text-lime-300 animate-pulse">Loading notifications...</div>}

      {!loading && hasMore && notifications.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="btn-vibrant-outline px-6 py-2 rounded-full text-sm"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
