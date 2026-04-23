import { motion } from 'framer-motion';

export default function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            {headers.map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-[12px] font-medium text-[#64748B] tracking-wider uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]"
            >
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-3 text-[#94A3B8]">{cell}</td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
