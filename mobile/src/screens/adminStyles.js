import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/constants';

export const adminStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  header: { marginBottom: SPACING.lg },
  eyebrow: { color: COLORS.secondary, fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', marginTop: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.xs },
  card: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW },
  row: { flexDirection: 'row', alignItems: 'center' },
  statGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: SPACING.xs },
  statValue: { color: COLORS.textPrimary, fontSize: 25, fontWeight: '800' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: SPACING.sm },
  empty: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.xl },
  itemTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', flex: 1 },
  itemMeta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: '#FEF2F2' },
  pillText: { color: COLORS.sos, fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  actionButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '800' },
  logoutButton: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm },
  logoutText: { color: COLORS.danger, fontWeight: '800' },
});
