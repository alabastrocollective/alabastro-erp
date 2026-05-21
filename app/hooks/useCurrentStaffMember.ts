"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "~/store/authStore";
import {
  findStaffMemberByEmail,
  getStaffMemberByAuthUserId,
} from "~/services/staffAuthLinkService";
import type { StaffMemberRow } from "~/types/alabastro";

export function useCurrentStaffMember() {
  const user = useAuthStore((s) => s.user);
  const [staffMember, setStaffMember] = useState<StaffMemberRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestedByEmail, setSuggestedByEmail] = useState<StaffMemberRow | null>(null);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setStaffMember(null);
      setSuggestedByEmail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [linked, suggestion] = await Promise.all([
      getStaffMemberByAuthUserId(user.id),
      user.email ? findStaffMemberByEmail(user.email) : Promise.resolve({ data: null, error: null }),
    ]);
    setStaffMember(linked.data);
    setSuggestedByEmail(suggestion.data);
    setLoading(false);
  }, [user?.id, user?.email]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    staffMember,
    suggestedByEmail,
    loading,
    reload,
    isLinked: !!staffMember,
  };
}
