# YouTube Downloader

Um site simples e bonito para baixar vídeos e músicas do YouTube, pronto para ser hospedado no Netlify.

## Funcionalidades

- Download de Vídeos (MP4) e Áudio (MP3)
- Seleção de qualidade (até 4K se disponível)
- Interface moderna e responsiva (Mobile First)
- Detecção automática de links do YouTube
- Utiliza a API pública do Cobalt (múltiplas instâncias para maior estabilidade)

## Como Hospedar no Netlify

1. Faça login no [Netlify](https://www.netlify.com/).
2. Arraste a pasta deste projeto para a área de "Sites".
3. Pronto! Seu site estará online em segundos.

## Configuração da API

O projeto utiliza instâncias públicas da API Cobalt. Se desejar usar sua própria instância ou adicionar outras, edite o arquivo `script.js` e modifique a constante `API_INSTANCES`.

```javascript
const API_INSTANCES = [
    'https://api.cobalt.tools', // Oficial
    'https://co.wuk.sh/api',
    'YOUR_CUSTOM_INSTANCE_URL'
];
```

## Tecnologias

- HTML5
- CSS3 (Variáveis CSS, Flexbox)
- JavaScript (Fetch API)

## Aviso Legal

Este projeto é apenas para fins educacionais. O uso de ferramentas para baixar conteúdo do YouTube deve respeitar os Termos de Serviço da plataforma e as leis de direitos autorais locais.
