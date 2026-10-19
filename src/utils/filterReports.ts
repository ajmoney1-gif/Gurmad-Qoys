import { PersonReport } from '../types/index.ts';

export function filterReports(
  reports: PersonReport[],
  options: {
    query?: string;
    category?: string;
    status?: string;
  }
): PersonReport[] {
  const { query, category, status } = options;
  const q = (query || '').toLowerCase().trim();

  return reports.filter((report) => {
    // Filter by category
    if (category && category !== 'Dhammaan' && category !== 'all') {
      if (report.category !== category) return false;
    }

    // Filter by status
    if (status && status !== 'Dhammaan' && status !== 'all') {
      if (report.status !== status) return false;
    }

    // Search query
    if (q) {
      const matchName = report.name.toLowerCase().includes(q);
      const matchLocation = report.location.toLowerCase().includes(q);
      const matchDesc = report.description?.toLowerCase().includes(q);
      const matchAge = String(report.age).includes(q);
      const matchPhone = report.phone?.includes(q);

      if (!matchName && !matchLocation && !matchDesc && !matchAge && !matchPhone) {
        return false;
      }
    }

    return true;
  });
}
