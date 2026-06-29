import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Search records...',
  onSearch,
  pagination = false,
  pageSize = 10,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
    if (onSearch) onSearch(value);
  };

  const filteredData = onSearch
    ? data
    : data.filter((row) =>
        columns.some((col) => {
          const val = col.accessor ? row[col.accessor] : '';
          return String(val).toLowerCase().includes(search.toLowerCase());
        })
      );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
              {columns.map((col) => (
                <th key={col.accessor || col.header} className="py-3.5 px-4 font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 opacity-40" />
                    <span className="font-semibold text-xs">No records matching query</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.accessor || col.header} className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="font-bold">{filteredData.length}</span> entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
