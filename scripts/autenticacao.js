const clientId = 'db3ce4d64a744d569fee4fdf0ce35741';
const redirectUri = 'http://127.0.0.1:5500/home.html';
const authEndPoint = 'https://accounts.spotify.com/authorize';
const responseType = 'token';

function loginWithSpotify() {
    const scopes = encodeURIComponent('user-read-private user-read-email playlist-read-private user-read-recently-played');
    const authUrl = `${authEndPoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scopes}`;
    window.location.href = authUrl;
}

function getSpotifyTokenFromURL() {
    const hash = window.location.hash.substring(1); // Pega o fragmento da URL
    const params = new URLSearchParams(hash);
    return params.get('access_token');
}

function saveSpotifyToken(token) {
    localStorage.setItem('spotifyToken', token);
}

function addUser() {
    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let confirmEmail = document.getElementById('confirm-email').value;
    let password = document.getElementById('password').value;
    let confirmPassword = document.getElementById('confirm-password').value;

    //recupera lista de usuarios armazenada no localstorage ou cria uma lista vazia de usuarios, caso nao haja nenhum usuario cadastrado
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    console.log(usuarios);
    //validacao email e senha
    if (email !== confirmEmail) {
        document.getElementById('error').innerText = 'Os emails são diferentes';
        return;
    }
    if (password !== confirmPassword) {
        document.getElementById('error').innerText = 'As senhas são diferentes';
        return;
    }

    //verificacao se o email já está cadastrado
    let usuarioExistente = usuarios.find(usuario => usuario.email === email)
    if (usuarioExistente) {
        document.getElementById('error').innerText = 'Usuário já cadastrado';
        return;
    }

    //criar um novo objeto usuario que será armazenado na nossa lista de usuarios
    let novoUsuario = {
        id: Date.now(),
        nome: name,
        email: email,
        senha: btoa(password), //salvando senha com criptografia
        playlists: []
    }

    //colocando objeto novoUsuario no final da lista usuarios
    usuarios.push(novoUsuario);
    console.log(usuarios);
    //salvar no local storage
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    document.getElementById('error').innerText = 'Usuário cadastrado com sucesso';
    //depois que o usuário for cadastrado, o sistema redireciona para a pagina de login com uma espera 3 segundos
    console.log("usuario cadastrado");
    setTimeout(() => {
        console.log("redireciona para index.html");
        window.location.href = 'index.html';
    }, 3000);
}

//fora da funcao addUser
//funcao que volta para a pagina de login para o botao voltar
function backLogin() {
    window.location.href = 'index.html';
}

//funcao do login
function login() {
    let email = document.getElementById('login-email').value;
    let password = document.getElementById('login-password').value;
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    //encontrando o usuario e a senha no localstorage
    let usuario = usuarios.find(usuario => usuario.email === email && atob(usuario.senha) === password);

    //verificando se usuario e senha estao corretos
    if (usuario) {
        //armazenar que o usuario está logado 
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));

        //verigicando se o sessionStorage foi atualizado 
        console.log('sessionStorage atualizado:', sessionStorage.getItem('usuarioLogado'));


        console.log("login efetuado");
        loginWithSpotify();
        //redirecionar para página home
        // window.location.href = "home.html"
    } else {
        document.getElementById('mensagem').innerText = 'usuário ou senha incorretos';
        console.log("login com erro");
        return
    }

}