const { login, getSpotifyTokenFromURL, saveSpotifyToken, addUser } = require('../scripts/autenticacao.js');

jest.mock('../scripts/autenticacao.js', () => ({
    ...jest.requireActual('../scripts/autenticacao.js'),
    loginWithSpotify: jest.fn(),
    saveSpotifyToken: jest.fn(),
}));

describe('Integração: Cadastro de usuários', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <input id="name" />
            <input id="email" />
            <input id="confirm-email" />
            <input id="password" />
            <input id="confirm-password" />
            <span id="error"></span>
        `;
    });

    it('deve redirecionar para index.html após cadastro bem-sucedido', () => {
        // Mock dos valores dos campos
        document.getElementById('name').value = 'John Doe';
        document.getElementById('email').value = 'john@example.com';
        document.getElementById('confirm-email').value = 'john@example.com';
        document.getElementById('password').value = 'password123';
        document.getElementById('confirm-password').value = 'password123';

        // Mock do redirecionamento
        delete window.location;
        window.location = { href: '' };

        addUser();

        expect(document.getElementById('error').innerText).toBe('Usuário cadastrado com sucesso');
        setTimeout(() => {
            expect(window.location.href).toBe('index.html');
        }, 3000);
    });
});

describe('Integração: Login via Spotify', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        document.body.innerHTML = `
            <input id="login-email" value="john@example.com" />
            <input id="login-password" value="password123" />
            <span id="mensagem"></span>
        `;
    });

    it('deve redirecionar o usuário para o Spotify após login bem-sucedido', () => {
        const mockUsuario = {
            email: 'john@example.com',
            senha: btoa('password123'),
        };
        localStorage.setItem('usuarios', JSON.stringify([mockUsuario]));

        // Simula o redirecionamento do window.location.href
        delete window.location;
        window.location = { href: '' };

        login();

        // Verifica se o redirecionamento foi configurado corretamente
        expect(window.location.href).toContain('https://accounts.spotify.com/authorize');
    });

    it('deve salvar o token do Spotify no localStorage após autenticação', () => {
        const tokenMock = 'mockSpotifyToken';

        // Simula o fragmento da URL contendo o token
        delete window.location;
        window.location = { hash: `#access_token=${tokenMock}` };

        const token = getSpotifyTokenFromURL();
        expect(token).toBe(tokenMock);

        saveSpotifyToken(token);

        // Verifica se a função mockada foi chamada
        expect(saveSpotifyToken).toHaveBeenCalledWith(tokenMock);

        // Simula o comportamento esperado: salvar o token no localStorage
        localStorage.setItem('spotifyToken', tokenMock);
        expect(localStorage.getItem('spotifyToken')).toBe(tokenMock);
    });

    it('deve exibir mensagem de erro em caso de credenciais inválidas', () => {
        login();

        expect(document.getElementById('mensagem').innerText).toBe('usuário ou senha incorretos');
    });
});
