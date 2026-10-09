const express = require('express');
const appAdmin = express.Router();
const db = require('../banco/database');
const upload = require('../util/imagens');
const fs = require('fs');
const path = require('path');

function erroBanco(res, erro, mensagem) {
    console.error(mensagem, erro.message);
    return res.status(500).send(`${mensagem} Confira o terminal para ver os detalhes.`);
}

appAdmin.get(['/index', '/'], (req, res) => {
    res.render(req.path === '/' ? 'admin/login' : 'admin/index-admin');
});
appAdmin.post('/login', (req, res) => res.redirect('/admin/index'));

appAdmin.get('/categorias', (req, res) => {
    db.all('SELECT * FROM categorias ORDER BY nome', [], (erro, categorias) => {
        if (erro) return erroBanco(res, erro, 'Erro ao consultar categorias.');
        res.render('admin/categorias/lista', { categorias });
    });
});

appAdmin.get('/categorias/form-cadastrar', (req, res) => {
    res.render('admin/categorias/cadastro', { categoria: null, erro: null });
});

appAdmin.post('/categorias/cadastrar', (req, res) => {
    const nome = (req.body.nome || '').trim();
    const descricao = (req.body.descricao || '').trim();
    const regiao = (req.body.regiao || '').trim();
    if (!nome) return res.status(400).send('Informe o nome da categoria.');
    db.run('INSERT INTO categorias (nome, descricao, regiao) VALUES (?, ?, ?)', [nome, descricao, regiao], function (erro) {
        if (erro) return erroBanco(res, erro, 'Erro ao cadastrar categoria.');
        res.redirect('/admin/categorias');
    });
});

appAdmin.get('/categorias/editar/:id', (req, res) => {
    db.get('SELECT * FROM categorias WHERE id = ?', [req.params.id], (erro, categoria) => {
        if (erro) return erroBanco(res, erro, 'Erro ao buscar categoria.');
        if (!categoria) return res.status(404).send('Categoria não encontrada.');
        res.render('admin/categorias/cadastro', { categoria, erro: null });
    });
});

appAdmin.post('/categorias/editar/:id', (req, res) => {
    const nome = (req.body.nome || '').trim();
    const descricao = (req.body.descricao || '').trim();
    const regiao = (req.body.regiao || '').trim();
    if (!nome) return res.status(400).send('Informe o nome da categoria.');
    db.run('UPDATE categorias SET nome = ?, descricao = ?, regiao = ? WHERE id = ?', [nome, descricao, regiao, req.params.id], function (erro) {
        if (erro) return erroBanco(res, erro, 'Erro ao atualizar categoria.');
        res.redirect('/admin/categorias');
    });
});

appAdmin.post('/categorias/excluir/:id', (req, res) => {
    db.get('SELECT nome FROM categorias WHERE id = ?', [req.params.id], (erro, categoria) => {
        if (erro) return erroBanco(res, erro, 'Erro ao buscar categoria.');
        if (!categoria) return res.status(404).send('Categoria não encontrada.');
        db.get('SELECT COUNT(*) AS total FROM produtos WHERE categoria = ?', [categoria.nome], (erroContagem, resultado) => {
            if (erroContagem) return erroBanco(res, erroContagem, 'Erro ao verificar produtos da categoria.');
            if (resultado.total > 0) return res.status(409).send('Não é possível excluir esta categoria porque existem vinhos vinculados a ela. Altere a categoria dos vinhos primeiro.');
            db.run('DELETE FROM categorias WHERE id = ?', [req.params.id], erroDelete => {
                if (erroDelete) return erroBanco(res, erroDelete, 'Erro ao excluir categoria.');
                res.redirect('/admin/categorias');
            });
        });
    });
});

appAdmin.get('/produtos', (req, res) => {
    db.all('SELECT * FROM produtos ORDER BY id DESC', [], (erro, produtos) => {
        if (erro) return erroBanco(res, erro, 'Erro ao consultar vinhos.');
        res.render('admin/produtos/lista', { produtos });
    });
});

appAdmin.get('/produtos/form-cadastrar', (req, res) => {
    db.all('SELECT * FROM categorias ORDER BY nome', [], (erro, categorias) => {
        if (erro) return erroBanco(res, erro, 'Erro ao carregar categorias.');
        res.render('admin/produtos/cadastro', { categorias, produto: null });
    });
});

