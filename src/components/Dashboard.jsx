'use client';

import { useRef } from 'react';
import AddBookmark from './AddBookmark';
import BookmarkList from './BookmarkList';

export default function Dashboard() {
  const bookmarkListRef = useRef(null);

  const handleBookmarkAdded = (bookmark) => {
    // Trigger a refresh in BookmarkList
    if (bookmarkListRef.current) {
      bookmarkListRef.current.addBookmarkToUI(bookmark);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Bookmark Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AddBookmark onBookmarkAdded={handleBookmarkAdded} />
            </div>
          </div>

          {/* Right Column - Bookmark List */}
          <div className="lg:col-span-2">
            <BookmarkList ref={bookmarkListRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
