const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./banco/ecommerce.db', (erro) => {
    if (erro) {
        console.log(erro.message);
    } else {
        console.log('Banco conectado.');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            regiao TEXT
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            categoria TEXT,
            valor FLOAT,
            estoque INTEGER DEFAULT 0,
            descricao TEXT,
            imagem TEXT,
            ano INTEGER,
            uva TEXT
        );
    `);

    db.all('PRAGMA table_info(categorias)', [], (erro, colunas) => {
        if (!erro && !colunas.some(c => c.name === 'regiao')) {
            db.run('ALTER TABLE categorias ADD COLUMN regiao TEXT');
        }
    });
    db.all('PRAGMA table_info(produtos)', [], (erro, colunas) => {
        if (!erro) {
            if (!colunas.some(c => c.name === 'ano')) db.run('ALTER TABLE produtos ADD COLUMN ano INTEGER');
            if (!colunas.some(c => c.name === 'uva')) db.run('ALTER TABLE produtos ADD COLUMN uva TEXT');
        }
    });

    db.get('SELECT COUNT(*) AS total FROM categorias', [], (erro, resultado) => {
        if (erro || resultado.total > 0) return;
        const categorias = [
            ['Tintos', 'Vinhos tintos encorpados e elegantes.', 'Vale dos Vinhedos, Brasil'],
            ['Brancos', 'Vinhos brancos frescos e aromáticos.', 'Bento Gonçalves, Brasil'],
            ['Rosés', 'Vinhos rosés leves e frutados.', 'Provence, França'],
            ['Espumantes', 'Espumantes para celebrações.', 'Serra Gaúcha, Brasil'],
            ['Tintos Europeus', 'Rótulos clássicos de tradição europeia.', 'Toscana, Itália']
        ];
        const inserirCategoria = (i) => {
            if (i >= categorias.length) return inserirProdutosExemplo();
            db.run('INSERT INTO categorias (nome, descricao, regiao) VALUES (?, ?, ?)', categorias[i], (e) => {
                if (e) return console.error('Erro ao inserir categoria de exemplo:', e.message);
                inserirCategoria(i + 1);
            });
        };
        const inserirProdutosExemplo = () => {
            db.get('SELECT COUNT(*) AS total FROM produtos', [], (e, r) => {
                if (e || r.total > 0) return;
                const produtos = [
                    ['Cabernet Sauvignon Reserva', 'Tintos', 89.90, 18, 'Vinho tinto seco, com notas de frutas negras. Exemplo demonstrativo.', 'cabernet-sauvignon.svg', 2022, 'Cabernet Sauvignon'],
                    ['Merlot Seleção', 'Tintos', 69.90, 24, 'Tinto macio, com taninos redondos e final agradável. Exemplo demonstrativo.', 'merlot.svg', 2021, 'Merlot'],
                    ['Chardonnay Vale', 'Brancos', 74.90, 15, 'Branco com notas cítricas e toque amanteigado. Exemplo demonstrativo.', 'chardonnay.svg', 2023, 'Chardonnay'],
                    ['Rosé da Serra', 'Rosés', 59.90, 20, 'Rosé fresco, frutado e ótimo para servir gelado. Exemplo demonstrativo.', 'rose.svg', 2024, 'Merlot e Pinot Noir'],
                    ['Moscatel Espumante', 'Espumantes', 64.90, 12, 'Espumante aromático, com perfil adocicado. Exemplo demonstrativo.', 'moscatel.svg', 2023, 'Moscato'],
                    ['Chianti Estilo Clássico', 'Tintos Europeus', 99.90, 10, 'Tinto inspirado na tradição da Toscana. Produto demonstrativo, não representa um rótulo real.', 'merlot.svg', 2022, 'Sangiovese']
                ];
                const inserirProduto = (j) => {
                    if (j >= produtos.length) { console.log('Categorias e vinhos de exemplo adicionados.'); return; }
                    db.run('INSERT INTO produtos (nome, categoria, valor, estoque, descricao, imagem, ano, uva) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', produtos[j], (err) => {
                        if (err) return console.error('Erro ao inserir vinho de exemplo:', err.message);
                        inserirProduto(j + 1);
                    });
                };
                inserirProduto(0);
            });
        };
        inserirCategoria(0);
    });

});

module.exports = db;