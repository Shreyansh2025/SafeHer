import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../utils/constants';

export const adminStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  header: { marginBottom: SPACING.lg },
  eyebrow: { color: COLORS.secondary, fontSize: 13, fontFamily: FONTS.bodyBold, letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONTS.headingBold, marginTop: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.body, marginTop: SPACING.xs },
  card: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW },
  row: { flexDirection: 'row', alignItems: 'center' },
  statGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.bodyBold, marginBottom: SPACING.xs },
  statValue: { color: COLORS.textPrimary, fontSize: 25, fontFamily: FONTS.headingBold },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.headingBold, marginBottom: SPACING.sm },
  empty: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.xl },
  itemTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bodyBold, flex: 1 },
  itemMeta: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: '#FEF2F2' },
  pillText: { color: COLORS.sos, fontSize: 11, fontFamily: FONTS.bodyBold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  actionButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontFamily: FONTS.bodyBold },
  logoutButton: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm },
  logoutText: { color: COLORS.danger, fontFamily: FONTS.bodyBold },
});
