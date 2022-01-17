const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const User = require('./user.js');
const fiU = require('express-fileupload');
const session = require('express-session')({
	secret: process.env.SECRET_SESSION || 'secret',
	resave: true,
	saveUninitialized: true,
	maxAge: new Date(253402300000000)
});
const admin = require('firebase-admin');
let serviceAccount = require("../aK.json");

let fireApp = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://drum-machine-database.firebaseio.com"
});

let fS = admin.firestore();

let rolesAssociations = {
	'OWNER': 0x10,
	'ADMINISTRATOR': 0x8,
	'BEATER': 0x8,
	'MODERATOR': 0x5,
	'NORMAL': 0x1
}
User.setRolesAssociations(rolesAssociations);
User.setDb(fS);
User.setPicturesDb(fS);
User.setUsersRef('users');

app.use(fiU({
	limits: { fileSize: 0.5 * 1024 * 1024 }
}));
app.use(session);
app.use(require('express').json({strict: false}));
app.use(require('express').urlencoded({ extended: false }));

const sharedsession = require("express-socket.io-session");
io.use(sharedsession(session));

// ---------------------


let filesDir = __dirname + "/pages";

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
async function genUniqueId(dbRef, accept = 'ALL') {
	let uniqueId = "";
	let choices = "";
	let numbers = '0123456789';
	let lettersMin = 'abcdefghijklmnopqrstuvwxyz';
	let lettersMaj = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	switch(accept.toLowerCase()) {
		case 'letters':
			choices += lettersMin += lettersMaj;
			break;
		case 'lettersMin':
			choices += lettersMin;
			break;
		case 'lettersMaj':
			choices += lettersMaj;
			break;
		case 'numbers':
			choices += numbers;
			break;
		default:
			choices += (lettersMin += lettersMaj += numbers);
			break;
	}
	for(let x = 0; x < 15; x++) {
		uniqueId += choices[Math.floor(Math.random() * choices.length)];
	}
	return uniqueId;
}
app.post('/saveOnWeb', async (req, res) => {
	let p = async function() {
		uniqueId = await genUniqueId('songs', 'all');
		return uniqueId;
	}

	let uniqueId;
	if(!req.body.name) uniqueId = await p();
	else uniqueId = req.body.name;

	let ref = await fS.collection(`songs`).doc(uniqueId).get();
	if(req.session.user && ref.data() && ref.data().author && ref.data().author.toLowerCase() === req.session.user.name.toLowerCase()) uniqueId = req.body.name;
	else if(ref.data()) await p();

	req.body.name = uniqueId;
	if(req.session.user) req.body.author = req.session.user.name;

	fS.collection('songs').doc(uniqueId).set(req.body);
	return res.send({ id: uniqueId });
});
app.post('/song/:songId', (req, res) => {
	let ref = fS.collection('songs').doc(req.params.songId).get()
	.then(function(snapshot) {
		if(snapshot.data()) return res.send(snapshot.data())
		else return res.send({ error: true });
	});
});
app.post('/songs/list', async (req, res) => {
	let ref = await fS.collection('songs').get();
	let songs = {};
	ref.forEach((elem, i) => {
		songs[elem.data().name] = elem.data();
	});
	return res.send(songs);
});
app.post('/fileUpload', (req, res) => {
	console.log(req.files.file)
	if(!req.files.file.name.endsWith('.json')) {
		return res.send({ error: true, message: 'Invalid file' });
	}
	
	return res.send(req.files.file);
});

