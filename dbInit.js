const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const CardCompendium = sequelize.import('models/CardCompendium');
sequelize.import('models/Users');
sequelize.import('models/UserCards');
sequelize.import('models/Duels');
sequelize.import('models/DuelCards');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {

    const shop = [
        // 1-5
        CardCompendium.upsert({ name: 'Giant Midget', body: 2, mind: 4, flair: 2, charm: 0 }),
        CardCompendium.upsert({ name: 'Orcish Ballerina', body: 2, mind: 0, flair: 1, charm: 3 }),
        CardCompendium.upsert({ name: 'Drunk Dragon', body: 3, mind: 4, flair: 2, charm: 2 }),
        CardCompendium.upsert({ name: 'Two-Eyed Cyclops', body: 4, mind: 1, flair: 1, charm: 1 }),
        CardCompendium.upsert({ name: 'Cheese Elemental', body: 4, mind: 0, flair: 0, charm: 3 }),
        // 6-10
        CardCompendium.upsert({ name: 'Blind Archer', body: 2, mind: 1, flair: 2, charm: 1 }),
        CardCompendium.upsert({ name: 'Crippled Swrodsman', body: 3, mind: 1, flair: 0, charm: 2 }),
        CardCompendium.upsert({ name: 'Two-Legged Spider', body: 0, mind: 1, flair: 4, charm: 2 }),
        CardCompendium.upsert({ name: 'Highly-Intelligence Ghoul', body: 3, mind: 4, flair: 1, charm: 0 }),
        CardCompendium.upsert({ name: 'Horned Bear', body: 3, mind: 0, flair: 2, charm: 1 }),
        // 11-15
        CardCompendium.upsert({ name: 'Zombie Lemur', body: 2, mind: 0, flair: 4, charm: 1 }),
        CardCompendium.upsert({ name: 'Fish Golem', body: 4, mind: 0, flair: 1, charm: 0 }),
        CardCompendium.upsert({ name: 'Cute Pirate', body: 3, mind: 2, flair: 2, charm: 4 }),
        CardCompendium.upsert({ name: 'Hairy Skeleton', body: 4, mind: 0, flair: 1, charm: 0 }),
        CardCompendium.upsert({ name: 'Ferocious Bunny', body: 4, mind: 1, flair: 5, charm: 3 }),
        //16-20
        CardCompendium.upsert({ name: 'Obese Succubus', body: 2, mind: 3, flair: 2, charm: 4 }),
        CardCompendium.upsert({ name: 'Horseless Horseman', body: 2, mind: 1, flair: 3, charm: 1 }),
        CardCompendium.upsert({ name: 'Seasick Mermaid', body: 1, mind: 2, flair: 1, charm: 4 }),
        CardCompendium.upsert({ name: 'Weremosquito', body: 0, mind: 1, flair: 4, charm: 0 }),
        CardCompendium.upsert({ name: 'Talking Horse', body: 2, mind: 3, flair: 0, charm: 2 }),
        // 21-25
        CardCompendium.upsert({ name: 'Wingless Crow', body: 0, mind: 4, flair: 4, charm: 5 }),
        CardCompendium.upsert({ name: 'Hydrofobic Shark', body: 4, mind: 1, flair: 2, charm: 1 }),
        CardCompendium.upsert({ name: 'Necrophobic Lich', body: 2, mind: 5, flair: 4, charm: 2 }),
        CardCompendium.upsert({ name: 'Nyctophobic Shadow', body: 0, mind: 4, flair: 3, charm: 1 }),
        CardCompendium.upsert({ name: 'Courageous Chicken', body: 1, mind: 1, flair: 4, charm: 3 }),
        // 26-30
        CardCompendium.upsert({ name: 'Bald Medusa', body: 1, mind: 3, flair: 3, charm: 4 }),
        CardCompendium.upsert({ name: 'Pacifist Barbarian', body: 5, mind: 0, flair: 4, charm: 4 }),
        CardCompendium.upsert({ name: 'Deaf Bard', body: 1, mind: 2, flair: 2, charm: 3 }),
        CardCompendium.upsert({ name: 'One-Headed Chimera', body: 4, mind: 1, flair: 2, charm: 1 }),
        CardCompendium.upsert({ name: 'Son Of A Bitch', body: 1, mind: 3, flair: 2, charm: 2 }),
    ];
    await Promise.all(shop);
    console.log('Database synced');
    sequelize.close();

}).catch(console.error);