module.exports = (sequelize, DataTypes) => {
    return sequelize.define('card_compendium', {
        name: {
            type: DataTypes.STRING,
            unique: true,
        },
        body: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        mind: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        flair: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        charm: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        timestamps: false,
    });
};