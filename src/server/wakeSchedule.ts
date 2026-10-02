import { DateTime } from "luxon";
import { dropMomentForDiningDate } from "../core/dropRule.js";
import type { Restaurant } from "../core/types.js";

// The instant to wake the machine: the target date's unlock moment minus the
// lead time. Null if the restaurant has no rolling target or the moment passed.
export function wakeMomentFor(
  r: Restaurant,
  leadMinutes: number,
  now: DateTime
): DateTime | null {
  if (r.dropRule.kind !== "rolling" || !r.targetDate) return null;
  const unlock = dropMomentForDiningDate(r.dropRule, r.targetDate);
  if (!unlock) return null;
  const wake = unlock.minus({ minutes: leadMinutes });
  return wake > now ? wake : null;
}

// A safe, deterministic Task Scheduler name for a restaurant.
export function taskNameFor(id: string): string {
  return "TableDrop_" + id.replace(/[^A-Za-z0-9_-]/g, "_");
}

// Local wall-clock string Task Scheduler accepts.
export function taskDateTime(wake: DateTime): string {
  return wake.toLocal().toFormat("yyyy-LL-dd'T'HH:mm:ss");
}

export function buildRegisterScript(
  taskName: string,
  localDateTime: string,
  batPath: string,
  workingDir: string
): string {
  // EndBoundary + DeleteExpiredTaskAfter make one-shot tasks clean themselves
  // up ~1h after firing instead of accumulating in Task Scheduler forever.
  const endBoundary = DateTime.fromISO(localDateTime)
    .plus({ hours: 1 })
    .toFormat("yyyy-LL-dd'T'HH:mm:ss");
  return [
    `$a = New-ScheduledTaskAction -Execute '${batPath}' -WorkingDirectory '${workingDir}'`,
    `$t = New-ScheduledTaskTrigger -Once -At '${localDateTime}'`,
    `$t.EndBoundary = '${endBoundary}'`,
    `$s = New-ScheduledTaskSettingsSet -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DeleteExpiredTaskAfter (New-TimeSpan -Hours 1)`,
    `Register-ScheduledTask -TaskName '${taskName}' -Action $a -Trigger $t -Settings $s -Force | Out-Null`,
  ].join("; ");
}

export function buildUnregisterScript(taskName: string): string {
  return `Unregister-ScheduledTask -TaskName '${taskName}' -Confirm:$false`;
}

export function buildStatusScript(taskName: string): string {
  return [
    `$x = Get-ScheduledTask -TaskName '${taskName}' -ErrorAction SilentlyContinue`,
    // Guard NextRunTime: a fired one-shot task can exist with a null next run.
    `if ($x) { $i = $x | Get-ScheduledTaskInfo; if ($i.NextRunTime) { $i.NextRunTime.ToString('o') } else { 'NONE' } } else { 'NONE' }`,
  ].join("; ");
}

// Lists every TableDrop_* task with a pending run, one "TaskName|isoNextRun"
// per line — a single PowerShell spawn no matter how many restaurants exist.
export function buildListScript(): string {
  return `Get-ScheduledTask -TaskName 'TableDrop_*' -ErrorAction SilentlyContinue | ForEach-Object { $i = $_ | Get-ScheduledTaskInfo; if ($i.NextRunTime) { Write-Output ($_.TaskName + '|' + $i.NextRunTime.ToString('o')) } }`;
}
