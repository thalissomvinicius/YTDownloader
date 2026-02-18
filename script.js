document.addEventListener('DOMContentLoaded', () => {
    const videoUrlInput = document.getElementById('videoUrl');
    const pasteBtn = document.getElementById('pasteBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatSelect = document.getElementById('format');
    const qualitySelect = document.getElementById('quality');
    const qualityGroup = document.getElementById('qualityGroup');
    const bitrateSelect = document.getElementById('bitrate');
    const bitrateGroup = document.getElementById('bitrateGroup');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    const thumbImg = document.getElementById('thumb');
    const videoTitle = document.getElementById('videoTitle');
    const videoAuthor = document.getElementById('videoAuthor');
    const downloadLink = document.getElementById('downloadLink');
    const downloadMeta = document.getElementById('downloadMeta');
    const fileSizeEl = document.getElementById('fileSize');
    const downloadSpeedEl = document.getElementById('downloadSpeed');
    const progressFill = document.getElementById('progressFill');
    const downloadAnotherBtn = document.getElementById('downloadAnother');

    // Lista de instâncias da API Cobalt (Oficiais e da Comunidade)
    // Ordenadas por estabilidade. O script tenta uma por uma até conseguir.
    const API_INSTANCES = [
        'https://co.wuk.sh/api',
        'https://cobalt.chip.lol/api',
        'https://dl.lp1.eu/api',
        'https://api.cobalt.adryd.com/api',
        'https://cobalt.place/api',
        'https://api.cobalt.kwiatekmiki.pl/api',
        'https://api.cobalt.tools' // Oficial (pode ter rate limit)
    ];

    formatSelect.addEventListener('change', () => {
        if (formatSelect.value === 'mp3') {
            qualityGroup.style.opacity = '0.5';
            qualitySelect.disabled = true;
            bitrateGroup.style.opacity = '1';
            bitrateSelect.disabled = false;
        } else {
            qualityGroup.style.opacity = '1';
            qualitySelect.disabled = false;
            bitrateGroup.style.opacity = '0.5';
            bitrateSelect.disabled = true;
        }
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            videoUrlInput.value = text;
        } catch (err) {
            console.error('Falha ao colar:', err);
            showStatus('Permissão de colagem negada ou não suportada.', 'error');
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const url = videoUrlInput.value.trim();
        
        if (!url) {
            showStatus('Por favor, insira um link do YouTube.', 'error');
            return;
        }

        if (!isValidUrl(url)) {
            showStatus('Por favor, insira um link válido.', 'error');
            return;
        }

        showStatus('Processando... Isso pode levar alguns segundos.', 'loading');
        resultDiv.classList.add('hidden');
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';

        try {
            const [data, meta] = await Promise.all([
                fetchDownloadLink(url),
                fetchVideoMeta(url)
            ]);
            
            if (data && (data.url || data.picker)) {
                showResult(data, url, meta);
                showStatus('', 'hidden');
            } else {
                throw new Error('Falha ao obter link de download.');
            }
        } catch (error) {
            console.error(error);
            showStatus('Erro ao processar o vídeo. Tente novamente ou verifique o link. <br><small>' + error.message + '</small>', 'error');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<span>Baixar Agora</span><i class="fa-solid fa-download"></i>';
        }
    });

    let currentDownload = null;

    downloadAnotherBtn.addEventListener('click', () => {
        resultDiv.classList.add('hidden');
        videoUrlInput.value = '';
        showStatus('', 'hidden');
        videoUrlInput.focus();
    });

    downloadLink.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!currentDownload) {
            return;
        }
        await startDownload(currentDownload.url, currentDownload.fileName);
    });

    async function fetchDownloadLink(url) {
        const format = formatSelect.value;
        const quality = qualitySelect.value;
        
        const payload = {
            url: url,
            videoQuality: quality,
            audioFormat: "mp3",
            filenameStyle: "basic"
        };

        if (format === 'mp3') {
            payload.downloadMode = "audio";
            payload.audioBitrate = bitrateSelect.value;
        }

        for (let i = 0; i < API_INSTANCES.length; i++) {
            const apiBase = API_INSTANCES[i];
            try {
                const response = await fetch(`${apiBase}/json`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.status === 'error') {
                    throw new Error(data.text || 'Erro na API');
                }

                if (data.url || data.picker) {
                    return data;
                }
            } catch (e) {
            }
        }
        
        throw new Error('Todas as instâncias da API falharam. Tente mais tarde.');
    }

    async function fetchVideoMeta(url) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (_) {
            return null;
        }
    }

    function showResult(data, originalUrl, meta) {
        const videoId = getVideoId(originalUrl);
        if (meta && meta.thumbnail_url) {
            thumbImg.src = meta.thumbnail_url;
        } else if (videoId) {
            thumbImg.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        } else {
            thumbImg.src = 'https://via.placeholder.com/120x90?text=Video';
        }

        const formatLabel = formatSelect.value === 'mp3' ? 'Áudio MP3' : 'Vídeo MP4';
        const baseTitle = meta && meta.title ? meta.title : data.filename || 'Download Pronto';
        const safeTitle = sanitizeFilename(baseTitle);
        const fileExtension = formatSelect.value === 'mp3' ? '.mp3' : '.mp4';
        const fileName = safeTitle ? `${safeTitle}${fileExtension}` : `download${fileExtension}`;

        videoTitle.textContent = baseTitle;
        videoAuthor.textContent = meta && meta.author_name ? `${meta.author_name} • ${formatLabel}` : formatLabel;

        if (data.url) {
            downloadLink.href = data.url;
            downloadLink.style.display = 'flex';
        } else if (data.picker) {
            if (data.picker.length > 0) {
                downloadLink.href = data.picker[0].url;
            } else {
                throw new Error('Nenhum link direto encontrado.');
            }
        }

        downloadLink.setAttribute('download', fileName);
        downloadMeta.classList.remove('hidden');
        fileSizeEl.textContent = 'Tamanho: --';
        downloadSpeedEl.textContent = 'Velocidade: --';
        progressFill.style.width = '0%';
        downloadLink.classList.remove('disabled');
        downloadLink.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Salvar Arquivo';
        currentDownload = { url: downloadLink.href, fileName };
        tryFetchSize(downloadLink.href);
        resultDiv.classList.remove('hidden');
    }

    function showStatus(msg, type) {
        if (type === 'hidden') {
            statusDiv.classList.add('hidden');
            return;
        }
        statusDiv.innerHTML = msg;
        statusDiv.className = 'status-message ' + type;
        statusDiv.classList.remove('hidden');
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return string.includes('youtube.com') || string.includes('youtu.be');
        } catch (_) {
            return false;
        }
    }

    function getVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
    }

    async function tryFetchSize(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const size = response.headers.get('content-length');
            if (size) {
                fileSizeEl.textContent = `Tamanho: ${formatBytes(Number(size))}`;
            }
        } catch (_) {
        }
    }

    async function startDownload(url, fileName) {
        downloadLink.classList.add('disabled');
        downloadLink.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Baixando...';
        downloadSpeedEl.textContent = 'Velocidade: --';
        try {
            const response = await fetch(url);
            if (!response.ok || !response.body) {
                throw new Error('stream_unavailable');
            }
            const total = Number(response.headers.get('content-length')) || 0;
            if (total > 0) {
                fileSizeEl.textContent = `Tamanho: ${formatBytes(total)}`;
            }
            const reader = response.body.getReader();
            const chunks = [];
            let received = 0;
            const startTime = performance.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                chunks.push(value);
                received += value.length;
                if (total > 0) {
                    const percent = Math.min(100, Math.round((received / total) * 100));
                    progressFill.style.width = `${percent}%`;
                }
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed > 0.2) {
                    const speed = received / elapsed;
                    downloadSpeedEl.textContent = `Velocidade: ${formatBytes(speed)}/s`;
                }
                if (total === 0) {
                    fileSizeEl.textContent = `Baixado: ${formatBytes(received)}`;
                }
            }

            const blob = new Blob(chunks);
            const blobUrl = URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.download = fileName;
            document.body.appendChild(tempLink);
            tempLink.click();
            tempLink.remove();
            URL.revokeObjectURL(blobUrl);
            progressFill.style.width = '100%';
            downloadSpeedEl.textContent = 'Velocidade: concluído';
        } catch (_) {
            window.open(url, '_blank');
            showStatus('Seu download abriu em nova aba. Se não iniciar, tente novamente.', 'loading');
        } finally {
            downloadLink.classList.remove('disabled');
            downloadLink.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Salvar Arquivo';
        }
    }

    function formatBytes(bytes) {
        if (!bytes || bytes <= 0) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB'];
        const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
        const value = bytes / Math.pow(1024, index);
        return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
    }

    if (formatSelect.value === 'mp3') {
        qualityGroup.style.opacity = '0.5';
        qualitySelect.disabled = true;
        bitrateGroup.style.opacity = '1';
        bitrateSelect.disabled = false;
    } else {
        bitrateGroup.style.opacity = '0.5';
        bitrateSelect.disabled = true;
    }
});
