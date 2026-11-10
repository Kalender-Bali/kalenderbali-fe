import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  HeartHandshake,
  HelpCircle,
  Hourglass,
  Flame,
  Dumbbell,
  Brain,
  Shield,
  Heart,
  Zap,
  Sun,
  HandHeart,
  EyeOff,
  Hand,
  Smile,
  Scale,
  Award,
  Droplet,
  Users,
  Lightbulb,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import type { Topic } from '../types/bhagawadGita.types';

/**
 * ==============================================================================
 * KOMPONEN: TopicChipCard (Kartu Topik Refleksi Emosi & Spiritual)
 * ==============================================================================
 * Menampilkan kartu kurasi topik refleksi hidup (sesuai Gambar 1 Android):
 * 1. Kotak ikon tematik berlatar Mint Teal (#e6f7f5, #ccf0ea)
 * 2. Judul tema emosional/spiritual (cth: "Mencari Kedamaian", "Mengatasi Depresi")
 * 3. Deskripsi ringkas 1 baris
 * 4. Badge jumlah sloka terpilih dengan angka tabular-nums
 * 5. Ikon panah navigasi ChevronRight
 * ==============================================================================
 */

interface TopicChipCardProps {
  topic: Topic;
}

/** Pemetaan ikon material backend ke ikon Lucide */
function getTopicIcon(iconName: string) {
  const iconProps = { className: 'w-5 h-5 text-[#0d9488]' };

  switch (iconName) {
    case 'spa_rounded':
      return <Sparkles {...iconProps} />;
    case 'healing_rounded':
      return <HeartHandshake {...iconProps} />;
    case 'help_outline_rounded':
      return <HelpCircle {...iconProps} />;
    case 'hourglass_empty_rounded':
      return <Hourglass {...iconProps} />;
    case 'local_fire_department_rounded':
      return <Flame {...iconProps} />;
    case 'fitness_center_rounded':
      return <Dumbbell {...iconProps} />;
    case 'psychology_rounded':
      return <Brain {...iconProps} />;
    case 'shield_outlined':
      return <Shield {...iconProps} />;
    case 'favorite_border_rounded':
      return <Heart {...iconProps} />;
    case 'bolt_rounded':
      return <Zap {...iconProps} />;
    case 'wb_sunny_rounded':
      return <Sun {...iconProps} />;
    case 'volunteer_activism_rounded':
      return <HandHeart {...iconProps} />;
    case 'visibility_off_outlined':
      return <EyeOff {...iconProps} />;
    case 'pan_tool_outlined':
      return <Hand {...iconProps} />;
    case 'sentiment_satisfied_alt_rounded':
      return <Smile {...iconProps} />;
    case 'balance_rounded':
      return <Scale {...iconProps} />;
    case 'self_improvement_rounded':
      return <Award {...iconProps} />;
    case 'water_drop_outlined':
      return <Droplet {...iconProps} />;
    case 'groups_rounded':
      return <Users {...iconProps} />;
    case 'lightbulb_outline_rounded':
      return <Lightbulb {...iconProps} />;
    default:
      return <BookOpen {...iconProps} />;
  }
}

export const TopicChipCard: FC<TopicChipCardProps> = ({ topic }) => {
  return (
    <Link
      to={`/bhagawadgita/topik/${topic.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-sm p-4 sm:p-5 transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer [touch-action:manipulation]"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Kotak Ikon Tematik Mint */}
        <div className="w-12 h-12 rounded-xl bg-[#e6f7f5] dark:bg-teal-950/60 border border-[#ccf0ea] dark:border-teal-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform select-none">
          {getTopicIcon(topic.icon_name)}
        </div>

        {/* Informasi Nama & Deskripsi Topik */}
        <div className="min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white group-hover:text-[#0d9488] dark:group-hover:text-teal-300 transition-colors truncate">
            {topic.name}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {topic.description}
          </p>
        </div>
      </div>

      {/* Bagian Kanan: Badge Jumlah Sloka & Panah Navigasi */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 tabular-nums">
          {topic.verse_count} Sloka
        </span>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0d9488] dark:group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
};
