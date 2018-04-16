const Sequelize = require('sequelize');

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

    return UserCards.create({ user_id: this.user_id, card_id: card.id, amount: 1 });
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

Users.prototype.getCards = function() {
    return UserCards.findAll({
        where: { user_id: this.user_id },
        include: ['card'],
    });
};

module.exports = { Users, CardCompendium, UserCards };