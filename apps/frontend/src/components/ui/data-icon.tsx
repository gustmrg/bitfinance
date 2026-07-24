import { BarChart3, ReceiptText, UsersRound, WalletCards } from "lucide-react";

export function DataIcon({ type }: { type: "bill" | "expense" | "budget" | "team" }) {
  const Icon =
    type === "bill"
      ? ReceiptText
      : type === "expense"
        ? BarChart3
        : type === "budget"
          ? WalletCards
          : UsersRound;
  return (
    <span className={`data-icon data-icon--${type}`}>
      <Icon size={17} />
    </span>
  );
}
