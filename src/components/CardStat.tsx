interface CardStatProps {
  title: string;
  value: string;
}

export default function CardStat({ title, value }: CardStatProps) {
  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded shadow">
      <p className="text-gray-500 dark:text-gray-300">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}