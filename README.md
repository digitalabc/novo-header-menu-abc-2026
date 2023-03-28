# Projeto da empresa Auaha em para o cliente ABC da Construção, implementado no novo StoreFront da Fbits.

## 💻 Pré-requisitos

Antes de começar, verifique se você atendeu aos seguintes requisitos:

* Você instalou a versão mais recente de `<nvm / 17.8.0 >`.
* Você tem uma máquina `<Windows / Mac>`. 
* Você leu `<a documentação da Fbits / https://traycorp.readme.io/docs>`.
* Você instalou `<a ferramenta da Fbits / https://traycorp.readme.io/docs/local>`.

## 🚀 Instalando o repositório

Para instalar o repositório, siga estas etapas:

MacOS / Windows:
```
#Para adequar o nvm:
nvm use // nvm use 10.24.0

#Siga a documentação da Fbits dita acima (https://traycorp.readme.io/docs/local)
```

## ☕ Iniciando o projeto

Para startar o localhost, siga estas etapas:

> Instalar o stylus:
```
npm install stylus -g
```

> No primeiro terminal
#HTML / JS:
```
fbits.storefront --t tcs_abcda_7312cdfec71e4c14a3fab15b5bcfcba8  
```

> No segundo terminal
#Stylus:
```
stylus -w Assets/stylus/core.styl -o Assets/CSS/auaha.css 
```

> Para estilização do checkout
#Stylus:
```
stylus -w Assets/stylus/checkout.styl -o Assets/CSS/checkout/geral.css 
```

5
Recomenda-se usar 2 terminais separados para poder observar o funcionamento do projeto em tempo real.
<img width="100%" src="https://i.postimg.cc/wxbsx5w8/Captura-de-Tela-2023-01-19-a-s-15-45-37.png">


## 📝 Licença

Esse projeto está sob licença da empresa Auaha. 

[⬆ Voltar ao topo](#home)