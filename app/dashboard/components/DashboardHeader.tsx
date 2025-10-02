import StatsCards from "./StatsCards";

interface DashboardHeaderProps {
  shopId: string;
  borderColor?: string;
}

export default function DashboardHeader({
  shopId,
  borderColor,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <StatsCards shopId={shopId} borderColor={borderColor} />
    </div>
  );
}
