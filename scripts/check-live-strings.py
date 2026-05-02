import os

root = '/opt/spornerede/current'
needles = [
    'Spor dünyasından güncel haberler ve duyurular',
    "WhatsApp'tan Ulaş",
]
found = {n: False for n in needles}

for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith(('.js', '.mjs', '.html', '.astro', '.css', '.txt')):
            continue
        path = os.path.join(dp, f)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
        except Exception:
            continue
        for n in needles:
            if n in content:
                found[n] = True

print(found)
