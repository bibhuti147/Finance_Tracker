import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useFocusEffect } from "expo-router";
import { useIncomingShare } from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TransactionRow from "../../components/TransactionRow";
import { supabase } from "../../lib/supabase";

const PICKER_OPTIONS = {
  mediaTypes: ["images"],
  quality: 0.8,
};

export default function Home() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const { resolvedSharedPayloads, clearSharedPayloads } = useIncomingShare();

  const loadRecent = useCallback(async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecent(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent]),
  );

  // Shared by camera, gallery and the Share menu:
  // image uri -> resize -> extract -> Supabase
  const processUri = useCallback(
    async (uri) => {
      setError(null);
      setNotice(null);
      setLoading(true);
      try {
        const ctx = ImageManipulator.manipulate(uri).resize({ width: 1024 });
        const rendered = await ctx.renderAsync();
        const img = await rendered.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.7,
          base64: true,
        });

        // TODO: extraction is switched off for now.
        // `img.base64` is the resized JPEG, ready to be sent to a model later.
        console.log("Photo ready, base64 length:", img.base64.length);
        setNotice("Photo received. Reading is switched off for now.");
      } catch (e) {
        console.error("Scan failed:", e);
        setError(
          __DEV__
            ? `Debug: ${e?.message ?? String(e)}`
            : "Could not read this payment. Try again with a clearer photo.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadRecent],
  );

  // Image shared from the gallery's Share button
  useEffect(() => {
    const image = resolvedSharedPayloads.find(
      (p) => p.contentType === "image" && p.contentUri,
    );
    if (!image) return;
    clearSharedPayloads(); // so it isn't processed twice
    processUri(image.contentUri);
  }, [resolvedSharedPayloads, clearSharedPayloads, processUri]);

  const scan = async () => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera access is off. Turn it on in Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) await processUri(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) await processUri(result.assets[0].uri);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top"]}>
      {/* Top half: scan */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-[148px] h-[148px] rounded-full bg-accentSoft items-center justify-center mb-5">
          <Pressable
            onPress={scan}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Scan a payment"
            className="w-[108px] h-[108px] rounded-full bg-accent items-center justify-center active:opacity-80"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Ionicons name="camera-outline" size={40} color="#fff" />
            )}
          </Pressable>
        </View>
        <Text className="text-xl font-semibold text-ink">
          {loading ? "Reading payment…" : "Scan a payment"}
        </Text>
        <Text
          className={`text-sm mt-1.5 text-center ${error ? "text-danger" : "text-muted"}`}
        >
          {error ?? notice ?? "Take a photo of a receipt or payment screen."}
        </Text>

        <Pressable
          onPress={pickFromGallery}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Choose a photo from gallery"
          hitSlop={8}
          className={`flex-row items-center mt-5 ${loading ? "opacity-40" : "active:opacity-60"}`}
        >
          <Ionicons name="images-outline" size={18} color="#1F3A5F" />
          <Text className="text-[15px] font-medium text-accent ml-2">
            Choose from gallery
          </Text>
        </Pressable>
      </View>

      {/* Bottom half: recent */}
      <View className="flex-1 bg-white rounded-t-3xl px-5 pt-5">
        <Text className="text-lg font-semibold text-ink mb-1">Recent</Text>
        <FlatList
          data={recent}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TransactionRow tx={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-sm text-muted py-6">
              No payments yet. Scan your first one above.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
