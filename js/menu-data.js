(function () {
  'use strict';

  // Explicit editorial aliases for shortcuts; never rewrite a resolved node ID.
  const categoryAliases = {
    chuveiros: 'chuveiro',
    'acabamento para banheiro': 'acabamentos para banheiro'
  };
  const assetRegistry = {
    logo: {
      abc: 'assets/logo-abc.svg',
      casaPrime: 'assets/logo-casa-prime.svg',
      mysa: 'assets/optimized/logo-mysa.webp'
    },
    icon: {
      conta: 'assets/optimized/header-conta-v1.webp',
      regionalizacao: 'assets/optimized/header-regionalizacao-v1.webp',
      'carrinho-mao': 'assets/optimized/header-carrinho-mao-v1.webp',
      departamentos: 'assets/optimized/header-departamentos-v2.webp',
      'principais-categorias': 'assets/optimized/icon-principais-categorias.webp',
      ambientes: 'assets/optimized/icon-ambientes.webp',
      metais: 'assets/optimized/icon-metais.webp',
      loucas: 'assets/optimized/icon-loucas.webp',
      'pisos-revestimentos': 'assets/optimized/icon-pisos.webp',
      cupons: 'assets/optimized/icon-cupons.webp',
      whatsapp: 'assets/icon-whatsapp.svg',
      porcelanato: 'assets/optimized/category-porcelanato.webp',
      'piso-vinilico': 'assets/optimized/category-piso-vinilico.webp',
      'piso-ceramico': 'assets/optimized/category-piso-ceramico.webp',
      'piso-laminado': 'assets/optimized/category-piso-laminado.webp',
      'revestimento-parede': window.Menu2026CategoryIcons.assets.azulejo,
      pastilha: 'assets/optimized/category-pastilha.webp',
      'rodapes-guarnicoes': 'assets/optimized/category-rodapes.webp',
      'area-externa': 'assets/optimized/category-area-externa.webp',
      'torneira-banheiro': 'assets/optimized/category-torneira-banheiro.webp',
      'torneira-cozinha': 'assets/optimized/category-torneira-cozinha.webp',
      'vaso-sanitario': 'assets/optimized/category-vaso-sanitario.webp',
      chuveiro: 'assets/optimized/category-chuveiro.webp',
      tinta: 'assets/optimized/category-tinta.webp',
      generic: 'assets/category-generic.svg',
      ...window.Menu2026CategoryIcons.assets
    },
    environment: {
      banheiro: 'assets/environment-banheiro-v2.webp',
      cozinha: 'assets/environment-cozinha-v2.webp',
      'sala-estar': 'assets/environment-sala-estar-v2.webp',
      'sala-jantar': 'assets/environment-sala-jantar-v2.webp',
      quarto: 'assets/environment-quarto-v2.webp',
      escritorio: 'assets/environment-escritorio-v2.webp',
      'area-externa': 'assets/environment-area-externa-v2.webp',
      piscina: 'assets/environment-piscina-v2.webp'
    },
    environmentFeature: {
      banheiro: 'assets/environment-banheiro-portrait-v2.webp',
      cozinha: 'assets/environment-cozinha-portrait-v2.webp',
      'sala-estar': 'assets/environment-sala-estar-portrait-v2.webp',
      'sala-jantar': 'assets/environment-sala-jantar-portrait-v2.webp',
      quarto: 'assets/environment-quarto-portrait-v2.webp',
      escritorio: 'assets/environment-escritorio-portrait-v2.webp',
      'area-externa': 'assets/environment-area-externa-portrait-v2.webp',
      piscina: 'assets/environment-piscina-portrait-v2.webp'
    },
    banner: {
      'porcelanato-oferta': 'assets/optimized/banner-porcelanato.webp',
      'pisos-vinilicos': 'assets/optimized/banner-pisos-vinilicos.webp',
      'metais-banheiro': 'assets/banner-metais-banheiro.svg',
      'torneiras-cozinha': 'assets/banner-torneiras-cozinha.svg',
      'loucas-banheiro': 'assets/banner-loucas-banheiro.svg',
      'cubas-cozinha': 'assets/banner-cubas-cozinha.svg'
    },
    brand: {
      docol: 'assets/brand-docol.svg', deca: 'assets/brand-deca.svg', roca: 'assets/brand-roca.svg',
      celite: 'assets/brand-celite.svg', tramontina: 'assets/brand-tramontina.svg',
      lorenzetti: 'assets/brand-lorenzetti.svg', coral: 'assets/optimized/brand-coral.webp',
      fani: 'assets/brand-fani.svg', quartzolit: 'assets/brand-quartzolit.svg',
      acqualimp: 'assets/optimized/brand-acqualimp.webp', komeco: 'assets/brand-komeco.svg',
      biancogres: 'assets/brand-biancogres.svg', brinox: 'assets/brand-brinox.svg',
      portobello: 'assets/optimized/brand-portobello.webp', ceusa: 'assets/optimized/brand-ceusa.webp',
      eliane: 'assets/optimized/brand-eliane.webp', elizabeth: 'assets/optimized/brand-elizabeth.webp',
      incepa: 'assets/optimized/brand-incepa.webp', portinari: 'assets/optimized/brand-portinari.webp'
    },
    product: { 'piso-rochedo': 'assets/optimized/product-piso.webp' }
  };

  // Shared preview promotions until each department has its final campaign assets.
  const featuredBannerIds = ['porcelanato-oferta', 'pisos-vinilicos'];

  const departments = [
    { id: 'pisos-revestimentos', sourceLabel: 'Piso e Revestimento', label: 'Pisos e Revestimentos', iconId: 'pisos-revestimentos', children: [
      { label: 'Piso', children: ['Piso laminado', 'Piso Vinílico', 'Piso cerâmico', 'Piso para piscina'] },
      { label: 'Revestimento', children: ['Revestimento de parede', 'Revestimento Azulejo', 'Revestimento Azulejo Decorativo', 'Revestimento Cotto', 'Revestimento Monoporoso', 'Revestimento Monoporoso Decorativo', 'Revestimento para área externa', 'Revestimento para Fachada', 'Revestimento para piscina', 'Revestimento tijolinho'] },
      { label: 'Porcelanato', children: ['Porcelanato Acetinado', 'Porcelanato Esmaltado', 'Porcelanato Decorado', 'Porcelanato Externo', 'Porcelanato marmorizado', 'Porcelanato madeira', 'Porcelanato Natural', 'Porcelanato Polido', 'Porcelanato técnico', 'Porcelanato retificado'] },
      { label: 'Pastilha', children: ['Pastilha adesiva', 'Pastilha de vidro', 'Pastilha cerâmica', 'Pastilha esmaltada', 'Pastilha de Pedra natural', 'Bordas e Filetes', 'Inox', 'Pastilha para banheiro', 'Pastilha para Piscina', 'Acessórios pastilha'] },
      { label: 'Rodapés e Guarnições', children: ['Rodapé', 'Acessórios para rodapé', 'Rodameio', 'Guarnição', 'Rodateto'] }
    ], featured: [
      ['Porcelanato', 'porcelanato'], ['Piso Vinílico', 'piso-vinilico'], ['Piso cerâmico', 'piso-ceramico'], ['Piso laminado', 'piso-laminado'],
      ['Revestimento de parede', 'revestimento-parede'], ['Pastilha', 'pastilha'], ['Rodapés e Guarnições', 'rodapes-guarnicoes'], ['Revestimento para área externa', 'area-externa']
    ], bannerIds: featuredBannerIds, brandIds: ['portobello', 'portinari', 'biancogres', 'ceusa', 'eliane', 'elizabeth'] },
    { id: 'metais', label: 'Metais', iconId: 'metais', children: [
      { label: 'Metais para Banheiro', children: ['Acabamentos para banheiro', 'Acessórios para Banheiro', 'Porta Toalha e Toalheiros', 'Saboneteiras', 'Prateleiras para Banheiro', 'Cabides para Banheiro', 'Papeleiras para Banheiro', 'Nichos', 'Lixeiras para Banheiro', 'Acessibilidade'] },
      { label: 'Metais para chuveiros e duchas', children: ['Acessórios para Duchas Frias', 'Acabamento Monocomando para Duchas', 'Acabamentos para Registros de Chuveiro', 'Grelhas e Ralos para chuveiro', 'Registros e Bases'] },
      { label: 'Torneiras para banheiro', children: ['Torneiras Convencionais para Banheiro', 'Torneiras Automáticas para Banheiro', 'Torneiras Monocomando para Banheiros', 'Torneiras Misturadores para Banheiro'] },
      { label: 'Torneiras para cozinha', children: ['Torneiras Convencionais para Cozinha', 'Torneiras Misturador para Cozinha', 'Torneiras Monocomando para Cozinha', 'Torneiras Gourmet', 'Torneiras Elétricas', 'Torneiras com Filtro', 'Acessórios para Torneiras'] },
      { label: 'Torneira para área externa', children: [] }
    ], featured: [
      ['Metais para Banheiro', 'torneira-banheiro'], ['Metais para chuveiros e duchas', 'chuveiro'], ['Torneiras para banheiro', 'torneira-banheiro'],
      ['Torneiras para cozinha', 'torneira-cozinha'], ['Torneira para área externa', 'torneira-jardim'], ['Registros e Bases', 'registro-base']
    ], bannerIds: featuredBannerIds, brandIds: ['docol', 'deca', 'fani', 'lorenzetti', 'roca', 'celite'] },
    { id: 'loucas-inox', label: 'Louças e Inox', iconId: 'loucas', children: [
      { label: 'Pia para Banheiro', children: ['Cubas para Banheiro', 'Cuba de sobrepor', 'Cuba de apoio', 'Cubas de Semi Encaixe', 'Cuba de embutir', 'Colunas para pia', 'Lavatórios'] },
      { label: 'Pia para cozinha', children: ['Cuba para cozinha', 'Cuba inox para cozinha', 'Válvulas para pias de cozinha', 'Trituradores de alimento', 'Acessórios de Cubas de Cozinha'] },
      { label: 'Vaso Sanitário', children: ['Vaso sanitário completo', 'Vaso sanitário suspenso', 'Vaso sanitário para caixa acoplada', 'Vaso sanitário Monobloco', 'Vaso sanitário infantil', 'Assentos Sanitários', 'Mictórios', 'Bidê', 'Caixa de Descarga', 'Acessórios para Vasos Sanitários'] },
      { label: 'Tanque', children: ['Tanques inox', 'Tanque de porcelana', 'Colunas para tanques', 'Gabinetes para Lavanderia', 'Válvulas para Tanques', 'Sifões para Tanques', 'Acessórios para Tanques'] }
    ], featured: [
      ['Cubas para Banheiro', 'cuba-embutir'], ['Cuba de apoio', 'cuba-banheiro'], ['Lavatórios', 'lavatorio-suspenso'], ['Cuba para cozinha', 'cuba-cozinha'],
      ['Cuba inox para cozinha', 'cuba-inox-dupla'], ['Vaso Sanitário', 'vaso-sanitario'], ['Assentos Sanitários', 'assento-sanitario'], ['Tanques inox', 'tanque-inox']
    ], bannerIds: featuredBannerIds, brandIds: ['deca', 'roca', 'celite', 'incepa', 'docol', 'tramontina'] },
    { id: 'banho-aquecimento', sourceLabel: 'Banho e aquecimento de água', label: 'Banho e Aquecimento', children: [
      { label: 'Chuveiro', children: ['Chuveiro Elétrico', 'Chuveiro Eletrônico', 'Chuveiro Híbrido', 'Resistência Elétrica', 'Acessórios para Chuveiro', 'Acabamento para Chuveiro'] },
      { label: 'Ducha', children: ['Ducha Higiênica', 'Ducha de Teto', 'Ducha de Parede', 'Ducha Externa'] },
      { label: 'Aquecimento de água', children: ['Aquecedor à Gás', 'Aquecedor Elétrico', 'Aquecedor de piscina', 'Aquecedor solar', 'Aquecedor para banheira'] },
      { label: 'Registro e Base', children: [] },
      { label: 'Banheira', children: ['Banheira de imersão', 'Hidromassagem', 'Banheira Spa', 'Ofurô', 'Torneira e Misturador para banheiras', 'Aquecimento para banheiras', 'Acessórios', 'Acessibilidade'] },
      { label: 'Instalação de gás', children: ['Conexões', 'Ferramentas', 'Medidor de Gás', 'Registro', 'Regulador', 'Válvula'] }
    ] },
    { id: 'argamassa-rejunte', sourceLabel: 'Argamassa e rejunte', label: 'Argamassa e Rejunte', children: [
      { label: 'Argamassa', children: ['Argamassa AC1', 'Argamassa AC2', 'Argamassa AC3', 'Argamassa piso sobre piso', 'Argamassa para Piso Cerâmico', 'Argamassa para Porcelanato', 'Argamassa autonivelante', 'Argamassa polimérica', 'Argamassa colante', 'Misturadores de argamassa'] },
      { label: 'Rejunte', children: ['Rejunte Acrílico', 'Rejunte Superfinos Premium', 'Rejunte Comum', 'Rejunte Epóxi', 'Rejunte para Porcelanatos', 'Rejunte para Piscina', 'Rejunte para banheiro'] },
      { label: 'Impermeabilização e Vedação', children: ['Impermeabilizante para telhado', 'Impermeabilizante para Laje', 'Impermeabilizante de Piso', 'Impermeabilizante de parede', 'Impermeabilizante para piscina', 'Impermeabilizante para Banheiro', 'Impermeabilização Externa', 'Impermeabilização Interna', 'Reparação'] },
      { label: 'Cimento', children: [] }, { label: 'Pós Obra', children: [] }
    ] },
    { id: 'coberturas-telhas', label: 'Coberturas e Telhas', children: simple(['Captação', 'Telhas', 'Rufos e Calhas', 'Forros', 'Impermeabilização e Vedação', 'Mantas para telhados']) },
    { id: 'eletrodomesticos', label: 'Eletrodomésticos', children: nested({ Forno: ['Forno de embutir', 'Forno à Gás', 'Forno Elétrico', 'Forno de pizza'], Fogão: ['Fogão Elétrico', 'Fogão à Gás', 'Fogão 4 bocas'], Cooktop: ['Cooktop por Indução', 'Cooktop à Gás'], 'Coifa e Depurador': [], Geladeira: [], Frigobar: [], Adega: [] }) },
    { id: 'eletroportateis', label: 'Eletroportáteis', children: simple(['Micro-ondas', 'Liquidificador', 'Processador', 'Sanduicheira', 'Airfryer', 'Triturador', 'Batedeira', 'Chaleira Elétrica', 'Panela Elétrica', 'Cafeteira']) },
    { id: 'energia-solar', label: 'Energia Solar', children: simple(['Reservatório solar', 'Placa Solar', 'Coletor Solar', 'Controlador de Carga', 'Bateria para energia solar', 'Boiler solar', 'Inversor solar']) },
    { id: 'ferragens', label: 'Ferragens', children: nested({ 'Parafuso e bucha': [], 'Suporte de fixação': [], 'Fita adesiva': [], 'Grampo e presilha': [], Dobradiça: ['Dobradiça de porta', 'Dobradiça de armário'], 'Silicone para vedação': [] }) },
    { id: 'ferramentas', label: 'Ferramentas', children: nested({ 'Ferramentas Elétricas': ['Furadeira', 'Parafusadeira', 'Serra Mármore', 'Soprador Térmico', 'Serra de Esquadria', 'Pulverizador', 'Misturador de Argamassa', 'Ferramentas para Solda', 'Esmerilhadeira', 'Lixadeira', 'Lavadora de Alta Pressão', 'Aspirador de Pó', 'Serra elétrica', 'Níveis à Laser', 'Cortador de Piso Elétrico'], 'Ferramentas Manuais': ['Jogo de Ferramentas', 'Chaves', 'Martelo', 'Alicate', 'Cortador de Piso', 'Ventosa', 'Serra manual', 'Ferramentas de Medição', 'Ferramentas para Jardim', 'Ferramentas para Pintura', 'Equipamentos para Solda', 'Instalação Elétrica', 'Instalação Hidráulica', 'Instalação de Revestimentos', 'Equipamentos para Limpeza'] }) },
    { id: 'iluminacao', label: 'Iluminação', children: nested({ Luminária: ['Luminária de piso', 'Luminária de parede', 'Luminária Tartaruga', 'Luminária para área interna', 'Luminária para Piscina'], Lâmpada: ['Kits de Lâmpada', 'Lâmpada Filamento', 'Lâmpada LED', 'Lâmpada Fluorescente', 'Lâmpada Halógena', 'Lâmpada Incandescente', 'Lâmpada Bolinha', 'Lâmpada Bulbo', 'Lâmpada Dicroica', 'Lâmpada Espiral', 'Lâmpada Vela', 'Lâmpada industrial', 'Lâmpada Globe', 'Lâmpada Inteligente', 'Lâmpada Tubular'], 'Fitas de Led': [], 'Luzes de Emergência': [], 'Painéis e Plafons': ['Painel de Sobrepor', 'Painel de Embutir', 'Painel Inteligente'], 'Spots e Trilhos': ['Spot de Embutir', 'Spot de Sobrepor', 'Trilho de Spots', 'Spot para Trilho'], Pendentes: ['Pendente para cozinha', 'Pendente para sala de estar', 'Pendente para sala de jantar'], Arandelas: ['Arandela de parede', 'Arandela articulada', 'Arandela solar'], Balizador: [], Refletor: [] }) },
    { id: 'lazer', label: 'Lazer', children: nested({ Churrasqueiras: ['Churrasqueira à Gás', 'Churrasqueira Elétrica', 'Churrasqueira à Carvão', 'Acessórios para Churrasqueira'], 'Decoração para jardim': [], 'Guarda Sol': [], 'Cadeira para área externa': [], Piscina: ['Piscina Inflável', 'Cascata para piscina', 'Limpeza de Piscinas', 'Filtro de piscina'], 'Acessórios de Jardim': [], 'Acessórios para Limpeza': [] }) },
    { id: 'materiais-eletricos', label: 'Materiais Elétricos', children: nested({ 'Fios e Cabos Elétricos': ['Fios elétricos', 'Cabo Flexível'], 'Cordão Paralelo': [], 'Cordão PP': [], 'Quadro e Caixa de Passagem': [], 'Tubos, Eletrodutos e Conduítes': ['Eletrodutos', 'Conduítes para Paredes', 'Conduítes para Lajes', 'Tubos Rígidos'], 'Tomada e Interruptor': [], 'Acessórios de Iluminação': [], Disjuntor: [], 'Nobreaks e Estabilizador': [], Extensão: [], Gerador: [], 'Medição de Energia e Relógio': [] }) },
    { id: 'materiais-hidraulicos', sourceLabel: 'Materiais hidraulicos', label: 'Materiais Hidráulicos', children: nested({ 'Bombas e Pressurizadores': [], Sifões: [], 'Anel de Vedação': [], 'Veda Rosca': [], 'Limpadores PVC': [], 'Pasta Lubrificante': [], 'Filtros e Purificadores': ['Filtro de piscina'], 'Tubos, Canos e Conexões hidráulicas': ['Tubo Água Fria Roscável', 'Tubo Água Fria Soldável', 'Tubo Água Quente', 'Tubo Captação Fluvial'], Esgoto: ['Acessórios', 'Biodigestores', 'Canos de Esgoto', 'Conexões', 'Caixas de Gordura', 'Caixas de Passagem', 'Ralos para esgoto', 'Tubo de Esgoto'], 'Caixas, Ralos e Grelhas': ['Caixas de Gordura', 'Caixas de Inspeção', 'Caixa Sifonada', 'Ralos', 'Grelhas'], 'Colas e Adesivos': [], 'Medição de Água e Relógio': [], Reservatórios: ['Acessórios para Caixas d\'água e Reservatórios', 'Tanques de água', 'Caixas d\'água', 'Reservatórios', 'Biodigestores', 'Cisternas', 'Captação', 'Instalação'] }) },
    { id: 'moveis-decoracao', sourceLabel: 'Móveis e decoração', label: 'Móveis e Decoração', children: nested({ 'Móveis para Área Externa': [], Cadeira: [], Mesa: [], 'Móveis para Banheiro': ['Gabinete para Banheiro', 'Gabinete com cuba e espelho', 'Espelheira para Banheiro', 'Bancada de Banheiro'], 'Móveis para Cozinha': ['Cozinha Completa', 'Cozinha Modular', 'Armário Aéreo', 'Balcão de cozinha'], 'Móveis para Piscina': [], 'Móveis Infantis': [], 'Móveis para quarto': [], 'Móveis para salas de jantar': [], 'Móveis para salas de estar': [], 'Móveis para escritório': [], Espelhos: [] }) },
    { id: 'portas-janelas', sourceLabel: 'Porta e janela', label: 'Portas e Janelas', children: nested({ Porta: ['Porta Pivotante', 'Porta de correr', 'Porta sanfonada', 'Porta de giro', 'Porta de madeira', 'Porta de aço', 'Porta de alumínio'], Portão: [], Janela: ['Janela de correr', 'Janela guilhotina', 'Janela basculante', 'Janela de alumínio', 'Janela veneziana'], Fechadura: ['Fechadura Inteligente', 'Fechadura eletrônica', 'Fechadura tetra'], Dobradiça: ['Dobradiça de porta'], 'Equipamentos para Instalação': [] }) },
    { id: 'seguranca-comunicacao', label: 'Segurança e Comunicação', children: nested({ Instalação: [], 'Casa Inteligente': [], Portão: [], 'Automação residencial': [], 'Câmera de segurança': [], 'Gravador e CFTV': [], 'Campainha sem fio': [], Concertina: [], Interfone: ['Interfone sem fio', 'Interfone com câmera'], 'Sensor de Presença': [], 'Proteção Infantil': [], Alarme: [] }) },
    { id: 'tinta', label: 'Tinta', children: nested({ 'Tinta para piso': ['Tinta epóxi para piso', 'Tinta para piso cerâmico', 'Tinta para piso cimento queimado', 'Tinta para piso externo'], 'Tinta para parede': ['Tinta para parede interna', 'Tinta para parede externa', 'Tinta emborrachada para parede'], 'Tinta em spray': [], 'Tinta acrílica': [], 'Tinta para ferro': [], 'Tinta para azulejo': [], 'Tinta impermeabilizante': [], Verniz: [], Esmalte: [], 'Pré Pintura': [], Solvente: [], 'Cola e Adesivo': [], 'Ferramentas para Pintura': [], 'Acessórios para Pintura': [] }) },
    { id: 'utilidades-domesticas', label: 'Utilidades Domésticas', children: nested({ 'Área de Serviço': [], Varal: [], 'Limpeza e Organização': [], Lixeiras: ['Lixeira para banheiro', 'Lixeira para cozinha', 'Lixeira para quarto'], 'Utilidades para Cozinha': [], 'Talheres e Acessórios': [], Panelas: ['Panela de pressão', 'Panela elétrica'], 'Jogos de mesa': [] }) }
  ];

  // Additional levels exposed by the ABC catalog. Keep a single shared tree
  // behind departmental lists and featured shortcuts.
  const porcelainFormats = {
    'Porcelanato Acetinado': ['Convencionais retificados', 'Grandes formatos retificados', 'Super formatos retificados'],
    'Porcelanato Decorado': ['Formatos convencionais'],
    'Porcelanato Externo': ['Convencionais bold', 'Convencionais retificados', 'Grandes formatos retificados'],
    'Porcelanato madeira': ['Réguas acetinadas', 'Réguas externas'],
    'Porcelanato Natural': ['Super formatos retificados'],
    'Porcelanato Polido': ['Convencionais retificados', 'Grandes formatos retificados', 'Super formatos retificados'],
    'Porcelanato técnico': ['Técnicos naturais', 'Técnicos polidos']
  };
  const porcelainIcons = { 'Porcelanato Acetinado': 'porcelanato-acetinado', 'Porcelanato Decorado': 'porcelanato-decorado', 'Porcelanato Externo': 'porcelanato-externo', 'Porcelanato madeira': 'porcelanato-madeira', 'Porcelanato Natural': 'porcelanato-natural', 'Porcelanato Polido': 'porcelanato-polido', 'Porcelanato técnico': 'porcelanato-tecnico' };
  const porcelain = departments[0].children.find(node => node.label === 'Porcelanato');
  porcelain.children = porcelain.children.map(label => ({ label, children: (porcelainFormats[label] || []).map(format => ({ label: format, iconId: porcelainIcons[label], children: [] })) }));
  const bathroomMetals = departments.find(item => item.id === 'metais').children.find(node => node.label === 'Metais para Banheiro');
  bathroomMetals.children = bathroomMetals.children.map(label => label === 'Acessórios para Banheiro' ? { label, children: ['Porta Toalha e Toalheiros', 'Saboneteiras', 'Prateleiras para Banheiro', 'Cabides para Banheiro', 'Papeleiras para Banheiro', 'Lixeiras para Banheiro'] } : label);

  // Shared preview campaigns until each department has its own promotion data.
  departments.forEach(item => {
    item.bannerIds = item.bannerIds || [...featuredBannerIds];
    item.moreUrl = item.moreUrl ?? null;
  });

  const departmentBrands = {
    'banho-aquecimento': ['lorenzetti', 'komeco', 'docol', 'deca'],
    'argamassa-rejunte': ['quartzolit'],
    'energia-solar': ['komeco'],
    'ferramentas': ['tramontina'],
    'materiais-hidraulicos': ['acqualimp', 'lorenzetti'],
    'tinta': ['coral', 'quartzolit'],
    'utilidades-domesticas': ['tramontina', 'brinox']
  };
  departments.forEach(item => { if (departmentBrands[item.id]) item.brandIds = departmentBrands[item.id]; });

  function simple(labels) { return labels.map(label => ({ label, children: [] })); }
  function nested(map) { return Object.entries(map).map(([label, children]) => ({ label, children })); }

  const principal = {
    id: 'principais-categorias', label: 'Principais Categorias', iconId: 'principais-categorias', moreUrl: null,
    featured: [
      ['Porcelanato', 'porcelanato'], ['Piso Vinílico', 'piso-vinilico'], ['Torneiras para banheiro', 'torneira-banheiro'], ['Torneiras para cozinha', 'torneira-cozinha'],
      ['Vaso Sanitário', 'vaso-sanitario'], ['Cubas para Banheiro', 'cuba-banheiro'], ['Chuveiro', 'chuveiro'], ['Tinta para parede', 'tinta']
    ],
    brandIds: ['docol', 'deca', 'roca', 'celite', 'tramontina', 'lorenzetti', 'coral', 'fani', 'quartzolit', 'acqualimp', 'komeco', 'biancogres', 'brinox', 'portobello', 'ceusa', 'eliane', 'elizabeth', 'incepa', 'portinari']
  };

  const environmentCopy = {
    banheiro: { heading: 'Um cuidado a mais com você.', subtitle: 'Do banho à bancada, escolhas que facilitam o dia.', imagePosition: '50% 68%' },
    cozinha: { heading: 'Onde as boas receitas começam.', subtitle: 'Praticidade para cozinhar e espaço para compartilhar.', imagePosition: '50% 64%' },
    'sala-estar': { heading: 'Pode entrar. Fique à vontade.', subtitle: 'Luz, cores e texturas para uma sala com a sua cara.', imagePosition: '50% 68%' },
    'sala-jantar': { heading: 'A conversa continua à mesa.', subtitle: 'Um lugar gostoso para reunir quem você gosta.', imagePosition: '50% 66%' },
    quarto: { heading: 'Seu descanso merece esse carinho.', subtitle: 'Detalhes que ajudam a desacelerar no fim do dia.', imagePosition: '50% 68%' },
    escritorio: { heading: 'Abra espaço para suas ideias.', subtitle: 'Conforto e organização para trabalhar no seu ritmo.', imagePosition: '50% 65%' },
    'area-externa': { heading: 'Aproveite a casa do lado de fora.', subtitle: 'Do jardim ao churrasco, mais motivos para ficar.', imagePosition: '50% 64%' },
    piscina: { heading: 'O próximo mergulho é aqui.', subtitle: 'Prepare seu cantinho de sol para os dias de lazer.', imagePosition: '50% 70%' }
  };

  const environments = [
    ['banheiro', 'Banheiro', ['Acabamento para banheiro', 'Acessórios para Vasos Sanitários', 'Aquecedor de água', 'Assento sanitário', 'Azulejo para banheiro', 'Banheira', 'Chuveiros', 'Ducha fria', 'Ducha Higiênica', 'Grelhas', 'Impermeabilizante para banheiro', 'Lixeiras para Banheiro', 'Metais para Banheiro', 'Móveis para Banheiro', 'Pastilha para banheiro', 'Pias para Banheiro', 'Piso para banheiro', 'Ralos', 'Resistência de chuveiro', 'Revestimento para banheiro', 'Sifões', 'Vaso sanitário']],
    ['cozinha', 'Cozinha', ['Azulejo para cozinha', 'Caixas de Gordura', 'Coifa para cozinha', 'Cozinha Completa', 'Cubas inox para cozinha', 'Eletrodomésticos para cozinha', 'Eletroportáteis para cozinha', 'Filtros e Purificadores', 'Fogão', 'Forno', 'Geladeira', 'Grelhas', 'Luminária para cozinha', 'Móveis para Cozinha', 'Pendente para cozinha', 'Pias e Cubas para Cozinha', 'Pisos para cozinha', 'Ralos', 'Sifões', 'Torneiras para cozinha', 'Tubos, Canos e Conexões hidráulicas', 'Utilidades para Cozinha']],
    ['sala-estar', 'Sala de estar', ['Espelho para sala de estar', 'Luminária para sala de estar', 'Móveis para sala de estar', 'Pendente para sala de estar', 'Piso para sala', 'Revestimento para parede sala', 'Tintas para sala de estar']],
    ['sala-jantar', 'Sala de jantar', ['Cadeiras para sala de jantar', 'Espelho para sala de jantar', 'Jogos de mesa para sala de jantar', 'Luminária para sala de jantar', 'Mesas para sala de jantar', 'Móveis para sala de jantar', 'Pendente sala de jantar', 'Piso para sala de jantar', 'Talheres para jantar', 'Tinta para sala de jantar']],
    ['quarto', 'Quarto', ['Iluminação para quarto', 'Lixeira para quarto', 'Móveis para quarto', 'Piso de madeira para quarto', 'Piso para quarto', 'Quarto Infantil', 'Quarto inteligente', 'Revestimento para quarto', 'Tintas para quarto', 'Tintas para quarto infantil']],
    ['escritorio', 'Escritório', ['Cadeira de escritório', 'Frigobar para escritório', 'Iluminação para escritório', 'Mesa de escritório', 'Nobreaks e Estabilizadores']],
    ['area-externa', 'Área externa', ['Acessórios de Jardim', 'Acessórios para Caixas d\'água e Reservatórios', 'Bombas e Pressurizadores', 'Cadeira para área externa', 'Caixas d\'água', 'Captação', 'Churrasqueira', 'Churrasqueiras Elétricas', 'Churrasqueiras à Carvão', 'Churrasqueiras à Gás', 'Cisternas', 'Câmeras e Segurança', 'Ferramentas de Jardinagem', 'Iluminação externa', 'Limpeza e Organização', 'Medição de Água e Relógio', 'Mesa para área externa', 'Móveis para Área Externa', 'Reservatórios', 'Revestimentos para Área Externa', 'Tanques de água', 'Torneira para Área Externa', 'Tubo Captação Fluvial', 'Tubos, Canos e Conexões hidráulicas']],
    ['piscina', 'Piscina', ['Acessórios de Piscinas', 'Aquecedor de piscina', 'Bomba para piscina', 'Bordas de Piscinas', 'Cadeira para piscina', 'Cascatas', 'Duchas Externas', 'Filtro para piscina', 'Guarda Sol', 'Hidromassagem', 'Impermeabilizante para piscina', 'Limpeza de piscina', 'Luminárias para Piscina', 'Móveis para Piscina', 'Pastilhas para Piscinas', 'Pedras para piscina', 'Piscinas Infláveis', 'Piso para piscina', 'Proteção', 'Ralos de Piscinas', 'Rejunte para Piscina', 'Revestimento para piscina', 'Tubos, Canos e Conexões hidráulicas']]
  ].map(([id, label, categories]) => ({ id, label, imageId: id, moreUrl: null, ...(environmentCopy[id] || { heading: `Explore ${label}`, subtitle: 'Encontre os detalhes para transformar seu espaço.' }), categories: categories.sort((a, b) => a.localeCompare(b, 'pt-BR')), iconId: id === 'banheiro' ? 'loucas' : id === 'cozinha' ? 'metais' : 'ambientes' }));

  const navigation = [
    { id: 'departamentos', label: 'Departamentos', iconId: 'departamentos', menu: 'departments' },
    { id: 'ambientes', label: 'Ambientes', iconId: 'ambientes', menu: 'environments' },
    { id: 'metais', label: 'Metais', iconId: 'metais', menu: 'department', departmentId: 'metais' },
    { id: 'loucas', label: 'Louças', iconId: 'loucas', menu: 'department', departmentId: 'loucas-inox' },
    { id: 'pisos', label: 'Pisos e Revestimentos', iconId: 'pisos-revestimentos', menu: 'department', departmentId: 'pisos-revestimentos' },
    { id: 'cupons', label: 'Cupons', iconId: 'cupons', menu: 'link' }
  ];

  const search = {
    suggestions: ['piso', 'piscina', 'piso vinílico', 'piso laminado'],
    products: Array.from({ length: 5 }, (_, index) => ({ id: `piso-rochedo-${index + 1}`, assetId: 'piso-rochedo', name: 'Piso Cerâmico Rochedo Pierini 12,5X26Cm', price: 'R$ 9.999,99' }))
  };

  const drawerFooter = [
    { label: 'Fale com a ABC', iconId: 'whatsapp' },
    { label: 'Encontre sua loja', iconId: 'regionalizacao' },
    { label: 'Acompanhe seus pedidos', iconId: 'carrinho-mao' }
  ];
  const account = {
    name: 'Phaison',
    options: [
      { label: 'Meus pedidos', iconId: 'carrinho-mao', url: null },
      { label: 'Meus dados', iconId: 'conta', url: null },
      { label: 'Meus endereços', iconId: 'regionalizacao', url: null }
    ]
  };
  window.Menu2026Data = { assetRegistry, departments, principal, environments, navigation, search, drawerFooter, account, categoryAliases, categoryIconRules: window.Menu2026CategoryIcons.rules, catalogIconIds: window.Menu2026CategoryIcons.catalogIconIds };
})();
