module.exports = (sequelize, DataTypes) => {
    return sequelize.define('users', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        numOfCards: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        cardsInDeck: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
    }, {
        timestamps: false,
    });
};