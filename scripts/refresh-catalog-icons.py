"""Download representative product photos from observed ABC pages; no product editing.

Sources are preserved locally. Runtime thumbnails are exported separately by
optimize-menu-assets.py. Run intentionally: this script makes network requests.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from html import unescape
from concurrent.futures import ThreadPoolExecutor
import re
import json
import brotli
import gzip

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.abcdaconstrucao.com.br'
FLOORS = '/pisos-e-revestimentos/porcelanato'
ITEMS = [
    ('porcelanato-acetinado', FLOORS, 'gales-sbe-acetinado'),
    ('porcelanato-esmaltado', FLOORS, 'roma-crema-cetim'),
    ('porcelanato-decorado', '/produto/porcelanato-biancogres-savona-acetinado-60x60cm-retificado-94787', 'savona'),
    ('porcelanato-externo', FLOORS, 'downtown-swh-externo'),
    ('porcelanato-marmorizado', FLOORS, 'marmo-blue'),
    ('porcelanato-madeira', '/produto/porcelanato-incesa-soft-wood-acetinado-madeira-26x106cm-retificado-75292', 'soft-wood'),
    ('porcelanato-natural', FLOORS, 'downtown-slim-gr-natural'),
    ('porcelanato-polido', FLOORS, 'essence-cinza-polido'),
    ('porcelanato-tecnico', '/pisos-e-revestimentos/porcelanato-tecnico', 'tecnico|bianco-master|materia'),
    ('porcelanato-retificado', FLOORS, 'dunne-gray-cetim'),
    ('porta-toalha', '/produto/porta-toalha-de-rosto-trip-cromado-docol-107851', 'porta-toalha-de-rosto-trip'),
    ('saboneteira', '/produto/saboneteira-de-vidro-up-cromado-celite-96964', 'saboneteira-de-vidro-up'),
    ('prateleira-banheiro', '/metais-sanitarios/acessorios-banheiro/prateleira', 'prateleira-escala-cromado-roca'),
    ('cabide-banheiro', '/produto/cabide-para-banheiro-trip-cromado-docol-73619', 'cabide-para-banheiro-trip'),
    ('papeleira', '/produto/papeleira-tempo-roca-109311', 'papeleira-tempo-roca'),
    ('barra-apoio', '/produto/barra-de-apoio-60cm-celite-124008', 'barra-de-apoio-60cm-celite'),
    ('chuveiro-eletrico', '/produto/chuveiro-fashion-branco-lorenzetti-127v-5500w-73292', 'chuveiro-fashion'),
    ('chuveiro-eletronico', '/produto/chuveiro-eletronico-acqua-duo-ultra-220v-7800w-branco-lorenzetti-73500', 'acqua-duo-ultra'),
    ('chuveiro-hibrido', '/produto/chuveiro-eletronico-flex-hibrido-acqua-duo-ultra-127v-5500w-branco-lorenzetti-80423', 'flex-hibrido'),
    ('braco-chuveiro', '/produto/braco-para-chuveiro-de-teto-raindream-roca-102698', 'braco-para-chuveiro-de-teto-raindream'),
    ('tinta-interna', '/tintas/tinta-externa/interna/tinta-acril-ext/int', 'tinta-acrilica-novacor-extra-fosco-areia-sherwin-williams-3-6l'),
    ('tinta-externa', '/tintas/tinta-acrilica', 'tinta-acr'),
    ('tinta-emborrachada', '/produto/tinta-metalatex-elastic-branco-semiacetinado-sherwin-williams-18l-122717', 'tinta-metalatex-elastic-branco-semiacetinado'),
]

def get(url):
    with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40) as response:
        content = response.read()
        encoding = response.headers.get('Content-Encoding', '')
        if encoding == 'br': return brotli.decompress(content)
        if encoding == 'gzip': return gzip.decompress(content)
        return content

pages = {}
def fetch_page(page):
    try:
        content = get(BASE + page)
    except HTTPError as error:
        if error.code != 404 or not page.startswith('/produto/'):
            print(f'Failed page: {page}', flush=True)
            raise
        try:
            content = get(BASE + page.replace('/produto/', '/', 1))
        except HTTPError:
            print(f'Unavailable product page: {page}', flush=True)
            return page, ''
    return page, content.decode('utf-8', errors='replace')

with ThreadPoolExecutor(max_workers=4) as executor:
    for page, content in executor.map(fetch_page, sorted({entry[1] for entry in ITEMS})):
        pages[page] = content

def download(entry):
    icon_id, page, pattern = entry
    photos = list(dict.fromkeys(unescape(url) for url in re.findall(r'https://abcdaconstrucao\.fbitsstatic\.net/img/p/[^"<>\s]+', pages[page])))
    photo = next((url for url in photos if re.search(pattern, url) and '-1.jpg' in url), None)
    if not photo:
        print(f'No corresponding product photo found: {icon_id}', flush=True)
        return None
    photo = re.sub(r'w=\d+', 'w=160', re.sub(r'h=\d+', 'h=160', photo))
    slug = re.search(r'/img/p/([^/]+)/', photo).group(1)
    product_url = BASE + '/produto/' + slug
    source = ROOT / 'assets' / 'categories' / (icon_id + '-abc.jpg')
    source.write_bytes(get(photo))
    print(f'{icon_id}: {source.stat().st_size} bytes', flush=True)
    return {'iconId': icon_id, 'file': source.relative_to(ROOT).as_posix(), 'productUrl': product_url, 'sourcePage': BASE + page, 'imageUrl': photo}

with ThreadPoolExecutor(max_workers=4) as executor:
    sources = [source for source in executor.map(download, ITEMS) if source]
(ROOT / 'assets' / 'categories' / 'catalog-level-icons.json').write_text(json.dumps({'date': '2026-10-03', 'notes': 'Representative product-family photography, not offers or stock. Official ABC product CDN thumbnails; original files retained.', 'sources': sources}, ensure_ascii=False, indent=2), encoding='utf-8')
