var admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reading-dc6dd.firebaseio.com",
});

var db = admin.database();
var rootRef = db.ref();

var database = "";

async function ok(){
    database = await getData();
}

async function plz(){
    admin.database().ref().once("value").then((snapshot) => {
      database = snapshot.val();
    }).catch((err) => console.log(err));
}

function getData() {
  return new Promise((resolve, reject) => {
    admin.database().ref()
      .on("value", (snapshot) => {
        database = snapshot.val();
        resolve(snapshot.val());
      });
  });
}

ok();
plz();

console.log(database);
// rootRef.once('value', function(snapshot){
//     database = snapshot.val();
//     let test = database["Aladdin And The Magic Lamp"]["Text"][2];
//     //console.log(test);
//     let test2 = "CHAPTER ONE\r\nThe Book of Beasts";
//     test3 = test2.split(/\r\n/gi);
//     console.log(test3)
// })
