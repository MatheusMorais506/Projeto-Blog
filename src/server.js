// Carregando módulos para iniciar a aplicação.
const express = require('express');
const handlebars = require('express-handlebars');
const mongoose = require('mongoose');
const admin = require("./routes/admin");
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();

require('./models/Postagem');
const Postagem = mongoose.model('postagens');
const usuarios = require('./routes/usuario');
const passport = require('passport');
require('./config/auth')(passport);

    
// Sessão
app.use(session({
    secret: 'cursodenode',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
  
// Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});
app.use(express.urlencoded({extended: true}));
app.use(express.json());   

//HandleBars
app.engine('handlebars', handlebars({
    defaultLayout: 'main'}));
app.set('views',__dirname + '/views');
app.set('view engine', 'handlebars');

//Conexão com o banco criando um database chamado 'projetoBlog'
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/NomeDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Conexão com MongoDB realizada com sucesso');
}).catch((err) => {
    console.log('Erro: Conexão com MongoDB não realiada:' + err);
});

//Informar a pasta que guarda os arquivos estáticos nesse caso a pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public/img/node.svs')); 
app.use(passport.initialize());
app.use(passport.session());


//Rotas
app.get('/posts', (req, res) => {
    res.send('Lista de posts.')
})

app.get('/', (req, res) => {
    Postagem.find().lean().populate('categoria').sort({data: 'desc'})
    .then(postagens => {
        res.render('index', {postagens: postagens});
    }).catch(err => {
        req.flash('error_msg', 'Houve um erro interno');
        res.redirect('/404');
    });
});

app.get('/postagem/:slug', (req,res) => {
    const slug = req.params.slug
    Postagem.findOne({slug})
    .then(postagem => {
        if(postagem){
        const post = {
            titulo: postagem.titulo,
            data: postagem.data,
            conteudo: postagem.conteudo
        }
            res.render('postagem/index', post)
        } else {
            req.flash("error_msg", "Essa postagem nao existe")
            res.redirect("/")
            }
        }).catch(err => {
                req.flash("error_msg", "Houve um erro interno")
                res.redirect("/")
    });
});

app.get('/404', (req, res) => {
    res.send('Error 404');
});
app.use('/usuarios', usuarios);
app.use('/admin' , admin);

//Porta
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
    console.log('Servidor conectado na porta'  + PORT)
});