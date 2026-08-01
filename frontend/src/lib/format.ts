interface DateFormatOptions {
  weekday?: boolean;
  year?: boolean;
}

export function formatDate(dateStr: string | null, options: DateFormatOptions = {}): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: options.weekday ? "short" : undefined,
    month: "short",
    day: "numeric",
    year: options.year ? "numeric" : undefined,
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
