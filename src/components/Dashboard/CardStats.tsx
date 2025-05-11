import React from 'react';
import CardStat from '../Common/CardStat';

interface CardStatsProps {
  totalReports: number;
  todayReports: number;
  uniqueTypes: number;
}

const CardStats: React.FC<CardStatsProps> = ({ totalReports, todayReports, uniqueTypes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <CardStat title="Total Signalements" value={totalReports.toString()} />
      <CardStat title="Aujourd'hui" value={todayReports.toString()} />
      <CardStat title="Types Uniques" value={uniqueTypes.toString()} />
    </div>
  );
};

export default CardStats;