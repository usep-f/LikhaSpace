import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-4 mt-8 pt-6 border-t border-white/5">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-heading text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Previous
      </button>

      <div className="text-xs text-gray-400 font-bold">
        Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-heading text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Next
      </button>
    </div>
  );
};
