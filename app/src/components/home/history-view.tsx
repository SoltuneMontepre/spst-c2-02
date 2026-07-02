"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";

const mockData = [
  { id: "CHO-2847", date: "24/06/2026", role: "producer", round: "2/4", score: 320, status: "active" },
  { id: "CHO-1152", date: "22/06/2026", role: "consumer", round: "4/4", score: 480, status: "done" },
  { id: "CHO-3391", date: "20/06/2026", role: "intermediary", round: "3/4", score: 290, status: "active" },
];

export function HistoryView() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = mockData.filter((row) => {
    if (search && !row.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter && filter !== "all" && row.status !== filter) return false;
    return true;
  });

  return (
    <div className="flex min-h-full flex-col p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Lịch sử phiên chơi</h1>
        <div className="flex items-center gap-2">
          <button className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
            <Search className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onChange={setFilter} className="w-40">
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="active">Đang diễn ra</SelectItem>
          <SelectItem value="done">Hoàn thành</SelectItem>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã phòng</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Vòng</TableHead>
            <TableHead>Điểm</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row.id}>
              <TableCell><span className="font-mono font-medium">{row.id}</span></TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell><Tag variant={row.role as any}>{roleLabel(row.role)}</Tag></TableCell>
              <TableCell>{row.round}</TableCell>
              <TableCell><span className="font-mono font-semibold">{row.score}</span></TableCell>
              <TableCell>
                <Tag variant={row.status === "active" ? "status-active" : "status-done"}>
                  {row.status === "active" ? "Đang diễn ra" : "Hoàn thành"}
                </Tag>
              </TableCell>
              <TableCell>
                <button className="text-[11px] font-semibold text-primary hover:underline">Chi tiết</button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "producer": return "Nhà cung cấp";
    case "consumer": return "Khách hàng";
    case "intermediary": return "Đại lý";
    case "government": return "Quản lý";
    default: return role;
  }
}
