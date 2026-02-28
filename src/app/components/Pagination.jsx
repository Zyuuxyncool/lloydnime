"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

/**
 * Modern pagination component with page numbers
 * @param {object} props
 * @param {number} props.currentPage - Current page number
 * @param {boolean} props.hasNextPage - Whether there's a next page
 * @param {boolean} props.hasPrevPage - Whether there's a previous page
 * @param {number} props.totalPages - Total number of pages (optional)
 * @param {string} props.baseUrl - Base URL for pagination links (optional, defaults to current path)
 */
const PaginationControls = ({ currentPage, hasNextPage, hasPrevPage = false, totalPages, baseUrl }) => {
  const pathname = usePathname();
  const linkBase = baseUrl || pathname;
  
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  // Generate page numbers to show
  const getPageNumbers = () => {
    if (!totalPages) return [];
    
    const pages = [];
    const showPages = 5; // Show 5 page numbers at a time
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-6 my-12">
      {/* Page Numbers (if totalPages is provided) */}
      {totalPages && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-neutral-400">
                  ...
                </span>
              );
            }
            
            const isActive = page === currentPage;
            
            return (
              <Link
                key={page}
                href={`${linkBase}?page=${page}`}
                className={`
                  min-w-[44px] h-[44px] flex items-center justify-center rounded-lg font-semibold
                  transition-all duration-200 transform hover:scale-105
                  ${isActive 
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/50' 
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }
                `}
              >
                {page}
              </Link>
            );
          })}
        </div>
      )}

      {/* Previous/Next Navigation */}
      <div className="flex items-center gap-4">
        {/* Previous Button */}
        <Link
          href={`${linkBase}?page=${prevPage}`}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold 
            transition-all duration-200 transform hover:scale-105
            ${!hasPrevPage || currentPage <= 1
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50' 
              : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg hover:shadow-pink-600/50'
            }
          `}
          aria-disabled={!hasPrevPage || currentPage <= 1}
          tabIndex={!hasPrevPage || currentPage <= 1 ? -1 : undefined}
          onClick={(e) => { if (!hasPrevPage || currentPage <= 1) e.preventDefault(); }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </Link>

        {/* Current Page Indicator (mobile-friendly) */}
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-lg">
          <span className="text-sm text-neutral-400">Page</span>
          <span className="font-bold text-lg text-pink-400">{currentPage}</span>
          {totalPages && (
            <>
              <span className="text-neutral-400">/</span>
              <span className="text-neutral-300">{totalPages}</span>
            </>
          )}
        </div>

        {/* Next Button */}
        <Link
          href={`${linkBase}?page=${nextPage}`}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            transition-all duration-200 transform hover:scale-105
            ${!hasNextPage 
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50' 
              : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg hover:shadow-pink-600/50'
            }
          `}
          aria-disabled={!hasNextPage}
          tabIndex={!hasNextPage ? -1 : undefined}
          onClick={(e) => { if (!hasNextPage) e.preventDefault(); }}
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default PaginationControls;