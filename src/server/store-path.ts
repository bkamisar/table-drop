import { join } from "node:path";
import { homedir } from "node:os";

export function storePath(): string {
  return (
    process.env.RESERVATION_STORE ??
    join(homedir(), ".reservation-tool", "store.json")
  );
}
