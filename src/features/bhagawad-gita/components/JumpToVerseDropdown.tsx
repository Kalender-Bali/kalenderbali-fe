import type { FC, ChangeEvent } from 'react';
import { Compass, ChevronDown } from 'lucide-react';

/**
 * ==============================================================================
 * KOMPONEN: JumpToVerseDropdown (Navigasi Cepat Nomor Sloka)
 * ==============================================================================
 * Memfasilitasi pengguna untuk melompat langsung ke bait sloka tertentu
 * (khusus bab panjang seperti Bab 2 dengan 72 sloka dan Bab 18 dengan 78 sloka).
 * Menerapkan efek visual ring highlight teal sesaat saat elemen tercapai.
 * ==============================================================================
 */

interface JumpToVerseDropdownProps {
  totalVerses: number;
}

export const JumpToVerseDropdown: FC<JumpToVerseDropdownProps> = ({ totalVerses }) => {
  const handleSelectVerse = (e: ChangeEvent<HTMLSelectElement>) => {
    const verseNum = e.target.value;
    if (!verseNum) return;

    const el = document.getElementById(`sloka-${verseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#0d9488]', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#0d9488]', 'ring-offset-2');
      }, 2000);
    }
  };

  const verseNumbers = Array.from({ length: totalVerses }, (_, i) => i + 1);

  return (
    <div className="relative inline-flex items-center">
      {/* Ikon Kompas Kiri */}
      <Compass className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />

      {/* Dropdown Select Standard Wargabali */}
      <select
        onChange={handleSelectVerse}
        defaultValue=""
        aria-label="Lompat ke nomor sloka"
        className="h-10 sm:h-11 pl-9 pr-9 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer appearance-none shadow-2xs [touch-action:manipulation]"
      >
        <option value="" disabled>
          Lompat ke Sloka...
        </option>
        {verseNumbers.map((num) => (
          <option key={num} value={num}>
            Sloka {num}
          </option>
        ))}
      </select>

      {/* Ikon Panah Dropdown Kanan */}
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
    </div>
  );
};
