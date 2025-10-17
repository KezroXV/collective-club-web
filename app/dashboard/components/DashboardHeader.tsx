import StatsCards from "./StatsCards";

interface DashboardHeaderProps {
  shopId: string;
}

export default function DashboardHeader({
  shopId,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <StatsCards shopId={shopId} />
    </div>
  );
}
