class User {
    constructor(name, password, options) {
        this.name = name;
        this.password = password;

        let permStatus;

        if(options && options.permissions) {
            permStatus = options.permissions;
        } else permStatus = ['NORMAL'];

        let permLevel;
        if(User.rolesAssociations) {
            if(options && options.permissions) {
                for(let perm of options.permissions) {
                    if(User.rolesAssociations[perm]) {
                        if(!permLevel) permLevel = User.rolesAssociations[perm];
                        else permLevel = permLevel | User.rolesAssociations[perm];
                    }
                }
            } else {
                permLevel = 0x1;
            }
        } else {
            permLevel = 0x1;
        }

        let message = {};
        return User.get(name).then(user => {
            if(user) return message = {error: true, message: 'User already exists'};

            User.db.collection(`${User.ref}`).doc(name.toLowerCase()).set({ permissionsLevel: permLevel, permissions: permStatus, password: password, displayName: name, id: name.toLowerCase(), createdOn: Date.now() });

            return message = {error: false, message: 'Created account'};
        });
    }
    static setRolesAssociations(rA) {
        User.rolesAssociations = rA;
    }
    static changeName(id, newName) {
        id = id.toLowerCase();
        return User.get(id).then(user => {
            if(!user) return {error: true, message: 'No user was found'};

            User.db.collection(`${User.ref}`).doc(id.toLowerCase()).update({
                displayName: newName
            });

            return {error: false, message: 'Changed display name'}
        });
    }
    static async uploadImage(id, img) {
        return User.get(id).then(user => {
            if(!img) return { error: true, message: "No picture" };
            if(!user) return {error: true, message: 'No user was found'};

            User.db.collection('users').doc(user.id.toLowerCase()).update({
                profilePicture: img
            });

            return {error: false, message: 'Changed profile picture'}
        });
    }
    static async getImage(id) {
        return new Promise(resolve => {
            User.db.collection('users').doc(id.toLowerCase()).get()
            .then(snapshot => {
                resolve(snapshot.data().profilePicture);
            });
        });
    }
    static async list() {
        let users = {};
        await User.db.collection(User.ref).get().then(u => {
            u.forEach(item => {
                users[item.data().id] = item.data();
            });
        });

        return users;
    }
    static async get(name) {
        let u = await User.list();
        if(!u) return false;
        if(!u[name.toLowerCase()]) return false;

        return await u[name.toLowerCase()];
    }
    static setPicturesDb(db) {
        User.pictureDb = db;
    }
    static setDb(db) {
        if(!db) return {error: true, message: 'No db set'};
        User.db = db;
    }
    static setUsersRef(ref) {
        if(!ref) return {error: true, message: 'No ref set'};
        User.ref = ref;
    }
}
module.exports = User;
