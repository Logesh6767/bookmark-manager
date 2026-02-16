'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import BookmarkCard from './BookmarkCard';

const BookmarkList = forwardRef(function BookmarkList(props, ref) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addBookmarkToUI: (bookmark) => {
      setBookmarks((prev) => [bookmark, ...prev]);
    },
  }));

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookmarks');
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }
      const data = await response.json();
      setBookmarks(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookmarkId) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    } catch (err) {
      alert('Error deleting bookmark: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading bookmarks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchBookmarks}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-500 text-lg">No bookmarks yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
});

export default BookmarkList;
