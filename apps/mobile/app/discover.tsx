import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, getToken } from "@/lib/api";
import { colors } from "@/lib/theme";

type Card = {
  userId: string;
  score: { total: number };
  profile: {
    displayName: string;
    bio: string;
    city: string | null;
    specialInterests: string[];
    photoUrls: string[];
    socialBattery: string;
  };
  prompts: { id: string; promptText: string; answer: string }[];
};

type Entitlement = {
  isPlus: boolean;
  likesRemainingToday: number | null;
  dailyLikeLimit: number;
};

export default function Discover() {
  const router = useRouter();
  const [items, setItems] = useState<Card[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<{ results: Card[]; entitlement: Entitlement }>("/discover")
      .then((data) => {
        setItems(data.results);
        setEntitlement(data.entitlement);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [router]);

  async function like(card: Card) {
    try {
      const res = await api<{ entitlement: Entitlement }>("/likes", {
        method: "POST",
        body: JSON.stringify({ toUserId: card.userId, promptId: card.prompts[0]?.id }),
      });
      setEntitlement(res.entitlement);
      setItems((prev) => prev.filter((i) => i.userId !== card.userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Like failed");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={() => router.push("/matches")}>
          <Text style={styles.link}>Matches →</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/plus")}>
          <Text style={styles.link}>
            {entitlement?.isPlus
              ? "Plus ✓"
              : `${entitlement?.likesRemainingToday ?? "—"} likes · Plus`}
          </Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{
                uri:
                  item.profile.photoUrls[0] ??
                  "https://api.dicebear.com/9.x/shapes/png?seed=attune",
              }}
              style={styles.photo}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.profile.displayName}</Text>
                <Text style={styles.score}>{item.score.total}%</Text>
              </View>
              <Text style={styles.meta}>
                {item.profile.city ?? "Somewhere"} · {item.profile.socialBattery}
              </Text>
              <Text style={styles.bio}>{item.profile.bio}</Text>
              {item.prompts[0] ? (
                <Text style={styles.prompt}>
                  {item.prompts[0].promptText}{"\n"}
                  <Text style={{ color: colors.ink }}>{item.prompts[0].answer}</Text>
                </Text>
              ) : null}
              <View style={styles.row}>
                <Pressable style={styles.btn} onPress={() => void like(item)}>
                  <Text style={styles.btnText}>Like</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.secondary]}
                  onPress={() =>
                    setItems((prev) => prev.filter((i) => i.userId !== item.userId))
                  }
                >
                  <Text style={[styles.btnText, { color: colors.ink }]}>Pass</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  link: { color: colors.sage, marginBottom: 12, fontWeight: "600" },
  error: { color: colors.danger, marginBottom: 8 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  photo: { width: "100%", height: 180, borderRadius: 12, backgroundColor: "#16201c" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  name: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  score: { color: colors.sage, fontWeight: "700" },
  meta: { color: colors.muted },
  bio: { color: colors.ink, lineHeight: 20 },
  prompt: { color: colors.clay, marginTop: 4, lineHeight: 20 },
  btn: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  secondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(232,240,234,0.2)" },
  btnText: { color: "#0d1512", fontWeight: "700" },
});
