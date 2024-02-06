const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

function getPath(pathName){
    return path.join(__dirname, pathName);
}

const usersPath = path.join(__dirname, 'users.json');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(getPath('public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
    userData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    next();
});

let userData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

function saveUserData(){
    fs.writeFileSync(usersPath, JSON.stringify(userData, null, 2), 'utf8')
}

function getUser(username){
    for(let user of userData){
        if(user.username === username){
            return user;
        }
    }
    return null;
}

app.get('/', function(req, res) {
    const { username, session } = req.cookies;
    let userExists = getUser(username) !== null;

    if (username && session && userExists) {
        res.redirect('/dashboard');
    } else {
        const data = {
            error: ''
        }
        res.render('login', {data})
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const attemptedUser = getUser(username);
    const userExists =  attemptedUser !== null;

    if(userExists && attemptedUser.password === password){
        res.cookie('username', username);
        res.cookie('session', 'authenticated');
        res.redirect('/dashboard');
    }
    else if(userExists && attemptedUser.password !== password){
        const data = {
            error: 'Password is incorrect'
        };
        res.render('login', {data});
    }
    else{
        const data = {
            error: 'Username does not exist'
        };
        res.render('login', {data});
    }
});

app.post('/register', (req, res) => {
    const { firstName, surname, username, password } = req.body;
    let userExists = getUser(username) !== null;

    if(userExists){
        const data = {
            error: 'Username is taken'
        };
        res.render('register', {data});
    }
    else{
        let newUser = {
            "username": username,
            "password": password,
            "firstName": firstName,
            "surname": surname,
            "balance": 0,
            "entries": []
        }
        userData.push(newUser);
        saveUserData();
        res.cookie('username', username);
        res.cookie('session', 'authenticated');
        res.redirect('/dashboard');
    }
});

app.post('/entry', (req, res) => {
    const { type, amount, description } = req.body;
    const { username } = req.cookies;
    let currentUser = getUser(username);

    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();

    const formattedDate = `${month}/${day}/${year}`;

    if (!currentUser) {
        res.redirect('/dashboard');
    }
    if (type === 'expense') {
        currentUser.balance -= parseInt(amount * 100)
        currentUser.entries.push({
            "amount": -amount,
            "description": description,
            "date": formattedDate
        });
    } 
    else if (type === 'income') {
        currentUser.balance += parseInt(amount * 100)
        currentUser.entries.push({
            "amount": amount,
            "description": description,
            "date": formattedDate
        });
    } 
    else {
        return res.redirect('/dashboard');
    }
    saveUserData();
    res.redirect('/dashboard');
});


app.get('/dashboard', (req, res) => {
    const { username, session } = req.cookies;
    const currentUser = getUser(username);
    let userExists = getUser(username) !== null;

    if(!userExists){
        const data = {
            error: ''
        }
        res.render('login', {data})
    }

    if(username && session){
        const userBalance = (currentUser.balance / 100).toFixed(2);
        const userEntries = currentUser.entries
         const data = {
            balance: userBalance,
            entries: userEntries
        };
        res.render('dashboard', { data });
    } 
    else {
        res.redirect('/');
    }
});

app.get('/go-to-register', (req, res) => {
    const data = {
        error: ''
    };
    res.render('register', {data});
});

app.get('/go-to-login', (req, res) => {
    const data = {
        error: ''
    };
    res.render('login', {data});
});

app.get('/delete-account', (req, res) => {
    const { username, session } = req.cookies;
    const data = {
        error: ''
    };
    const indexOfUser = userData.findIndex(obj => obj.username === username);
    userData.splice(indexOfUser, 1);
    saveUserData();
    res.redirect('/');
});

const port = process.env.PORT || 9874;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});