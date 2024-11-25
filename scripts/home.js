let currentPage = 0; // Página inicial
const itemsPerPage = 4; // Quantidade de álbuns exibidos por página
let featuredPlaylists = []; // Lista de playlists em destaque
let currentRecentlyPlayedPage = 0; // Página inicial
const recentlyPlayedPerPage = 4; // Quantidade de músicas exibidas por página
let recentlyPlayedTracks = []; // Lista de músicas tocadas recentemente

//funcao vai na pagina inicial
function verificaUsuario() {
    let usuarioLogado = sessionStorage.getItem('usuarioLogado')

    if (!usuarioLogado) {
        console.log("usuario nao logado")
        window.location.href = 'index.html'
    }
}

window.onload = async function () {
    verificaUsuario()

    const token = getSpotifyTokenFromURL() || localStorage.getItem('spotifyToken');

    if (token) {
        saveSpotifyToken(token);
        await fetchSpotifyData(token); // Playlists do usuário
        await fetchFeaturedPlaylists(token); // Playlists em destaque
        await fetchRecentlyPlayed(token); //  Músicas tocadas recentemente
    } else {
        console.log('Usuário não autenticado no Spotify');
    }
}

async function fetchSpotifyData(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao buscar dados do Spotify');

        const data = await response.json();
        console.log('Playlists:', data.items);

        // Renderizar playlists
        renderPlaylists(data.items);

    } catch (error) {
        console.error('Erro ao buscar playlists:', error);
        throw error;
    }
}

async function fetchFeaturedPlaylists(token) {
    try {
        const response = await fetch("https://api.spotify.com/v1/browse/featured-playlists", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Limite de requisições excedido. Tente novamente mais tarde.");
            }
            throw new Error("Erro ao buscar playlists em destaque.");
        }

        const data = await response.json();

        featuredPlaylists = data.playlists.items; // Armazena as playlists em destaque

        renderFeaturedPlaylists(featuredPlaylists); // Renderiza a primeira página
    } catch (error) {
        console.error("Erro ao buscar playlists em destaque:", error);
        throw error;
    }
}

function renderFeaturedPlaylists(playlists) {
    const section = document.getElementById("recomendations");
    const content = section.querySelector(".section__content");
    content.innerHTML = ""; // Limpa o conteúdo anterior

    // Calcula os índices das playlists a serem exibidas na página atual
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const visiblePlaylists = featuredPlaylists.slice(start, end); // Obtém as playlists visíveis

    visiblePlaylists.forEach(playlist => {
        const div = document.createElement("div");
        div.className = "recomendations b-blue";

        const playlistImage = playlist.images[0]?.url || "./assets/default-playlist.png";

        div.style.backgroundImage = `url('${playlistImage}')`;

        div.innerHTML = `
            <div class="recomendations__description">
                <h3>${playlist.name}</h3>
                <p>${playlist.tracks.total} músicas</p>
            </div>
        `;

        // Adiciona um evento para abrir a playlist no Spotify
        div.addEventListener("click", () => {
            window.open(playlist.external_urls.spotify, "_blank");
        });

        content.appendChild(div);
    });

    updateNavigationButtons(featuredPlaylists.length); // Atualiza os botões de navegação
}

// Atualiza os botões de navegação
function updateNavigationButtons(totalItems) {
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    if (prevButton && nextButton) {
        // Desativa o botão "Anterior" na primeira página
        prevButton.disabled = currentPage === 0;

        // Desativa o botão "Próximo" na última página
        nextButton.disabled = (currentPage + 1) * itemsPerPage >= totalItems;
    }
}

// Lida com a navegação
function changePage(offset) {
    currentPage += offset; // Atualiza a página atual
    renderFeaturedPlaylists(); // Re-renderiza os álbuns
}

async function fetchRecentlyPlayed(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
            }
            throw new Error('Erro ao buscar músicas tocadas recentemente');
        }

        const data = await response.json();
        console.log('Músicas tocadas recentemente:', data.items);

        recentlyPlayedTracks = data.items; // Armazena as músicas tocadas recentemente
        renderRecentlyPlayed(recentlyPlayedTracks); // Renderiza a primeira página
    } catch (error) {
        console.error('Erro ao buscar músicas tocadas recentemente:', error);
        throw error;
    }
}

