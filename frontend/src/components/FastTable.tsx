import React, { memo } from 'react';

interface FastTableProps {
  data: any[];
  columns: { key: string; label: string }[];
  loading?: boolean;
}

const FastTable = memo<FastTableProps>(({ data, columns, loading }) => {
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!data?.length) {
    return <div className="p-4">No data</div>;
  }

  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="p-2 text-left border">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="p-2 border">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

FastTable.displayName = 'FastTable';
export default FastTable;
