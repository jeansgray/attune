import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, getToken } from "@/lib/api";
import { colors } from "@/lib/theme";

type Message = { id: string; senderId: string; body: string };

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    (async () => {
      const meRes = await api<{ id: string }>("/auth/me");
      setMe(meRes.id);
      const res = await api<{ messages: Message[] }>(`/matches/${id}/messages`);
      setMessages(res.messages);
    })().catch(() => undefined);
  }, [id, router]);

  async function send() {
    if (!body.trim()) return;
    const msg = await api<Message>(`/matches/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    setMessages((m) => [...m, msg]);
    setBody("");
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderId === me ? styles.mine : styles.theirs]}>
            <Text style={styles.text}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Say what you mean…"
          placeholderTextColor={colors.muted}
        />
        <Pressable style={styles.btn} onPress={() => void send()}>
          <Text style={styles.btnText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  bubble: { padding: 12, borderRadius: 12, maxWidth: "85%" },
  mine: { alignSelf: "flex-end", backgroundColor: "#4f7f7259" },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.panel },
  text: { color: colors.ink },
  composer: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(232,240,234,0.16)",
    backgroundColor: colors.panel,
    color: colors.ink,
    borderRadius: 12,
    padding: 12,
  },
  btn: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnText: { color: "#0d1512", fontWeight: "700" },
});
