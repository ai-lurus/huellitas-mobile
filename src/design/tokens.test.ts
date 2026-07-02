import { colors, typography } from './tokens';

describe('design tokens — colors', () => {
  it('uses the PLAKA brand colors for primary/surface/accent/danger', () => {
    expect(colors.primary).toBe('#0B5369');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.accent).toBe('#00785B');
    expect(colors.danger).toBe('#FF4B4B');
  });

  it('derives supporting colors from the brand palette', () => {
    expect(colors.primaryDark).toBe('#083E4D');
    expect(colors.dangerDark).toBe('#C62828');
    expect(colors.dangerSoft).toBe('#FFEDED');
    expect(colors.dangerIcon).toBe('#D32F2F');
    expect(colors.success).toBe('#00785B');
    expect(colors.successIcon).toBe('#00785B');
    expect(colors.textPrimary).toBe('#0F2933');
    expect(colors.textSecondary).toBe('#5C7480');
    expect(colors.textMuted).toBe('rgba(15,41,51,0.42)');
    expect(colors.border).toBe('#DCE6E9');
    expect(colors.background).toBe('#F6FAFA');
    expect(colors.backgroundApp).toBe('#F6FAFA');
    expect(colors.navActive).toBe('#0B5369');
    expect(colors.iconMuted).toBe('#5C7480');
    expect(colors.infoBorder).toBe('#0B5369');
    expect(colors.infoBackground).toBe('rgba(11,83,105,0.06)');
  });

  it('keeps non-brand colors unchanged', () => {
    expect(colors.google).toBe('#4285F4');
    expect(colors.white).toBe('#FFFFFF');
    expect(colors.black).toBe('#000000');
  });
});

describe('design tokens — typography', () => {
  it('maps title/heading to Montserrat and body styles to Inter', () => {
    expect(typography.title.fontFamily).toBe('Montserrat_700Bold');
    expect(typography.heading.fontFamily).toBe('Montserrat_700Bold');
    expect(typography.body.fontFamily).toBe('Inter_400Regular');
    expect(typography.bodyStrong.fontFamily).toBe('Inter_700Bold');
    expect(typography.label.fontFamily).toBe('Inter_700Bold');
    expect(typography.button.fontFamily).toBe('Inter_700Bold');
    expect(typography.caption.fontFamily).toBe('Inter_400Regular');
  });
});
