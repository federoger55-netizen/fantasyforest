const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const SECRET = "fantasyforestsecret";

// INSCRIPTION
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO "user"(username,password,cards) VALUES($1,$2,$3)',
            [username, hash, "[]"]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

// CONNEXION
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM "user" WHERE username=$1',
            [username]
        );

        if (result.rows.length === 0)
            return res.json({ success: false });

        const user = result.rows[0];

        const valid = await bcrypt.compare(
            password,
            user.password
        );

        if (!valid)
            return res.json({ success: false });

        const token = jwt.sign(
            { id: user.id },
            SECRET
        );

        res.json({
            success: true,
            token,
            userId: user.id
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

// INVENTAIRE
app.get("/inventory/:id", async (req, res) => {

    const result = await pool.query(
        'SELECT cards FROM "user" WHERE id=$1',
        [req.params.id]
    );

    res.json(result.rows[0]);
});

// AJOUTER UNE CARTE
app.post("/add-card", async (req, res) => {

    const { userId, card } = req.body;

    const result = await pool.query(
        'SELECT cards FROM "user" WHERE id=$1',
        [userId]
    );

    let cards = result.rows[0].cards || [];

    cards.push(card);

    await pool.query(
        'UPDATE "user" SET cards=$1 WHERE id=$2',
        [JSON.stringify(cards), userId]
    );

    res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Fantasy Forest lancé !");
});