appAdmin.post('/produtos/cadastrar', upload.single('imagem'), (req, res) => {
    const { nome, categoria, valor, estoque, descricao, ano, uva } = req.body;
    if (!nome || !categoria || valor === '' || estoque === '') {
        if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
        return res.status(400).send('Preencha nome, categoria, preço e estoque.');
    }
    const preco = Number(valor);
    const quantidade = Number.parseInt(estoque, 10);
    if (!Number.isFinite(preco) || preco < 0 || !Number.isInteger(quantidade) || quantidade < 0) {
        if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
        return res.status(400).send('Preço e estoque devem ser valores válidos e não negativos.');
    }
    const anoNumero = ano ? Number.parseInt(ano, 10) : null;
    if (ano && (!Number.isInteger(anoNumero) || anoNumero < 1900 || anoNumero > new Date().getFullYear() + 1)) {
        if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
        return res.status(400).send('Informe um ano de safra válido.');
    }
    const imagem = req.file ? req.file.filename : null;
    db.run('INSERT INTO produtos (nome, categoria, valor, estoque, descricao, imagem, ano, uva) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nome.trim(), categoria, preco, quantidade, (descricao || '').trim(), imagem, anoNumero, (uva || '').trim()], function (erro) {
            if (erro) {
                if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
                return erroBanco(res, erro, 'Erro ao cadastrar vinho.');
            }
            res.redirect('/admin/produtos');
        });
});

appAdmin.get('/produtos/editar/:id', (req, res) => {
    db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id], (erro, produto) => {
        if (erro) return erroBanco(res, erro, 'Erro ao buscar vinho.');
        if (!produto) return res.status(404).send('Vinho não encontrado.');
        db.all('SELECT * FROM categorias ORDER BY nome', [], (erroCategorias, categorias) => {
            if (erroCategorias) return erroBanco(res, erroCategorias, 'Erro ao carregar categorias.');
            res.render('admin/produtos/cadastro', { categorias, produto });
        });
    });
});

appAdmin.post('/produtos/editar/:id', upload.single('imagem'), (req, res) => {
    const { nome, categoria, valor, estoque, descricao, ano, uva } = req.body;
    const preco = Number(valor);
    const quantidade = Number.parseInt(estoque, 10);
    if (!nome || !categoria || valor === '' || estoque === '' || !Number.isFinite(preco) || preco < 0 || !Number.isInteger(quantidade) || quantidade < 0) {
        if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
        return res.status(400).send('Confira nome, categoria, preço e estoque.');
    }
    db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id], (erro, produtoAtual) => {
        if (erro) return erroBanco(res, erro, 'Erro ao buscar vinho.');
        if (!produtoAtual) return res.status(404).send('Vinho não encontrado.');
        const anoNumero = ano ? Number.parseInt(ano, 10) : null;
        if (ano && (!Number.isInteger(anoNumero) || anoNumero < 1900 || anoNumero > new Date().getFullYear() + 1)) {
            if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
            return res.status(400).send('Informe um ano de safra válido.');
        }
        const imagem = req.file ? req.file.filename : produtoAtual.imagem;
        db.run('UPDATE produtos SET nome = ?, categoria = ?, valor = ?, estoque = ?, descricao = ?, imagem = ?, ano = ?, uva = ? WHERE id = ?',
            [nome.trim(), categoria, preco, quantidade, (descricao || '').trim(), imagem, anoNumero, (uva || '').trim(), req.params.id], function (erroUpdate) {
                if (erroUpdate) {
                    if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
                    return erroBanco(res, erroUpdate, 'Erro ao atualizar vinho.');
                }
                if (req.file && produtoAtual.imagem) fs.unlink(path.join(__dirname, '../public/uploads', path.basename(produtoAtual.imagem)), () => {});
                res.redirect('/admin/produtos');
            });
    });
});

appAdmin.post('/produtos/excluir/:id', (req, res) => {
    db.get('SELECT imagem FROM produtos WHERE id = ?', [req.params.id], (erro, produto) => {
        if (erro) return erroBanco(res, erro, 'Erro ao buscar vinho.');
        if (!produto) return res.status(404).send('Vinho não encontrado.');
        db.run('DELETE FROM produtos WHERE id = ?', [req.params.id], function (erroDelete) {
            if (erroDelete) return erroBanco(res, erroDelete, 'Erro ao excluir vinho.');
            if (produto.imagem) fs.unlink(path.join(__dirname, '../public/uploads', path.basename(produto.imagem)), () => {});
            res.redirect('/admin/produtos');
        });
    });
});

module.exports = appAdmin;
