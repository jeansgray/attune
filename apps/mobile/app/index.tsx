import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

export default function Home() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Attune</Text>
      <Text style={styles.lede}>
        Friends and dating matched on social wants, sensory needs, and
        communication — for neurodivergent connection.
      </Text>
      <Link href="/login" style={styles.btn}>
        <Text style={styles.btnText}>Log in / Demo</Text>
      </Link>
      <Link href="/discover" style={styles.link}>
        <Text style={styles.linkText}>Go to Discover</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: "flex-end",
    paddingBottom: 48,
    backgroundColor: colors.bg,
  },
  brand: {
    color: colors.ink,
    fontSize: 56,
    fontWeight: "700",
    marginBottom: 12,
  },
  lede: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 320,
  },
  btn: {
    backgroundColor: colors.sage,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  btnText: { color: "#0d1512", fontWeight: "700", fontSize: 16 },
  link: { paddingVertical: 8 },
  linkText: { color: colors.muted, fontSize: 15 },
});
