const Sequelize = require('sequelize')
const Op = Sequelize.Op;

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const Users = sequelize.import('models/Users');
const CardCompendium = sequelize.import('models/CardCompendium');
const UserCards = sequelize.import('models/UserCards');
const Duels = sequelize.import('models/Duels');
const DuelCards = sequelize.import('models/DuelCards');

UserCards.belongsTo(CardCompendium, { foreignKey: 'card_id', as: 'card' });
DuelCards.belongsTo(CardCompendium, { foreignKey: 'card_id', as: 'card' });

Users.prototype.addCard = async function(card) {
    const userCard = await UserCards.findOne({
        where: { user_id: this.user_id, card_id: card.id },
    });

    this.numOfCards += 1;
    this.save();

    if (userCard) {
        userCard.amount += 1;
        return userCard.save();
    }

    return UserCards.create({ user_id: this.user_id, card_id: card.id, amount: 1 , inDeck: 0});
};

Users.prototype.removeCard = async function(card) {
    const userCard = await UserCards.findOne({
        where: { user_id: this.user_id, card_id: card.id },
    });

    if (userCard) {
        this.numOfCards -=1;
        if (this.numOfCards < 0) this.numOfCards = 0;
        this.save();
        userCard.amount -= 1;
        userCard.save();
        if (userCard.inDeck > userCard.amount) {
            userCard.inDeck -= 1;
            this.cardsInDeck -= 1;
            this.save();
        }
        if (userCard.amount < 1) return userCard.destroy();
        return userCard.save();
        // return userCard.destroy();
    }
    return false;
};

Users.prototype.hasCard = async function(card) {
    const userCard = await UserCards.findOne({
        where: { user_id: this.user_id, card_id: card.id },
    });
    if (userCard) return true;
    return false;
}

Users.prototype.getCards = function() {
    return UserCards.findAll({
        where: { user_id: this.user_id },
        include: ['card'],
    });
};

Users.prototype.addToDeck = async function(card) {
    const userCard = await UserCards.findOne({
        where: { user_id: this.user_id, card_id: card.id },
    });

    if (userCard && userCard.amount > userCard.inDeck) {
        this.cardsInDeck += 1;
        this.save();
        userCard.inDeck += 1;
        return userCard.save();
    }
    return false;
}

Users.prototype.removeFromDeck = async function(card) {
    const userCard = await UserCards.findOne({
        where: { user_id: this.user_id, card_id: card.id },
    });

    if (userCard  && userCard.inDeck > 0) {
        this.cardsInDeck -= 1;
        this.save();
        userCard.inDeck -= 1;
        return userCard.save();
    }
    return false;
}

Users.prototype.getDeck = function() {
    return UserCards.findAll({
        where: { user_id: this.user_id, inDeck: {[Op.gt]: 0} },
        include: ['card'],
    });
};

Users.prototype.setDuel = function(value) {
    if (value == 1 || value == 0) {
        this.inDuel = value;
        return this.save();
    }
    return false;
};

Users.prototype.addCardToDuel = function(card) {
    return  DuelCards.create({ user_id: this.user_id, card_id: card.id});
};

Users.prototype.getDuelCards = function() {
    return DuelCards.findAll({
        where: {user_id: this.user_id},
        include: ['card'],
    });
};

Users.prototype.getAvailableDuelCards = function() {
    return DuelCards.findAll({
        where: {user_id: this.user_id, posX: 0, posY: 0},
        include: ['card'],
    });
};

Users.prototype.playCard = async function(duel,card,r,c) {
    // card in hand
    const usercard = await DuelCards.findOne({
        where: {user_id: this.user_id, card_id: card.id, posX: 0, posY: 0},
    })
    if(!usercard) return false;

    // place taken
    const placeTaken1 = await DuelCards.findOne({
        where: {user_id: duel.player1_id, posX: r, posY: c},
    })
    if(placeTaken1) return false;

    const placeTaken2 = await DuelCards.findOne({
        where: {user_id: duel.player2_id, posX: r, posY: c},
    })
    if(placeTaken2) return false;

    // user had card in this row/column
    const row = await DuelCards.findOne({
        where: {user_id: this.user_id, posX: r},
    })
    if(row) return false;

    const col = await DuelCards.findOne({
        where: {user_id: this.user_id, posY: c},
    })
    if(col) return false;

    usercard.posX = r;
    usercard.posY = c;
    return usercard.save();
}

Users.prototype.removeCardsFromDuel = async function() {
    cards = await DuelCards.findAll({
        where: {user_id: this.user_id},
    });
    for(i in cards) {
        cards[i].destroy();
    }
    return false;
}

Duels.prototype.calculatePoints = async function() {
    p1 = 0;
    p2 = 0;
    // body row
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posX: 1},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posX: 1},
        include: ['card'],
    })
    if (card1.card.body > card2.card.body) p1++;
    else if (card1.card.body < card2.card.body) p2++;
    // mind row
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posX: 2},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posX: 2},
        include: ['card'],
    })
    if (card1.card.mind > card2.card.mind) p1++;
    else if (card1.card.mind < card2.card.mind) p2++;
    // flair row
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posX: 3},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posX: 3},
        include: ['card'],
    })
    if (card1.card.flair > card2.card.flair) p1++;
    else if (card1.card.flair < card2.card.flair) p2++;
    // charm row
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posX: 4},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posX: 4},
        include: ['card'],
    })
    if (card1.card.charm > card2.card.charm) p1++;
    else if (card1.card.charm < card2.card.charm) p2++;
    // body col
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posY: 1},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posY: 1},
        include: ['card'],
    })
    if (card1.card.body > card2.card.body) p1++;
    else if (card1.card.body < card2.card.body) p2++;
    // mind col
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posY: 2},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posY: 2},
        include: ['card'],
    })
    if (card1.card.mind > card2.card.mind) p1++;
    else if (card1.card.mind < card2.card.mind) p2++;
    // flair col
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posY: 3},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posY: 3},
        include: ['card'],
    })
    if (card1.card.flair > card2.card.flair) p1++;
    else if (card1.card.flair < card2.card.flair) p2++;
    // charm col
    card1 = await DuelCards.findOne({
        where: {user_id: this.player1_id, posY: 4},
        include: ['card'],
    })
    card2 = await DuelCards.findOne({
        where: {user_id: this.player2_id, posY: 4},
        include: ['card'],
    })
    if (card1.card.charm > card2.card.charm) p1++;
    else if (card1.card.charm < card2.card.charm) p2++;

    return [p1,p2];
}

module.exports = { Users, CardCompendium, UserCards, Duels, DuelCards };