import { Text, View } from "react-native";
import { money } from "../lib/theme";

export default function TransactionRow({ tx }) {
  const d = new Date(tx.created_at);
  const when =
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  return (
    <View className="flex-row items-center py-3.5 border-b border-line">
      <View className="flex-1 pr-4">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {tx.to_whom || "Unknown"}
        </Text>
        <Text className="text-[13px] text-muted mt-0.5">{when}</Text>
      </View>
      <Text className="text-base font-semibold text-ink tabular-nums">
        {money(tx.amount)}
      </Text>
    </View>
  );
}
