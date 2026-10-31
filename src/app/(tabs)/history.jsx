import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TransactionRow from "../../components/TransactionRow";
import { supabase } from "../../lib/supabase";
import { colors, money } from "../../lib/theme";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function History() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 1).toISOString();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = items.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top"]}>
      <View className="px-5 pt-3 pb-4">
        <Text className="text-[28px] font-bold text-ink">History</Text>

        {/* Year stepper */}
        <View className="flex-row items-center justify-between mt-5 mb-2">
          <Pressable
            onPress={() => setYear(year - 1)}
            hitSlop={12}
            accessibilityLabel="Previous year"
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-semibold text-ink tabular-nums">
            {year}
          </Text>
          <Pressable
            onPress={() => setYear(year + 1)}
            hitSlop={12}
            accessibilityLabel="Next year"
          >
            <Ionicons name="chevron-forward" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {/* Month grid */}
        <View className="flex-row flex-wrap -mx-1">
          {MONTHS.map((m, i) => {
            const active = i === month;
            return (
              <Pressable
                key={m}
                onPress={() => setMonth(i)}
                className="w-1/4 p-1"
              >
                <View
                  className={`py-2.5 rounded-xl items-center ${active ? "bg-accent" : ""}`}
                >
                  <Text
                    className={`text-[15px] ${active ? "text-white font-semibold" : "text-ink"}`}
                  >
                    {m}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Results */}
      <View className="flex-1 bg-white rounded-t-3xl px-5 pt-5">
        <View className="mb-2">
          <Text className="text-[26px] font-bold text-ink tabular-nums">
            {money(total)}
          </Text>
          <Text className="text-[13px] text-muted mt-0.5">
            {items.length} {items.length === 1 ? "payment" : "payments"} in{" "}
            {MONTHS[month]} {year}
          </Text>
        </View>
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TransactionRow tx={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-sm text-muted py-6">
              No payments in this month.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
