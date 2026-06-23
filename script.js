const cardsList = [
{
    name: "Feuilynx",
    image: "feuilynx.png",
    rarity: "Commune"
},
{
    name: "Aquashi",
    image: "aquashi.png",
    rarity: "Commune"
},
{
    name: "Pyrabit",
    image: "pyrabit.png",
    rarity: "Commune"
},
{
    name: "Élektron",
    image: "elektron.png",
    rarity: "Commune"
},
{
    name: "Rocargo",
    image: "rocargo.png",
    rarity: "Peu Commune"
},
{
    name: "Loupgivre",
    image: "loupgivre.png",
    rarity: "Peu Commune"
},
{
    name: "draco cristal",
    image: "draco cristal.png",
    rarity: "Commune"
}
];

let position = 0;
let speed = 0;

let generatedCards = [];

let drops =
JSON.parse(localStorage.getItem("drops")) || {};

function createCards(){

    const container =
    document.getElementById("cards");

    container.innerHTML = "";

    generatedCards = [];

    for(let i = 0; i < 50; i++){

        const card =
        cardsList[Math.floor(
            Math.random() * cardsList.length
        )];

        generatedCards.push(card);

        container.innerHTML += `
        <div class="card">
            <img src="${card.image}" alt="${card.name}">
        </div>
        `;
    }
}

function startRoll(){

    createCards();

    position = 0;
    speed = 35;

    const cards =
    document.getElementById("cards");

    document.getElementById("result").innerText = "";

    document.getElementById("winnerCard").style.display =
    "none";

    const roll = setInterval(() => {

        position += speed;

        cards.style.left =
        -position + "px";

        speed *= 0.992;

        if(speed < 0.3){

            clearInterval(roll);

            showWinner();
        }

    },16);
}

function showWinner(){

    const cardWidth = 195;

    const centerLine =
    document.querySelector(".roulette").offsetWidth / 2;

    const winnerIndex =
    Math.floor(
        (position + centerLine) /
        cardWidth
    );

    const winner =
    generatedCards[winnerIndex];

    if(!winner) return;

    document.getElementById("result").innerText =
    "🎉 Tu as gagné " +
    winner.name +
    " • " +
    winner.rarity;

    const card =
    document.getElementById("winnerCard");

    card.src = winner.image;
    card.style.display = "block";

    if(!drops[winner.name]){
        drops[winner.name] = 0;
    }

    drops[winner.name]++;

    localStorage.setItem(
        "drops",
        JSON.stringify(drops)
    );

    const userId =
    localStorage.getItem("userId");

    if(userId){

        fetch("/add-card", {
            method: "POST",
            headers: {
                "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                card: winner.name
            })
        })
        .then(res => res.json())
        .then(data => {

            console.log(
                "Carte sauvegardée :",
                data
            );

        })
        .catch(err => {

            console.error(
                "Erreur sauvegarde carte :",
                err
            );

        });

    } else {

        console.log(
            "Aucun utilisateur connecté"
        );

    }

    updateLeaderboard();
}

function updateLeaderboard(){

    let html = "";

    for(const card in drops){

        html += `
        <p>${card} : ${drops[card]}</p>
        `;
    }

    document.getElementById(
        "leaderboard"
    ).innerHTML = html;
}

async function loadInventory(){

    const userId =
    localStorage.getItem("userId");

    if(!userId) return;

    try{

        const response =
        await fetch(
            `/inventory/${userId}`
        );

        const inventory =
        await response.json();

        console.log(
            "Inventaire :",
            inventory
        );

    }catch(err){

        console.error(err);

    }
}

const music =
document.getElementById("music");

document.addEventListener("click", () => {

    if(music && music.paused){

        music.volume = 0.3;
        music.play();

    }

},{ once:true });

function toggleMusic(){

    if(!music) return;

    if(music.paused){

        music.play();

    }else{

        music.pause();

    }
}

createCards();
updateLeaderboard();
loadInventory();
