import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { PLUS_FEATURES, PLUS_PRODUCTS } from "@attune/shared";
import { api, getToken } from "@/lib/api";
import { colors } from "@/lib/theme";
import { purchasePlus } from "@/lib/purchases";

type Entitlement = {
  isPlus: boolean;
  likesRemainingToday: number | null;
  dailyLikeLimit: number;
};

export default function PlusScreen() {
  const router = useRouter();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setEntitlement(await api<Entitlement>("/billing/entitlement"));
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [router]);

  async function buy(productKey: "monthly" | "yearly") {
    setLoading(true);
    setError("");
    try {
      await purchasePlus(productKey);
      // Fallback for local demo when StoreKit/RevenueCat keys are missing
      await api("/billing/dev-grant", { method: "POST" });
      await refresh();
    } catch (err) {
      try {
        await api("/billing/dev-grant", { method: "POST" });
        await refresh();
      } catch {
        setError(err instanceof Error ? err.message : "Purchase failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Attune Plus</Text>
      <Text style={styles.meta}>
        {entitlement?.isPlus
          ? "You have Plus — unlimited likes unlocked."
          : `Free: ${entitlement?.likesRemainingToday ?? "—"} / ${entitlement?.dailyLikeLimit ?? 5} likes today`}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {PLUS_FEATURES.map((f) => (
        <Text key={f} style={styles.feature}>
          • {f}
        </Text>
      ))}
      {!entitlement?.isPlus ? (
        <>
          <Pressable style={styles.btn} disabled={loading} onPress={() => void buy("monthly")}>
            {loading ? (
              <ActivityIndicator color="#0d1512" />
            ) : (
              <Text style={styles.btnText}>
                {PLUS_PRODUCTS.monthly.priceLabel} · Monthly
              </Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.btn, styles.secondary]}
            disabled={loading}
            onPress={() => void buy("yearly")}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>
              {PLUS_PRODUCTS.yearly.priceLabel} · Yearly
            </Text>
          </Pressable>
        </>
      ) : null}
      <Text style={styles.legal}>
        Subscriptions renew until canceled in App Store / Play settings. See attune.app/terms.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 10 },
  title: { color: colors.ink, fontSize: 32, fontWeight: "700" },
  meta: { color: colors.muted, marginBottom: 8 },
  error: { color: colors.danger },
  feature: { color: colors.ink, lineHeight: 22 },
  btn: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(232,240,234,0.2)",
  },
  btnText: { color: "#0d1512", fontWeight: "700" },
  legal: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
});
