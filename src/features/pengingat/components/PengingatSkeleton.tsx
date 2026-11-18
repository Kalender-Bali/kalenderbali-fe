import { DataSkeleton } from '@/components/ui/DataSkeleton';

export function PengingatSkeleton() {
  return <div className="space-y-6"><DataSkeleton label="Memuat halaman pengingat" className="h-48" /><div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{[0, 1, 2, 3].map(item => <DataSkeleton key={item} label="Memuat kartu pengingat" className="h-96" />)}</div></div>;
}
