'use client';

export default function BookmarkCard({ bookmark, onDelete }) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      onDelete(bookmark.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold mb-2 truncate">{bookmark.title}</h3>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 text-sm truncate block mb-3"
      >
        {bookmark.url}
      </a>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {new Date(bookmark.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={handleDelete}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
