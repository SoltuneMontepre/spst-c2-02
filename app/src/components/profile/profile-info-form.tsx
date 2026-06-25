"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { apiFetch } from "@/hooks/use-api";

interface ProfileInfoFormProps {
  profile: {
    displayName: string;
    email: string;
    school: string | null;
    gradeClass: string | null;
  };
}

export function ProfileInfoForm({ profile }: ProfileInfoFormProps) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [school, setSchool] = useState(profile.school ?? "");
  const [gradeClass, setGradeClass] = useState(profile.gradeClass ?? "");

  useEffect(() => {
    setDisplayName(profile.displayName);
    setSchool(profile.school ?? "");
    setGradeClass(profile.gradeClass ?? "");
  }, [profile]);

  const update = useMutation({
    mutationFn: () =>
      apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          school: school.trim() || null,
          gradeClass: gradeClass.trim() || null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const reset = () => {
    setDisplayName(profile.displayName);
    setSchool(profile.school ?? "");
    setGradeClass(profile.gradeClass ?? "");
  };

  const dirty =
    displayName.trim() !== profile.displayName ||
    school.trim() !== (profile.school ?? "") ||
    gradeClass.trim() !== (profile.gradeClass ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field label="Họ và tên" htmlFor="profile-name">
          <Input
            id="profile-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <Input id="profile-email" value={profile.email} disabled readOnly />
        </Field>
        <Field label="Trường học" htmlFor="profile-school">
          <Input
            id="profile-school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="VD: THPT Nguyễn Du"
          />
        </Field>
        <Field label="Lớp" htmlFor="profile-class">
          <Input
            id="profile-class"
            value={gradeClass}
            onChange={(e) => setGradeClass(e.target.value)}
            placeholder="VD: 11A2"
          />
        </Field>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            disabled={update.isPending || !dirty || displayName.trim().length < 2}
            onClick={() => update.mutate()}
          >
            {update.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
          <Button variant="outline" disabled={!dirty} onClick={reset}>
            Hủy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
