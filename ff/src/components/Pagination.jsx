import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  perPageOptions = [8, 16, 32, 64],
  showFirstLast = true,
  siblingCount = 1,
}) {
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with truncation
  const getPageNumbers = () => {
    const pages = [];
    const totalVisible = siblingCount * 2 + 3; // siblings + current + first + last

    if (totalPages <= totalVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      for (let i = 1; i <= 3 + siblingCount * 2; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (showLeftDots && !showRightDots) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - (3 + siblingCount * 2) + 1; i <= totalPages; i++) pages.push(i);
    } else if (showLeftDots && showRightDots) {
      pages.push(1);
      pages.push('...');
      for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const buttonBase = 'min-w-[36px] h-9 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center';
  const activeStyle = 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/20';
  const inactiveStyle = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const disabledStyle = 'opacity-40 cursor-not-allowed hover:bg-transparent';
  const navStyle = 'p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info & Per Page */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <p className="text-sm text-gray-500">
            Affichage de <span className="font-semibold text-gray-700">{startItem}</span> à <span className="font-semibold text-gray-700">{endItem}</span> sur <span className="font-semibold text-gray-700">{totalItems}</span>
          </p>
          {onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Par page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 cursor-pointer"
              >
                {perPageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Page Controls */}
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {/* First */}
          {showFirstLast && (
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={navStyle}
              aria-label="Première page"
            >
              <ChevronsLeft size={16} />
            </button>
          )}

          {/* Previous */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={navStyle}
            aria-label="Page précédente"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Page Numbers */}
          {pages.map((page, idx) => (
            page === '...' ? (
              <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm select-none">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`${buttonBase} ${currentPage === page ? activeStyle : inactiveStyle}`}
              >
                {page}
              </button>
            )
          ))}

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={navStyle}
            aria-label="Page suivante"
          >
            <ChevronRight size={18} />
          </button>

          {/* Last */}
          {showFirstLast && (
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={navStyle}
              aria-label="Dernière page"
            >
              <ChevronsRight size={16} />
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}