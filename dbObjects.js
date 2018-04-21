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

UserCards.belongsTo(CardCompendium, { foreignKey: 'card_id', as: 'card' });

Users.prototype.addCard = async function(card) {
    const userCard = await UserCards.findOne({
        where: { user_id: this.user_id, card_id: card.id },
    });

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
        userCard.amount -= 1;
        if (userCard.amount > 0) return userCard.save();
        return userCard.destroy();
    }
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

module.exports = { Users, CardCompendium, UserCards };