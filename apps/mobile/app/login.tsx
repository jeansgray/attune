import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, setToken } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("you@attune.demo");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await api<{ accessToken: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      router.replace("/discover");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.meta}>Demo: you@attune.demo / password123</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.muted}
      />
      <Pressable style={styles.btn} onPress={() => void submit()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0d1512" />
        ) : (
          <Text style={styles.btnText}>Log in</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg, gap: 12 },
  meta: { color: colors.muted, marginBottom: 8 },
  error: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: "rgba(232,240,234,0.16)",
    backgroundColor: colors.panel,
    color: colors.ink,
    borderRadius: 12,
    padding: 14,
  },
  btn: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#0d1512", fontWeight: "700" },
});
