module.exports = (sequelize, DataTypes) => {
    return sequelize.define('duels', {
        player1_id: DataTypes.STRING,
        player2_id: DataTypes.STRING,
        turn: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
        },
        table: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
    }, {
        timestamps: false,
    });
};