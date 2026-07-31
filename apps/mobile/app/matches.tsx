import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api, getToken } from "@/lib/api";
import { colors } from "@/lib/theme";

type MatchRow = {
  id: string;
  otherUser: { profile: { displayName: string; socialBattery: string } | null };
  lastMessage: { body: string } | null;
};

export default function Matches() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchRow[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<MatchRow[]>("/matches").then(setMatches).catch(() => undefined);
  }, [router]);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<Text style={styles.meta}>No matches yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
            <Text style={styles.name}>{item.otherUser.profile?.displayName ?? "Match"}</Text>
            <Text style={styles.meta}>
              {item.lastMessage?.body ?? "Say hello"} · battery{" "}
              {item.otherUser.profile?.socialBattery}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  row: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  name: { color: colors.ink, fontWeight: "700", fontSize: 17 },
  meta: { color: colors.muted, marginTop: 4 },
});
