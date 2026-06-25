"use client";

import { useEffect, useRef } from "react";
import type { Role } from "@/generated/prisma/enums";

export interface RoleChangeNotice {
  previousRole: Role | null;
  newRole: Role | null;
}

/** Detects when the current player's role changes after initial snapshot load. */
export function useSelfRoleChange(
  selfRole: Role | null | undefined,
  onChange: (notice: RoleChangeNotice) => void,
): void {
  const prevRef = useRef<Role | null | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (selfRole === undefined) return;
    if (prevRef.current === undefined) {
      prevRef.current = selfRole;
      return;
    }
    if (prevRef.current !== selfRole) {
      onChangeRef.current({ previousRole: prevRef.current, newRole: selfRole });
      prevRef.current = selfRole;
    }
  }, [selfRole]);
}
