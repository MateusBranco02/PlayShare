let currentPage = 0; // Página inicial
const itemsPerPage = 4; // Quantidade de álbuns exibidos por página
let tracks = [];
let currentArtistPage = 0; // Página inicial para artistas populares
const artistsPerPage = 4; // Quantidade de artistas exibidos por página
let artists = []; // Lista de artistas populares
const recommendationsCache = {}; // Cache para recomendações

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
        await fetchSpotifyData(token); // Playlists
        await fetchRecommendations(token); // Recomendações
        await fetchTopArtists(token); // Artistas populares
    } else {
        console.log('Usuário não autenticado no Spotify');
    }
}

async function fetchRecommendations(token, genre = 'pop') {

    // Usa o cache se já houver dados
    if (recommendationsCache[genre]) {
        console.log('Usando cache para recomendações');
        renderRecommendations(recommendationsCache[genre]);
        return;
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${genre}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
            }
            throw new Error('Erro ao buscar recomendações');
        }

        const data = await response.json();
        recommendationsCache[genre] = data.tracks; // Armazena no cache
        console.log('Recomendações:', data.tracks);

        // tracks = data.tracks
        renderRecommendations(data.tracks);
    } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
    }
}

function renderRecommendations(tracks) {
    const section = document.getElementById('recomendations');
    const content = section.querySelector('.section__content');
    content.innerHTML = ''; // Limpa a seção

    // Calcula o início e o fim dos álbuns a serem exibidos
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const visibleTracks = tracks.slice(start, end); // Obtém os álbuns para a página atual

    visibleTracks.forEach(track => {
        const div = document.createElement('div');
        div.className = 'recomendations b-blue';

        const albumImage = track.album.images[0]?.url || './assets/default-album.png';

        div.style.backgroundImage = `url('${albumImage}')`;

        div.innerHTML = `
            <div class="recomendations__description">
                <div class="recomendations__description--title">
                    <h3>${track.name}</h3>
                    <p>${track.artists.length} artistas</p>
                </div>
                <img src="./assets/icon/player-1.png" alt="">
            </div>
        `;
        content.appendChild(div);
    });

    updateNavigationButtons(tracks.length); // Atualiza o estado dos botões
}

// Atualiza os botões de navegação
function updateNavigationButtons(totalItems) {
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    // Desativa o botão "Anterior" na primeira página
    prevButton.disabled = currentPage === 0;

    // Desativa o botão "Próximo" na última página
    nextButton.disabled = (currentPage + 1) * itemsPerPage >= totalItems;
}

// Lida com a navegação
function changePage(offset) {
    currentPage += offset; // Atualiza a página atual
    renderRecommendations(tracks); // Re-renderiza os álbuns
}

async function fetchTopArtists(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/artists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
            }
            throw new Error('Erro ao buscar artistas populares');
        }

        const data = await response.json();
        artists = data.items; // Armazena os artistas
        console.log('Artistas populares:', data.items);
        renderArtists(artists);
    } catch (error) {
        console.error('Erro ao buscar artistas populares:', error);
    }
}

function renderArtists(artists) {
    const section = document.getElementById('artists');
    const content = section.querySelector('.section__content');
    content.innerHTML = ''; // Limpa a seção antes de adicionar novos itens

    artists.forEach(artist => {
        const div = document.createElement('div');
        div.className = 'artist';

        div.innerHTML = `
        <div class="artist__img" style="background-image: url(${artist.images[0]?.url || './assets/default-artist.png'})"></div>
        <p class="artist__name">${artist.name}</p>
    `;
        content.appendChild(div);
    });
}

function renderTopTracks(tracks) {
    const section = document.getElementById('popular-artists');
    const content = section.querySelector('.section__content');
    content.innerHTML = ''; // Limpa a seção antes de adicionar novos itens

    tracks.forEach(track => {
        const div = document.createElement('div');
        div.className = 'track';

        div.innerHTML = `
            <p>${track.name} - ${track.album.name}</p>
        `;
        content.appendChild(div);
    });
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

        await fetchRecommendations(token);
        // Renderizar playlists
        renderPlaylists(data.items);

    } catch (error) {
        console.error('Erro ao buscar playlists:', error);
    }
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
