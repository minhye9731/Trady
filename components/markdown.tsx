import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, space } from '@/constants/theme';

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'bullet'; text: string; indent: number }
  | { kind: 'numbered'; marker: string; text: string }
  | { kind: 'divider' }
  | { kind: 'paragraph'; text: string };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^\s*(#{1,6})\s+(.*)$/))) {
      blocks.push({ kind: 'heading', level: m[1].length, text: m[2] });
    } else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push({ kind: 'divider' });
    } else if ((m = line.match(/^(\s*)[-*•]\s+(.*)$/))) {
      blocks.push({ kind: 'bullet', text: m[2], indent: m[1].length >= 2 ? 1 : 0 });
    } else if ((m = line.match(/^\s*(\d+)[.)]\s+(.*)$/))) {
      blocks.push({ kind: 'numbered', marker: m[1], text: m[2] });
    } else {
      blocks.push({ kind: 'paragraph', text: line.trim() });
    }
  }
  return blocks;
}

/** Renders **bold** spans inside a line. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Text key={i} style={styles.bold}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

/** Minimal Markdown for AI reports: headings, bold, bullets, numbered lists, dividers. */
export function Markdown({ content }: { content: string }) {
  const blocks = parse(content);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading':
            return (
              <Text key={i} style={[styles.heading, b.level <= 2 && styles.headingLarge, i > 0 && { marginTop: space.md }]}>
                <Inline text={b.text.replace(/\*\*/g, '')} />
              </Text>
            );
          case 'divider':
            return <View key={i} style={styles.divider} />;
          case 'bullet':
            return (
              <View key={i} style={[styles.listRow, b.indent ? { paddingLeft: 18 } : null]}>
                <View style={styles.dot} />
                <Text style={[styles.body, { flex: 1 }]}>
                  <Inline text={b.text} />
                </Text>
              </View>
            );
          case 'numbered':
            return (
              <View key={i} style={[styles.listRow, { marginTop: 4 }]}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{b.marker}</Text>
                </View>
                <Text style={[styles.body, { flex: 1 }]}>
                  <Inline text={b.text} />
                </Text>
              </View>
            );
          default:
            return (
              <Text key={i} style={styles.body}>
                <Inline text={b.text} />
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 24, color: palette.inkSoft },
  bold: { fontWeight: '600', color: palette.ink },
  heading: { fontSize: 16, fontWeight: '700', color: palette.ink, letterSpacing: -0.2 },
  headingLarge: { fontSize: 18 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: space.sm },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.faint, marginTop: 10 },
  number: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    paddingHorizontal: 5,
  },
  numberText: { color: palette.onInk, fontSize: 12, fontWeight: '700' },
});