app.get('/', (req, res) => {
    return res.sendFile(filesDir + '/index.html');
});
app.get('/projects', (req, res) => {
	return res.sendFile(filesDir + '/projects.html');
});
app.get('/members', async (req, res) => {
	if(!req.session.user) return res.redirect('/login');

	let u = await User.get(req.session.user.name.toLowerCase());
	if(!u) return res.redirect('/login');
	if((u.permissionsLevel | rolesAssociations['ADMINISTRATOR']) !== u.permissionsLevel) return res.redirect('/login');
	if(req.session.user.name.toLowerCase() !== u.id.toLowerCase()) return res.redirect('/login');
	if(req.session.user.password !== u.password) return res.redirect('/login');

	return res.sendFile(filesDir + "/members.html");
});
app.post('/users', async (req, res) => {
	if(!req.session.user) return res.send({ error: true, message: "Not connected" });

	let u = await User.get(req.session.user.name.toLowerCase());
	if(!u) return res.send({ error: true, message: "Not connected" });
	if((u.permissionsLevel | rolesAssociations['ADMINISTRATOR']) !== u.permissionsLevel) return res.send({ error: true, message: "Not connected" });
	if(req.session.user.name.toLowerCase() !== u.id.toLowerCase()) return res.send({ error: true, message: "Not connected" });
	if(req.session.user.password !== u.password) return res.send({ error: true, message: "Not connected" });

	return res.send(await User.list());
});
app.post('/upload', async (req, res) => {
	if(!req.session.user) return res.send({ error: true, message: "Not connected" });
	if(!req.session.user.name) return console.log('An error occured while contacting the client');

	if(!req.files) return res.send({ error: true });
	if(!req.files["file"]) return res.send({ error: true });
	if(!req.files['file'].name.toLowerCase().endsWith('.png') && !req.files['file'].name.toLowerCase().endsWith('.jpg')) return res.send({ error: true, message: "Sorry, for this moment only png images are accepted" })

	let u = await User.get(req.session.user.name.toLowerCase());
	if(req.session.user.name.toLowerCase() !== u.id.toLowerCase()) return res.send({ error: true, message: "Not connected" });
	if(req.session.user.password !== u.password) return res.send({ error: true, message: "Not connected" });

	let img = {
		data: req.files["file"].data,
		mimetype: req.files["file"].mimetype
	}
	await User.uploadImage(req.session.user.name.toLowerCase(), img);

	let picture = await User.getImage(req.session.user.name.toLowerCase());

	res.send({ data: picture });
});
app.post('/userInfos', async(req, res) => {
	if(!req.session.user) return res.send({ error: true, message: "Not connected" });

	let u = await User.get(req.session.user.name.toLowerCase());
	if(req.session.user.name.toLowerCase() !== u.id.toLowerCase()) return res.send({ error: true, message: "Not connected" });
	if(req.session.user.password !== u.password) return res.send({ error: true, message: "Not connected" });

	res.send(u);
});
app.post('/profilePicture', async(req, res) => {
	if(!req.session.user) return res.send({ error: true, message: "Not connected" });

	let u = await User.get(req.session.user.name.toLowerCase());
	if(req.session.user.name.toLowerCase() !== u.id.toLowerCase()) return res.send({ error: true, message: "Not connected" });
	if(req.session.user.password !== u.password) return res.send({ error: true, message: "Not connected" });

	let picture = await User.getImage(req.session.user.name.toLowerCase());

	res.send(picture);
});

async function logUser(infos, callback) {

	if(!infos) return callback({ error: true });
	if(!infos.req || !infos.res) return callback({ error: true });
	if(!infos.req.body) return callback({ error: true });

	let name = infos.req.body.name.toLowerCase();
	let password = infos.req.body.password;
	if(!name || !password) return callback({ error: true });

	let u = await User.list();
	if(!u[name.toLowerCase()]) return callback({ error: true });
	if(u[name.toLowerCase()].password !== password) return callback({ error: true });
	else {
		callback({
			name: name,
			password: password,
			loggedAt: Date.now()
		});
	}
}
app.post('/register', (req, res) => {
	/*
	let users = db.ref('users');
	users.once('value')
	.then(u => {
		console.log(u.val())
		if(!u.val()) {
			db.ref('users/' + name).set({ password: password });
		} else if(!(name in u.val())) {
			db.ref('users/' + name).set({ password: password });
		}
	});
	*/
});
app.post('/infos', async (req, res) => {
	if(!req.session.user) return res.send({ error: true, message: 'You are not connected', errorId: "ERR_NOT_CONNECTED" });
	return res.send(req.session.user);
});
app.post('/logUser', async (req, res) => {
	await logUser({ req, res }, function(data) {
		console.log(data)
		if(data.error) return res.send({ error: true });
		if(data.name) req.session.user = data;
		return res.send({ error: false, r: true, url: '/dashboard' })
	});
});
app.get('/logOut', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
});
app.get('/dashboard', (req, res) => {
	if(!req.session.user) return res.redirect('/login');
	res.sendFile(filesDir + '/dashboard.html');
});
app.get('/login', (req, res) => {
	if(req.session.user) return res.redirect('/dashboard');
	return res.sendFile(filesDir + '/login.html');
});

// --------------------

io.on('connection', socket => {
    console.log('A user arrived !');
});

// --------------------

app.use(require('express').static(__dirname + "/../public"));

const port = process.env.PORT || 80;
http.listen(port, function() {
	console.log(`Server running on port: ${port}`)
});
