export default function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-5 py-3">
                  <div className="skeleton h-4 w-20 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row}>
                {Array.from({ length: cols }).map((_, col) => (
                  <td key={col} className="px-5 py-3">
                    <div className={`skeleton h-4 rounded ${col === 0 ? 'w-32' : 'w-20'}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
