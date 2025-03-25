let mongoose = require("mongoose");
let User = require("./models/User");

const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

function createUser(username, email, password, age) {
    const user = new User({
        username: username,
        email: email,
        passwordHash: password,
        age: age,
    });
    return user.save();
}

async function populate() {
    await createUser("Alice", "alice@example.com", "password123", 25);
    await createUser("Bob", "bob@example.com", "password456", 30);
    await createUser("Charlie", "charlie@example.com", "password789", 35);

    if (db) db.close();
    console.log("Users added");
}

populate().catch((error) => {
    console.error("ERROR: " + error);
    if (db) db.close();
});
