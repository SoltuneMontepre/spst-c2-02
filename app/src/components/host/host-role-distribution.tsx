"use client";

import { Card } from "@/components/ui/card";
import type { RoleDistribution } from "@/lib/lobby-readiness";
import { RoleDistributionDots } from "@/components/lobby/role-distribution-dots";

export function HostRoleDistribution({ roles }: { roles: RoleDistribution[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Phân bổ vai trò</h3>
      <div className="mt-4">
        <RoleDistributionDots roles={roles} />
      </div>
    </Card>
  );
}
