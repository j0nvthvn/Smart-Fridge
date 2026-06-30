import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useInventory } from '../context/InventoryContext';
import { sendMessage } from '../services/chefService';

function RecipeCard({ name, steps }) {
  return (
    <>
      <View style={styles.recipeNameChip}>
        <MaterialCommunityIcons name="chef-hat" size={14} color={COLORS.white} />
        <Text style={styles.recipeNameText}>{name}</Text>
      </View>
      {steps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </>
  );
}

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  data: { type: 'text', content: '¡Hola! Soy tu Chef IA 👨‍🍳\n\nConozco tu inventario y puedo sugerirte recetas con lo que tienes, priorizando los ingredientes que están por vencer.\n\n¿Qué te gustaría cocinar hoy?' },
};

export default function ChefScreen() {
  const { products } = useInventory();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.data?.content ?? JSON.stringify(m.data)),
      }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendMessage([...history, { role: 'user', content: text }], products);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', data: reply },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          data: { type: 'text', content: `Lo siento, hubo un error: ${err.message}` },
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderBubbleContent(item) {
    if (item.role === 'user') {
      return (
        <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{item.content}</Text>
      );
    }

    const data = item.data ?? { type: 'text', content: '' };

    if (data.type === 'recipe') {
      return <RecipeCard name={data.name} steps={data.steps} />;
    }

    if (data.type === 'menu') {
      return (
        <>
          {data.recipes.map((r, i) => (
            <View key={i} style={i > 0 && styles.menuDivider}>
              <RecipeCard name={r.name} steps={r.steps} />
            </View>
          ))}
        </>
      );
    }

    return (
      <Text style={[styles.bubbleText, item.isError && styles.errorText]}>
        {data.content}
      </Text>
    );
  }

  function renderMessage({ item }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="chef-hat" size={16} color={COLORS.white} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
          item.isError && styles.bubbleError,
        ]}>
          {renderBubbleContent(item)}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="chef-hat" size={22} color={COLORS.white} />
        <Text style={styles.headerTitle}>Chef IA</Text>
        <Text style={styles.headerSub}>{products.length} ingredientes disponibles</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="chef-hat" size={16} color={COLORS.white} />
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.green500} />
              <Text style={styles.typingText}>Preparando respuesta…</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="¿Qué quieres cocinar hoy?"
            placeholderTextColor={COLORS.gray400}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
            activeOpacity={0.7}
          >
            <Feather name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.green500,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 2,
  },
  bubbleRowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAI: {
    backgroundColor: COLORS.white,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.green500,
    borderBottomRightRadius: 4,
  },
  bubbleError: {
    backgroundColor: COLORS.red50,
    borderColor: COLORS.red400,
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: COLORS.white,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray300,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.gray700,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.gray400,
  },
  recipeNameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.green500,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  recipeNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green600,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray700,
    lineHeight: 19,
  },
  errorText: {
    color: COLORS.red400,
  },
  menuDivider: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray300,
  },
});
