export type DispatchStatus = "scheduled" | "in_progress" | "completed";

export function dispatchStartDate(jobStartDate: string, startTime: string): Date {
  return new Date(`${jobStartDate}T${startTime || "07:00"}:00`);
}

export function dispatchEndDate(
  jobStartDate: string,
  startTime: string,
  productionHours: number
): Date {
  const start = dispatchStartDate(jobStartDate, startTime);
  return new Date(start.getTime() + productionHours * 60 * 60 * 1000);
}

export function formatCompletion(
  jobStartDate: string,
  startTime: string,
  productionHours: number
): string {
  const end = dispatchEndDate(jobStartDate, startTime, productionHours);
  if (Number.isNaN(end.getTime())) return "-";
  return end.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dispatchStatus(
  jobStartDate: string,
  startTime: string,
  productionHours: number,
  now: Date = new Date()
): DispatchStatus {
  const start = dispatchStartDate(jobStartDate, startTime);
  const end = dispatchEndDate(jobStartDate, startTime, productionHours);
  if (now < start) return "scheduled";
  if (now > end) return "completed";
  return "in_progress";
}

export const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
};
