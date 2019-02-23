module.exports = (sequelize, DataTypes) => {
    return sequelize.define('duel_cards', {
        user_id: DataTypes.STRING,
        card_id: DataTypes.STRING,
        posX: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        posY: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        timestamps: false,
    });
};