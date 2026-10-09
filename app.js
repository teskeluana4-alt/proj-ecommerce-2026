const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.redirect('/admin/'));
app.use('/admin', require('./rotas/admin'));

app.use((req, res) => res.status(404).send('Página não encontrada. <a href="/admin/index">Voltar ao painel</a>'));
app.use((erro, req, res, next) => {
    console.error(erro);
    if (erro.code === 'LIMIT_FILE_SIZE') return res.status(400).send('A imagem deve ter no máximo 5 MB.');
    if (erro.message === 'Envie um arquivo de imagem válido.') return res.status(400).send(erro.message);
    res.status(500).send('Ocorreu um erro no servidor. Confira o terminal do VS Code.');
});

app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
