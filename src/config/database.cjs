module.exports = {
dialect:'postgres',
host:'127.0.0.1',
port: 5432,
username:'admin',
password:'12345',
database:'dev-burguer-db',
define:{
    timestamps:true,
    underscored:true,
    underscoredAll:true,
},
};