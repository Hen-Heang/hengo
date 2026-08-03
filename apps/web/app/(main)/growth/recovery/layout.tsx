import { RecoveryLockGate } from "@/components/recovery/RecoveryLockGate"

export default function RecoveryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RecoveryLockGate>{children}</RecoveryLockGate>
}
