export const dynamic = 'force-dynamic';

import Navigation from '@/app/components/Navigation';
import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';
import Header from '@/app/components/Header';
import { getScheduleMap } from '@/app/libs/anime-db';
import ScheduleClient from './ScheduleClient';

export default async function SchedulePage() {
  const schedule = await getScheduleMap();
  const breadcrumbs = [{ title: 'Schedule', href: '/schedule' }];

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Navigation />
        <ResponsiveBreadcrumb crumbs={breadcrumbs} />
        <Header title="Jadwal Anime" />
        <ScheduleClient schedule={schedule} />
      </div>
    </div>
  );
}
