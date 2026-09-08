// Вызови testStatistics() в DevTools браузера.
function testStatistics(){
    Statistics.Show({
        Profile:{
            Name:"Serenity_Walker",
            Id:178,
            Level:12,
            Online:true
        },

        Status:[
            {Id:"health",Title:"Здоров'я",Value:100,Max:100},
            {Id:"armor",Title:"Броня",Value:50,Max:100},
            {Id:"hunger",Title:"Голод",Value:72,Max:100}
        ],

        Statistics:[
            {Icon:"wanted",Title:"Рівень розшуку",Value:"0 / 5"}
        ],

        Skills:[]
    });
}
