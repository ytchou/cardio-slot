"""Run with uv run --with 'fonttools[woff]' scripts/subset-chinese-font.py FONT.ttf."""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
text = ''.join(chr(code) for code in range(32, 127)) + '年月日中文，。！？：「」『』（）／％、；—…'
for path in (root / 'src').rglob('*'):
    if path.suffix in {'.ts', '.tsx'}:
        text += ''.join(char for char in path.read_text() if ord(char) > 127)
font = TTFont(sys.argv[1])
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = 'woff2'
output = root / 'src/assets/fonts/noto-sans-tc-ui.woff2'
font.save(output)
missing = {char for char in text if 0x3400 <= ord(char) <= 0x9fff and ord(char) not in font.getBestCmap()}
if missing:
    raise ValueError(f'Missing Chinese glyphs: {missing}')
print(f'{output.name}: {output.stat().st_size:,} bytes; Chinese glyph coverage verified')
