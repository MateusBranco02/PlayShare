const { loginWithSpotify, getSpotifyTokenFromURL, saveSpotifyToken, addUser, login } = require('../scripts/autenticacao.js');
const { renderPlaylists } = require('../scripts/home.js');

describe('loginWithSpotify', () => {
    it('deve redirecionar o usuário para a URL de autenticação do Spotify', () => {
        delete window.location;
        window.location = { href: '' };

        loginWithSpotify();

        expect(window.location.href).toContain('https://accounts.spotify.com/authorize');
        expect(window.location.href).toContain('client_id=db3ce4d64a744d569fee4fdf0ce35741');
        expect(window.location.href).toContain('response_type=token');
    });
});

describe('getSpotifyTokenFromURL', () => {
    it('deve retornar o token de acesso do fragmento da URL', () => {
        delete window.location;
        window.location = { hash: '#access_token=mockToken&token_type=Bearer' };

        const token = getSpotifyTokenFromURL();
        expect(token).toBe('mockToken');
    });

    it('deve retornar null se o token de acesso não estiver presente', () => {
        delete window.location;
        window.location = { hash: '' };

        const token = getSpotifyTokenFromURL();
        expect(token).toBeNull();
    });
});

describe('saveSpotifyToken', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('deve salvar o token no localStorage', () => {
        saveSpotifyToken('mockToken');

        expect(localStorage.getItem('spotifyToken')).toBe('mockToken');
    });
});

describe('addUser', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <input id="name" value="John Doe" />
            <input id="email" value="john@example.com" />
            <input id="confirm-email" value="john@example.com" />
            <input id="password" value="password123" />
            <input id="confirm-password" value="password123" />
            <span id="error"></span>
        `;
    });

    it('deve adicionar um novo usuário ao localStorage', () => {
        addUser();

        const usuarios = JSON.parse(localStorage.getItem('usuarios'));
        expect(usuarios).toHaveLength(1);
        expect(usuarios[0].email).toBe('john@example.com');
    });

    it('deve exibir erro se os e-mails não coincidirem', () => {
        document.getElementById('confirm-email').value = 'different@example.com';
        addUser();

        expect(document.getElementById('error').innerText).toBe('Os emails são diferentes');
    });

    it('deve exibir erro se as senhas não coincidirem', () => {
        document.getElementById('confirm-password').value = 'differentPassword';
        addUser();

        expect(document.getElementById('error').innerText).toBe('As senhas são diferentes');
    });

    it('deve exibir erro se o e-mail já estiver cadastrado', () => {
        localStorage.setItem(
            'usuarios',
            JSON.stringify([{ email: 'john@example.com' }])
        );
        addUser();

        expect(document.getElementById('error').innerText).toBe('Usuário já cadastrado');
    });
});

describe('login', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        document.body.innerHTML = `
            <input id="login-email" />
            <input id="login-password" />
            <span id="mensagem"></span>
        `;
    });

    it('deve autenticar o usuário e salvar no sessionStorage', () => {
        const mockUsuario = {
            email: 'john@example.com',
            senha: btoa('password123'),
        };
        localStorage.setItem('usuarios', JSON.stringify([mockUsuario]));

        document.getElementById('login-email').value = 'john@example.com';
        document.getElementById('login-password').value = 'password123';

        login();

        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
        expect(usuarioLogado.email).toBe('john@example.com');
    });

    it('deve exibir mensagem de erro se o e-mail ou senha estiverem incorretos', () => {
        login();

        expect(document.getElementById('mensagem').innerText).toBe('usuário ou senha incorretos');
    });
});

describe('renderPlaylists', () => {
    beforeEach(() => {
        // Configura um DOM fictício para o teste
        document.body.innerHTML = `
            <section id="playlists">
                <div class="section__content"></div>
            </section>
        `;
    });

    test('deve renderizar corretamente as playlists fornecidas', () => {
        const mockPlaylists = [
            {
                id: '1',
                name: 'Top Hits',
                images: [{ url: 'https://example.com/image1.jpg' }]
            },
            {
                id: '2',
                name: 'Chill Vibes',
                images: [{ url: 'https://example.com/image2.jpg' }]
            }
        ];

        renderPlaylists(mockPlaylists);

        const sectionContent = document.querySelector('.section__content');
        const playlistsRendered = sectionContent.querySelectorAll('.playlist');

        // Verifica se a quantidade de playlists renderizadas está correta
        expect(playlistsRendered.length).toBe(mockPlaylists.length);

        // Verifica o conteúdo da primeira playlist
        const firstPlaylist = playlistsRendered[0];
        expect(firstPlaylist.querySelector('.artist__name').textContent).toBe(mockPlaylists[0].name);
        expect(firstPlaylist.querySelector('img').src).toBe(mockPlaylists[0].images[0].url);

        // Verifica o conteúdo da segunda playlist
        const secondPlaylist = playlistsRendered[1];
        expect(secondPlaylist.querySelector('.artist__name').textContent).toBe(mockPlaylists[1].name);
        expect(secondPlaylist.querySelector('img').src).toBe(mockPlaylists[1].images[0].url);
    });
});
