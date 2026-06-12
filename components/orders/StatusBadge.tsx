"use client";

import { Badge } from "@radix-ui/themes";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "1" | "2" | "3";
}

type RadixColor =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "cyan"
  | "red"
  | "gray";

export function StatusBadge({ status, size = "1" }: StatusBadgeProps) {
  const color = (STATUS_COLORS[status] ?? "gray") as RadixColor;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <Badge color={color} variant="soft" size={size}>
      {label}
    </Badge>
  );
}
