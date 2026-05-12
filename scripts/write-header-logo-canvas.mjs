import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dark = fs.readFileSync(path.join(root, 'public/logo-spornerede-header-markup.svg')).toString('base64');
const light = fs.readFileSync(path.join(root, 'public/logo-spornerede-header-markup-light.svg')).toString('base64');

const home = process.env.USERPROFILE || process.env.HOME || '';
const outDir = path.join(home, '.cursor', 'projects', 'd-Projects-spornerede-net', 'canvases');
fs.mkdirSync(outDir, { recursive: true });

const tsx = `import { Card, CardBody, CardHeader, Divider, H1, Row, Stack, Text, mergeStyle, useHostTheme } from 'cursor/canvas';

const DARK_MARKUP_B64 = '${dark}';
const LIGHT_MARKUP_B64 = '${light}';

export default function HeaderLogoSvgPreview() {
  const theme = useHostTheme();
  const panelDarkLogo = mergeStyle({
    padding: 20,
    borderRadius: 6,
    backgroundColor: theme.kind === 'light' ? theme.bg.editor : theme.text.primary,
  });
  const panelLightLogo = mergeStyle({
    padding: 20,
    borderRadius: 6,
    backgroundColor: theme.kind === 'light' ? theme.text.primary : theme.bg.editor,
  });
  return (
    <Stack gap={16}>
      <H1>Header logo SVG</H1>
      <Text tone="secondary">
        Gomulu data URL (ag yok). Beyaz logo acik zeminde gorunmez; sag panelde kontrastli zeminde gorunur.
      </Text>
      <Row gap={16} wrap align="stretch">
        <Card style={{ flex: '1 1 220px', minWidth: 0 }}>
          <CardHeader>Koyu metin</CardHeader>
          <CardBody style={panelDarkLogo}>
            <img
              alt="spor nerede koyu"
              src={\`data:image/svg+xml;base64,\${DARK_MARKUP_B64}\`}
              style={{ display: 'block', width: '100%', maxWidth: 220, height: 'auto' }}
            />
          </CardBody>
        </Card>
        <Card style={{ flex: '1 1 220px', minWidth: 0 }}>
          <CardHeader>Beyaz metin</CardHeader>
          <CardBody style={panelLightLogo}>
            <img
              alt="spor nerede beyaz"
              src={\`data:image/svg+xml;base64,\${LIGHT_MARKUP_B64}\`}
              style={{ display: 'block', width: '100%', maxWidth: 220, height: 'auto' }}
            />
          </CardBody>
        </Card>
      </Row>
      <Divider />
      <Text tone="tertiary" size="small">
        Guncellemek: npm run logo:header-outline ardindan node scripts/write-header-logo-canvas.mjs
      </Text>
    </Stack>
  );
}
`;

const outFile = path.join(outDir, 'header-logo-svg-preview.canvas.tsx');
fs.writeFileSync(outFile, tsx, 'utf8');
console.log('Wrote', outFile);
