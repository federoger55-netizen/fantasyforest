const express = require("express");
const bcrypt = require("bcryptjs");
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

// ====================
// INSCRIPTION
// ====================
app.post("/register", async (req, res) => {

    try {

        const { username, password } = req.body;

        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO "user"(username,password,coins) VALUES($1,$2,$3)',
            [username, hash, 100]
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.json({
            success: false
        });
    }
});

// ====================
// CONNEXION
// ====================
app.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM "user" WHERE username=$1',
            [username]
        );

        if(result.rows.length === 0){

            return res.json({
                success:false
            });
        }

        const user = result.rows[0];

        const valid = await bcrypt.compare(
            password,
            user.password
        );

        if(!valid){

            return res.json({
                success:false
            });
        }

        const token = jwt.sign(
            { id:user.id },
            SECRET
        );

        res.json({
            success:true,
            token,
            userId:user.id,
            username:user.username,
            coins:user.coins
        });

    } catch(err){

        console.error(err);

        res.json({
            success:false
        });
    }
});

// ====================
// RÉCUPÉRER LES PIÈCES
// ====================
app.get("/coins/:id", async (req,res) => {

    try {

        const result = await pool.query(
            'SELECT coins FROM "user" WHERE id=$1',
            [req.params.id]
        );

        if(result.rows.length === 0){

            return res.json({
                success:false
            });
        }

        res.json({
            success:true,
            coins:result.rows[0].coins
        });

    } catch(err){

        console.error(err);

        res.json({
            success:false
        });
    }
});

// ====================
// DÉPENSER 20 PIÈCES
// ====================
app.post("/spend-coins", async (req,res) => {

    try {

        const { userId } = req.body;

        const result = await pool.query(
            'SELECT coins FROM "user" WHERE id=$1',
            [userId]
        );

        if(result.rows.length === 0){

            return res.json({
                success:false
            });
        }

        if(result.rows[0].coins < 20){

            return res.json({
                success:false,
                message:"Pas assez de pièces"
            });
        }

        await pool.query(
            'UPDATE "user" SET coins = coins - 20 WHERE id=$1',
            [userId]
        );

        res.json({
            success:true
        });

    } catch(err){

        console.error(err);

        res.json({
            success:false
        });
    }
});

// ====================
// AJOUTER UNE CARTE
// ====================
app.post("/add-card", async (req, res) => {

    try {

        const { userId, card } = req.body;

        const existing = await pool.query(
            "SELECT * FROM inventory WHERE user_id=$1 AND card_name=$2",
            [userId, card]
        );

        if(existing.rows.length > 0){

            await pool.query(
                "UPDATE inventory SET quantity = quantity + 1 WHERE user_id=$1 AND card_name=$2",
                [userId, card]
            );

        } else {

            await pool.query(
                "INSERT INTO inventory(user_id, card_name, quantity) VALUES($1,$2,$3)",
                [userId, card, 1]
            );
        }

        res.json({
            success:true
        });

    } catch(err){

        console.error(err);

        res.json({
            success:false
        });
    }
});

// ====================
// INVENTAIRE
// ====================
app.get("/inventory/:id", async (req,res) => {

    try {

        const result = await pool.query(
            "SELECT card_name, quantity FROM inventory WHERE user_id=$1",
            [req.params.id]
        );

        res.json(result.rows);

    } catch(err){

        console.error(err);

        res.json([]);
    }
});

// ====================
// TEST SERVEUR
// ====================
app.get("/ping", (req,res) => {

    res.json({
        success:true,
        message:"Fantasy Forest Online"
    });
});

// ====================
// LANCEMENT
// ====================
app.listen(process.env.PORT || 3000, () => {

    console.log(
        "Fantasy Forest lancé !"
    );
});