function renderRecentlyPlayed(tracks) {
    const section = document.getElementById('populares');
    const content = section.querySelector('.section__content');
    content.innerHTML = ''; // Limpa o conteúdo anterior

    // Calcula os índices das músicas a serem exibidas na página atual
    const start = currentRecentlyPlayedPage * recentlyPlayedPerPage;
    const end = start + recentlyPlayedPerPage;
    const visibleTracks = tracks.slice(start, end); // Obtém as músicas visíveis

    visibleTracks.forEach(item => {
        const track = item.track; // Informações da música
        const div = document.createElement('div');
        div.className = 'recentes';

        div.innerHTML = `
            <div class="artist__img" style="background-image: url(${track.album.images[0]?.url || './assets/default-track.png'})"></div>
            <p class="artist__name">${track.name}</p>
            <p class="artist__name">${track.artists.map(artist => artist.name).join(', ')}</p>
        `;

        content.appendChild(div);
    });

    updateRecentlyPlayedNavigation(tracks.length); // Atualiza os botões de navegação
}

function updateRecentlyPlayedNavigation(totalItems) {
    const prevButton = document.getElementById('recent-prev');
    const nextButton = document.getElementById('recent-next');

    if (prevButton && nextButton) {
        // Desativa o botão "Anterior" na primeira página
        prevButton.disabled = currentRecentlyPlayedPage === 0;

        // Desativa o botão "Próximo" na última página
        nextButton.disabled = (currentRecentlyPlayedPage + 1) * recentlyPlayedPerPage >= totalItems;
    }
}

function changeRecentlyPlayedPage(offset) {
    currentRecentlyPlayedPage += offset; // Atualiza a página atual
    renderRecentlyPlayed(recentlyPlayedTracks); // Re-renderiza as músicas
}

function renderPlaylists(playlists) {
    const section = document.getElementById('playlists');
    const content = section.querySelector('.section__content');
    content.innerHTML = ''; // Limpa a seção antes de adicionar novos itens

    playlists.forEach(playlist => {
        const div = document.createElement('div');
        div.className = 'playlist';

        div.innerHTML = `
        <div class="playlist__img">
            <img src="${playlist.images[0]?.url || './assets/default-playlist.png'}" alt="${playlist.name}" />
        </div>
        <p class="artist__name">${playlist.name}</p>
    `;
        div.addEventListener('click', () => fetchPlaylistTracks(playlist.id));
        content.appendChild(div);
    });
}

async function fetchPlaylistTracks(playlistId, token) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao buscar músicas da playlist');

        const data = await response.json();
        console.log(`Músicas da playlist ${playlistId}:`, data.items);

        renderPlaylistTracks(data.items);
    } catch (error) {
        console.error('Erro ao buscar músicas da playlist:', error);
    }
}

function renderPlaylistTracks(tracks) {
    const section = document.getElementById('playlist-tracks');
    const content = section.querySelector('.section__content');
    content.innerHTML = ''; // Limpa a seção antes de adicionar novos itens

    tracks.forEach(track => {
        const div = document.createElement('div');
        div.className = 'track';

        div.innerHTML = `
        <p>${track.track.name} - ${track.track.artists.map(artist => artist.name).join(', ')}</p>
    `;
        content.appendChild(div);
    });
}

// Adicionar evento de clique nas playlists
document.addEventListener('click', function (event) {
    if (event.target.closest('.playlist')) {
        const playlistId = event.target.closest('.playlist').dataset.id;
        const token = localStorage.getItem('spotifyToken');
        fetchPlaylistTracks(playlistId, token);
    }
});

module.exports = { fetchSpotifyData, fetchFeaturedPlaylists, fetchRecentlyPlayed, renderFeaturedPlaylists, renderRecentlyPlayed, renderPlaylists };