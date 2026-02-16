'use client';

import { useState } from 'react';
import { isValidUrl, isValidTitle } from '@/lib/validators';

export default function AddBookmark({ onBookmarkAdded }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (with http:// or https://)');
      return;
    }

    if (!isValidTitle(title)) {
      setError('Please enter a title (1-255 characters)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add bookmark');
      }

      const data = await response.json();
      setSuccess('Bookmark added successfully!');
      setUrl('');
      setTitle('');

      // Notify parent component
      if (onBookmarkAdded) {
        onBookmarkAdded(data.data);
      }

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message || 'Error adding bookmark');
      console.error('Add bookmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Add New Bookmark</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="bookmark-url"
            className="block text-sm font-medium text-gray-700"
          >
            URL
          </label>
          <input
            id="bookmark-url"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="bookmark-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="bookmark-title"
            type="text"
            placeholder="Enter bookmark title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Bookmark'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
