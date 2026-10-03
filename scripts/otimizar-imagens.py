"""Exporta as imagens leves do índice, preservando os originais organizados."""
from pathlib import Path
from PIL import Image
import json
import shutil

raiz = Path(__file__).resolve().parents[1]
indice = json.loads((raiz / 'header-menu-abc' / 'indice-categorias.json').read_text(encoding='utf-8'))
total = 0
for fonte in indice['fontes']:
    original = raiz / fonte['original']
    destino = raiz / fonte['exportacao']
    limite = 480 if '/promocoes/' in fonte['exportacao'] else 160
    with Image.open(original) as imagem:
        imagem.thumbnail((limite, limite), Image.Resampling.LANCZOS)
        for qualidade in (84, 78, 72, 66, 60, 52):
            imagem.save(destino, 'WEBP', quality=qualidade, method=4)
            if limite == 480 or destino.stat().st_size < 15000:
                break
    if limite != 480:
        assert destino.stat().st_size < 15000, f'Ícone acima de 15 KB: {destino}'
    total += destino.stat().st_size

# A mesma família pode existir em mais de um departamento/nível.
# Sincronize as cópias usando o ID, nunca inferindo o tipo pelo nome do arquivo.
for categoria in indice['categorias']:
    for entradas in categoria['niveis'].values():
        for entrada in entradas:
            origem = raiz / indice['icones'][entrada['iconeId']]
            destino = raiz / entrada['arquivo']
            if origem != destino:
                shutil.copyfile(origem, destino)
print(f'Exportações leves: {total:,} bytes. Originais preservados; níveis sincronizados.')
