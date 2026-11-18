import { fetchPuraDetail, searchPiodalan } from '@/features/piodalan/api/piodalanApi';
import type { PiodalanDayGroup } from '@/features/piodalan/types/piodalan.types';
import { piodalanCandidates } from '../utils/pengingatSources';

/** Check the selected temple's current schedule; never substitute a different date or temple. */
export async function fetchPiodalanResultCandidate(group: PiodalanDayGroup, puraId: string, today: string) {
  if (!puraId || group.dateStr < today || !group.puras.some(pura => String(pura.id) === puraId)) return null;
  const request = { mode: 'pura' as const, pura_id: puraId, tahun: Number(group.dateStr.slice(0, 4)) };
  const [profile, result] = await Promise.all([fetchPuraDetail(puraId), searchPiodalan(request)]);
  if (!profile || String(profile.id) !== puraId || !result) return null;
  return piodalanCandidates(request, result, profile, today).find(item => item.nextDate === group.dateStr) ?? null;
}
